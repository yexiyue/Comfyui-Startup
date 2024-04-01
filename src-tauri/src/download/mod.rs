use crate::db::Status;
use crate::service::{DownloadChunksService, DownloadTasksService};
use anyhow::{anyhow, Context};
use futures::{stream::FuturesUnordered, StreamExt};
use rand::{thread_rng, Rng};
use sea_orm::DbConn;
use std::{io::SeekFrom, time::Duration};
use std::{path::Path, sync::Arc};
use thiserror::Error;
use tokio_util::bytes::Bytes;

use tokio::{
    io::{AsyncSeekExt, AsyncWriteExt},
    sync::{mpsc::Sender, AcquireError, Semaphore, TryAcquireError},
    time::sleep,
};

pub use self::download_req::{DownloadReq, DownloadReqError};
use derive_builder::Builder;
mod download_req;

const BASE_WAIT_TIME: usize = 300;
const MAX_WAIT_TIME: usize = 10_000;

// 随机函数
fn jitter() -> usize {
    thread_rng().gen_range(0..=500)
}

// 指数退避
fn exponential_backoff(basic_wait_time: usize, n: usize, max: usize) -> usize {
    (basic_wait_time + n.pow(2) + jitter()).min(max)
}

#[derive(Debug, Error)]
pub enum DownloadError {
    #[error("CanceledError")]
    Canceled,
    #[error("MaxRetriesError:{0}")]
    MaxRetries(String),
    #[error("ExceedingParallelFailures:{0}")]
    ExceedingParallelFailures(#[from] TryAcquireError),
    #[error("ExceedingMaxFiles:{0}")]
    ExceedingMaxFiles(#[from] AcquireError),
    #[error(transparent)]
    DownloadReqError(#[from] DownloadReqError),
    #[error(transparent)]
    Io(#[from] std::io::Error),
    #[error(transparent)]
    Db(#[from] sea_orm::DbErr),
    #[error(transparent)]
    Other(#[from] anyhow::Error),
}

#[derive(Debug, Builder, Clone)]
#[builder(setter(into))]
pub struct Download {
    task_id: i32,
    req: DownloadReq,
    filename: String,
    // 最多允许下载的连接数
    #[builder(default = "10")]
    max_files: usize,
    #[builder(default = "1024*1024")]
    chunk_size: usize,
    #[builder(default = "3")]
    parallel_failures: usize,
    // 最大重试用次数
    #[builder(default = "5")]
    max_retries: usize,
    #[builder(setter(custom))]
    db: DbConn,
    sender: Option<Sender<(usize, usize)>>,
    #[builder(default = "false")]
    signal: bool,
}

impl DownloadBuilder {
    pub fn db(&mut self, db: &DbConn) -> &mut Self {
        self.db = Some(db.clone());
        self
    }
}

impl Download {
    pub async fn new(
        db: &DbConn,
        url: &str,
        filename: &str,
    ) -> anyhow::Result<(i32, DownloadBuilder)> {
        let client = reqwest::Client::builder()
            .http2_keep_alive_timeout(Duration::from_secs(15))
            .build()?;
        let req = DownloadReq::builder().client(client).url(url).build()?;
        let length = req.get_content_info().await?.1;
        let task_id = DownloadTasksService::create(
            &db,
            entity::download_tasks::Model {
                id: 0,
                url: url.into(),
                filename: filename.into(),
                downloaded_size: 0,
                total_size: length as i64,
                status: Some(Status::Running.into()),
                created_at: None,
                updated_at: None,
            },
        )
        .await?;
        let download = Self::builder()
            .db(db)
            .req(req)
            .filename(filename)
            .task_id(task_id)
            .clone();
        Ok((task_id, download))
    }

    // 分块下载
    async fn download_async(&self, length: usize) -> Result<(), DownloadError> {
        // futures集合
        let mut handlers = FuturesUnordered::new();

        // 信号量，控制最大并发数
        let semaphore = Arc::new(Semaphore::new(self.max_files));
        let parallel_failures_semaphore = Arc::new(Semaphore::new(self.parallel_failures));

        for start in (0..length).step_by(self.chunk_size) {
            let stop = std::cmp::min(start + self.chunk_size - 1, length);

            let semaphore = semaphore.clone();
            let parallel_failures_semaphore = parallel_failures_semaphore.clone();
            let mut download_chunk = self.req.clone();
            download_chunk.start = start;
            download_chunk.end = stop;
            let parallel_failures = self.parallel_failures;
            let max_retries = self.max_retries;
            let chunk_id = DownloadChunksService::create(
                &self.db,
                entity::download_chunks::Model {
                    id: 0,
                    task_id: self.task_id,
                    start: start as i64,
                    end: stop as i64,
                    downloaded: false,
                },
            )
            .await?;

            handlers.push(tokio::spawn(async move {
                let permit = semaphore.acquire_owned().await?;

                let mut chunk = download_chunk.require().await;

                let mut i = 0;
                if parallel_failures > 0 {
                    // 如果请求发生错误
                    while let Err(ref e) = chunk {
                        if let DownloadReqError::Canceled = e {
                            return Err(DownloadError::Canceled);
                        }
                        // 如果大于了最大尝试次数
                        if i >= max_retries {
                            return Err(DownloadError::MaxRetries(format!(
                                "Failed after too many retries ({:?}): {e:?}",
                                max_retries
                            )));
                        }

                        let parallel_failures_permit =
                            parallel_failures_semaphore.clone().try_acquire_owned()?;
                        let wait_time = exponential_backoff(BASE_WAIT_TIME, i, MAX_WAIT_TIME);
                        sleep(Duration::from_millis(wait_time as u64)).await;
                        chunk = download_chunk.require().await;
                        i += 1;
                        drop(parallel_failures_permit);
                    }
                }
                drop(permit);
                Ok((chunk?, start, chunk_id))
            }));
        }

        let filename = catch_file(&self.filename)?;
        let mut file = tokio::fs::File::create(&filename).await?;

        let mut has_downloaded_bytes = 0;
        // 收集结果并调用回掉函数
        while let Some(res) = handlers.next().await {
            let (bytes, start, id) = res.context("join failed")??;
            file.seek(SeekFrom::Start(start as u64)).await?;
            file.write_all(&bytes).await?;
            file.flush().await?;
            DownloadChunksService::update(&self.db, id, true).await?;
            has_downloaded_bytes += bytes.len();
            if let Some(sender) = &self.sender {
                sender
                    .send((has_downloaded_bytes, length))
                    .await
                    .context("send failed")?;
            }
            DownloadTasksService::update(
                &self.db,
                self.task_id,
                Some(has_downloaded_bytes as i64),
                Some(Status::Running.into()),
            )
            .await?;
        }

        Ok(())
    }

    // 单独流式下载
    async fn download_single_async(&self, length: usize) -> Result<(), DownloadError> {
        let (tx, mut rx) = tokio::sync::mpsc::channel::<Bytes>(50);
        let filename = catch_file(&self.filename)?;
        let mut file = tokio::fs::File::create(&filename).await?;
        let sender = self.sender.clone();

        let task_id = self.task_id;
        let db = self.db.clone();

        let handle = tokio::spawn(async move {
            let mut has_downloaded_bytes = 0;

            while let Some(bytes) = rx.recv().await {
                file.write_all(&bytes).await?;
                has_downloaded_bytes += bytes.len();
                if let Some(sender) = &sender {
                    sender
                        .send((has_downloaded_bytes, length))
                        .await
                        .context("send failed")?;
                }
                DownloadTasksService::update(
                    &db,
                    task_id,
                    Some(has_downloaded_bytes as i64),
                    Some(Status::Running.into()),
                )
                .await?;
            }
            file.flush().await?;
            Ok::<(), DownloadError>(())
        });

        let (first, second) = tokio::join!(handle, self.req.require_single(tx));

        first.context("join failed")??;
        match second {
            Ok(_) => Ok(()),
            Err(e) => {
                if let DownloadReqError::Canceled = e {
                    return Err(DownloadError::Canceled);
                }
                Err(DownloadError::DownloadReqError(e))
            }
        }
    }

    pub fn cancel(&self) {
        self.req.cancel();
    }

    // 包装一下，默认分块下载，如果不支持自动切换流式下载
    pub async fn download(&self) -> Result<(), DownloadError> {
        let (_, length) = self.req.get_content_info().await?;
        let require;
        if self.signal {
            require = self.download_single_async(length).await;
        } else {
            match self.req.get_chunks_length().await {
                Ok(length) => {
                    require = self.download_async(length).await;
                }
                Err(e) => match e {
                    DownloadReqError::RangeNotSatisfiable => {
                        require = self.download_single_async(length).await;
                    }
                    _ => {
                        return Err(DownloadError::DownloadReqError(e));
                    }
                },
            }
        }

        self.process_res(require).await
    }

    pub fn builder() -> DownloadBuilder {
        DownloadBuilder::default()
    }

    // 重新下载
    async fn restore_async(&self, length: usize) -> Result<(), DownloadError> {
        // futures集合
        let mut handlers = FuturesUnordered::new();

        // 信号量，控制最大并发数
        let semaphore = Arc::new(Semaphore::new(self.max_files));
        let parallel_failures_semaphore = Arc::new(Semaphore::new(self.parallel_failures));

        // 从数据库中找到没有下载的分块
        let chunks = DownloadChunksService::find_all_not_downloaded(&self.db, self.task_id).await?;

        for entity::download_chunks::Model { id, start, end, .. } in chunks {
            let semaphore = semaphore.clone();
            let parallel_failures_semaphore = parallel_failures_semaphore.clone();
            let mut download_chunk = self.req.clone();
            download_chunk.start = start as usize;
            download_chunk.end = end as usize;
            let parallel_failures = self.parallel_failures;
            let max_retries = self.max_retries;
            let chunk_id = id;

            handlers.push(tokio::spawn(async move {
                let permit = semaphore.acquire_owned().await?;

                let mut chunk = download_chunk.require().await;

                let mut i = 0;
                if parallel_failures > 0 {
                    // 如果请求发生错误
                    while let Err(ref e) = chunk {
                        if let DownloadReqError::Canceled = e {
                            return Err(DownloadError::Canceled);
                        }
                        // 如果大于了最大尝试次数
                        if i >= max_retries {
                            return Err(DownloadError::MaxRetries(format!(
                                "Failed after too many retries ({:?}): {e:?}",
                                max_retries
                            )));
                        }

                        let parallel_failures_permit =
                            parallel_failures_semaphore.clone().try_acquire_owned()?;
                        let wait_time = exponential_backoff(BASE_WAIT_TIME, i, MAX_WAIT_TIME);
                        sleep(Duration::from_millis(wait_time as u64)).await;
                        chunk = download_chunk.require().await;
                        i += 1;
                        drop(parallel_failures_permit);
                    }
                }
                drop(permit);
                Ok((chunk?, start, chunk_id))
            }));
        }

        let filename = catch_file(&self.filename)?;

        // 追加方式打开文件
        let mut file = tokio::fs::OpenOptions::new()
            .append(true)
            .write(true)
            .open(&filename)
            .await?;

        // 查找停止前的下载量
        let task = DownloadTasksService::find_by_id(&self.db, self.task_id).await?;
        let mut has_downloaded_bytes = task.downloaded_size as usize;

        // 收集结果发送消息
        while let Some(res) = handlers.next().await {
            let (bytes, start, id) = res.context("join failed")??;
            file.seek(SeekFrom::Start(start as u64)).await?;
            file.write_all(&bytes).await?;
            file.flush().await?;
            DownloadChunksService::update(&self.db, id, true).await?;
            has_downloaded_bytes += bytes.len();
            if let Some(sender) = &self.sender {
                sender
                    .send((has_downloaded_bytes, length))
                    .await
                    .context("send failed")?;
            }
            DownloadTasksService::update(
                &self.db,
                self.task_id,
                Some(has_downloaded_bytes as i64),
                Some(Status::Running.into()),
            )
            .await?;
        }

        Ok(())
    }

    pub async fn restore(&self) -> Result<(), DownloadError> {
        let (_, length) = self.req.get_content_info().await?;
        let require;
        if self.signal {
            // 如果是流式单独下载则直接从新下载
            require = self.download_single_async(length).await;
        } else {
            match self.req.get_chunks_length().await {
                Ok(length) => {
                    require = self.restore_async(length).await;
                }
                Err(e) => match e {
                    DownloadReqError::RangeNotSatisfiable => {
                        require = self.restore_async(length).await;
                    }
                    _ => {
                        return Err(DownloadError::DownloadReqError(e));
                    }
                },
            }
        }

        self.process_res(require).await
    }

    async fn process_res(&self, req: Result<(), DownloadError>) -> Result<(), DownloadError> {
        match req {
            Ok(_) => {
                let filename = catch_file(&self.filename)?;
                tokio::fs::copy(&filename, &self.filename).await?;
                tokio::fs::remove_file(&filename).await?;
                DownloadTasksService::update(
                    &self.db,
                    self.task_id,
                    None,
                    Some(Status::Success.into()),
                )
                .await?;
                Ok(())
            }
            Err(e) => match e {
                DownloadError::Canceled => {
                    DownloadTasksService::update(
                        &self.db,
                        self.task_id,
                        None,
                        Some(Status::Paused.into()),
                    )
                    .await?;
                    return Err(e);
                }
                other => {
                    DownloadTasksService::update(
                        &self.db,
                        self.task_id,
                        None,
                        Some(Status::Failed.into()),
                    )
                    .await?;
                    return Err(other);
                }
            },
        }
    }

    pub fn new_cancellation(&mut self) {
        self.req.new_cancellation();
    }

    pub fn from_task(
        task: entity::download_tasks::Model,
        db: &DbConn,
        sender: Sender<(usize, usize)>,
    ) -> anyhow::Result<Self> {
        let req = DownloadReq::builder()
            .url(task.url)
            .client(
                reqwest::Client::builder()
                    .http2_keep_alive_timeout(Duration::from_secs(15))
                    .build()?,
            )
            .build()?;
        let download = Download::builder()
            .task_id(task.id)
            .req(req)
            .db(db)
            .filename(task.filename)
            .sender(sender)
            .build()?;
        Ok(download)
    }

    pub fn set_sender(&mut self, sender: Sender<(usize, usize)>) {
        self.sender = Some(sender);
    }
}


fn catch_file(filepath: &str) -> anyhow::Result<String> {
    let path = Path::new(filepath);
    if path.is_dir() {
        return Err(anyhow!("filepath is a directory"));
    }
    // 创建父目录
    if let Some(parent) = path.parent() {
        if !parent.exists() {
            std::fs::create_dir_all(parent)?;
        }
    }
    let filename = path
        .file_name()
        .context("filename is not valid")?
        .to_str()
        .context("filename is not valid")?;
    let dir = std::env!("HOME");
    let cache_dir = format!("{dir}/.cache/comfyui-startup");
    let cache_dir = Path::new(&cache_dir);
    // 创建缓存目录
    if !cache_dir.exists() {
        std::fs::create_dir_all(cache_dir)?;
    }
    let cache_file = format!("{}/{filename}", &cache_dir.display());
    Ok(cache_file)
}
