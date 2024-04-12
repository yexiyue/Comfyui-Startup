use anyhow::{anyhow, Result};
use futures::future::join_all;
use once_cell::sync::Lazy;
use reqwest::Client;
use serde_json::Value;
use std::{path::Path, time::Duration};
use tokio::{join, time::sleep};
use tracing::{error, info, warn};

#[cfg(feature = "baidu")]
mod baidu;
#[cfg(feature = "baidu")]
use baidu::trans;

#[cfg(feature = "tencent")]
mod tencent;
#[cfg(feature = "tencent")]
use tencent::trans;

static CLIENT: Lazy<Client> = Lazy::new(|| {
    Client::builder()
        .connect_timeout(Duration::from_secs(15))
        .build()
        .unwrap()
});

/**
 批量翻译任务
 - url: 待翻译的json文件地址
 - target_field: 待翻译的字段
 - path: 翻译结果保存路径
 - from: 源语言
 - to: 目标语言
 - field: 对象中的数组字段名，为None时表示整个对象是个数组
*/
pub async fn run<P: AsRef<Path>>(
    url: &str,
    target_field: &str,
    path: P,
    from: &str,
    to: &str,
    field: Option<&str>,
) -> Result<()> {
    let custom_nodes: Value = CLIENT.get(url).send().await?.json().await?;
    let nodes = if field.is_some() {
        &custom_nodes[field.unwrap()]
    } else {
        &custom_nodes
    };
    let nodes = nodes.as_array().ok_or(anyhow!("no nodes"))?;

    let mut new_nodes = nodes.clone();
    let time = std::time::Instant::now();

    for i in (0..new_nodes.len()).step_by(5) {
        let time = std::time::Instant::now();
        let last = std::cmp::min(i + 5, new_nodes.len());
        let tasks = &mut new_nodes[i..last];
        let tasks = tasks.iter_mut().map(|node| async move {
            let src = node[target_field]
                .as_str()
                .ok_or(anyhow!("no description"))?;

            let zh = match trans(src, from, to).await {
                Ok(zh) => zh,
                Err(e) => {
                    error!("{}", e);
                    return Err(e);
                }
            };
            info!("{} -> {}", src, zh);
            node[format!("{to}_{target_field}")] = zh;
            Ok::<(), anyhow::Error>(())
        });

        join!(join_all(tasks), sleep(Duration::from_secs(3)));
        warn!("one task time:{:?}", time.elapsed());
    }
    info!("all time: {:?}", time.elapsed());
    let file = std::fs::File::create(&path)?;
    serde_json::to_writer_pretty(file, &new_nodes)?;
    info!("write to {}", path.as_ref().display().to_string());
    Ok(())
}
