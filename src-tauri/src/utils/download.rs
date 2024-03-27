use anyhow::{anyhow, bail, Context, Result};
use futures::{stream::FuturesUnordered, StreamExt};
use rand::{thread_rng, Rng};
use reqwest::{
    header::{HeaderMap, CONTENT_RANGE, CONTENT_TYPE, RANGE},
    Client,
};
use std::{io::SeekFrom, path::Path, sync::Arc, time::Duration};
use tokio::{
    io::{AsyncSeekExt, AsyncWriteExt},
    sync::Semaphore,
    time::sleep,
};
use tracing::info;

const BASE_WAIT_TIME: usize = 300;
const MAX_WAIT_TIME: usize = 10_000;

async fn download_chunk<P: AsRef<Path>>(
    client: &Client,
    url: &str,
    filename: P,
    start: usize,
    stop: usize,
    headers: HeaderMap,
) -> Result<()> {
    let range = format!("bytes={}-{}", start, stop);
    // 打开文件
    let mut file = tokio::fs::OpenOptions::new()
        .append(true)
        .write(true)
        .open(filename)
        .await?;
    // 修改读写位置
    file.seek(SeekFrom::Start(start as u64)).await?;

    // 发起请求进行下载
    let response = client
        .get(url)
        .headers(headers)
        .header(RANGE, range)
        .send()
        .await?;
    let content = response.bytes().await?;
    file.write_all(&content).await?;
    Ok(())
}

// 随机函数
fn jitter() -> usize {
    thread_rng().gen_range(0..=500)
}

// 指数退避
fn exponential_backoff(basic_wait_time: usize, n: usize, max: usize) -> usize {
    (basic_wait_time + n.pow(2) + jitter()).min(max)
}

async fn download_async<F: Fn(usize, usize)>(
    url: String,
    filename: String,
    max_files: usize,
    chunk_size: usize,
    parallel_failures: usize,
    max_retries: usize,
    headers: HeaderMap,
    callback: Option<F>,
) -> Result<()> {
    // 创建client
    let client = Client::builder()
        .http2_keep_alive_timeout(Duration::from_secs(15))
        .build()?;

    // 发起range请求获取文件大小
    let response = client
        .get(&url)
        .headers(headers.clone())
        .header(RANGE, "bytes=0-0")
        .send()
        .await?;

    // 从请求头中获取文件大小
    let content_range = response
        .headers()
        .get(CONTENT_RANGE)
        .ok_or(anyhow!("Content-Range header not found"))?
        .to_str()?;

    let size = content_range.split("/").collect::<Vec<_>>();
    let length = size
        .last()
        .ok_or(anyhow!("Content-Range header not found"))?
        .parse::<usize>()?;

    // futures集合
    let mut handlers = FuturesUnordered::new();
    tokio::fs::File::create(&filename).await?;
    // 信号量，控制最大并发数
    let semaphore = Arc::new(Semaphore::new(max_files));
    let parallel_failures_semaphore = Arc::new(Semaphore::new(parallel_failures));

    for start in (0..length).step_by(chunk_size) {
        let url = url.clone();
        let filename = filename.clone();
        let client = client.clone();
        let headers = headers.clone();

        let stop = std::cmp::min(start + chunk_size - 1, length);

        let semaphore = semaphore.clone();
        let parallel_failures_semaphore = parallel_failures_semaphore.clone();

        handlers.push(tokio::spawn(async move {
            let permit = semaphore.acquire_owned().await?;
            let mut chunk =
                download_chunk(&client, &url, &filename, start, stop, headers.clone()).await;
            let mut i = 0;
            if parallel_failures > 0 {
                // 如果请求发生错误
                while let Err(ref e) = chunk {
                    // 如果大于了最大尝试次数
                    if i >= max_retries {
                        bail!("Failed after too many retries ({max_retries:?}): {e:?}")
                    }

                    let parallel_failures_permit = parallel_failures_semaphore
                        .clone()
                        .try_acquire_owned()
                        .context(format!(
                            "Failed too many failures in parallel ({parallel_failures:?}): {e:?}"
                        ))?;
                    let wait_time = exponential_backoff(BASE_WAIT_TIME, i, MAX_WAIT_TIME);
                    sleep(Duration::from_millis(wait_time as u64)).await;
                    chunk = download_chunk(&client, &url, &filename, start, stop, headers.clone())
                        .await;
                    i += 1;
                    drop(parallel_failures_permit);
                }
            }
            drop(permit);
            chunk.and(Ok(stop - start))
        }));
    }

    let mut has_downloaded_bytes = 0;
    // 收集结果并调用回掉函数
    while let Some(res) = handlers.next().await {
        let res = res??;
        if let Some(callback) = &callback {
            has_downloaded_bytes += res;
            callback(has_downloaded_bytes, length);
        }
    }
    Ok(())
}

pub async fn download<F: Fn(usize, usize)>(
    url: String,
    filename: String,
    max_files: usize,
    chunk_size: usize,
    parallel_failures: usize,
    max_retries: usize,
    headers: HeaderMap,
    callback: Option<F>,
) -> Result<()> {
    if parallel_failures > max_files {
        bail!("parallel_failures cannot be greater than max_files")
    }

    if (parallel_failures == 0) != (max_retries == 0) {
        bail!("For retry mechanism you need to set both `parallel_failures` and `max_retries`")
    }

    download_async(
        url,
        filename.clone(),
        max_files,
        chunk_size,
        parallel_failures,
        max_retries,
        headers,
        callback,
    )
    .await
    .map_err(|e| {
        let path = Path::new(&filename);
        if path.exists() {
            match std::fs::remove_file(path) {
                Ok(_) => e,
                Err(e) => anyhow!("Failed to remove file: {e}"),
            }
        } else {
            e
        }
    })
}

pub fn format_bytes(bytes: usize) -> String {
    const MB: usize = 1024 * 1024;
    const GB: usize = MB * 1024;

    if bytes >= GB {
        format!("{:.2} GB", bytes as f64 / GB as f64)
    } else if bytes >= MB {
        format!("{:.2} MB", bytes as f64 / MB as f64)
    } else {
        format!("{} bytes", bytes)
    }
}
