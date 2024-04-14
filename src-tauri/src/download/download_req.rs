use anyhow::Context;
use derive_builder::Builder;
use futures::StreamExt;
use reqwest::{
    header::{HeaderMap, CONTENT_LENGTH, CONTENT_RANGE, RANGE},
    Client,
};
use thiserror::Error;
use tokio::{select, sync::mpsc::Sender};
use tokio_util::{bytes::Bytes, sync::CancellationToken};

#[derive(Debug, Error)]
pub enum DownloadReqError {
    #[error("NetWork error: {0}")]
    NetWork(#[from] reqwest::Error),
    #[error("Cancelled")]
    Canceled,
    #[error("Range not satisfiable")]
    RangeNotSatisfiable,
    #[error("Header error:{0}")]
    ToString(#[from] reqwest::header::ToStrError),
    #[error("Other error:{0}")]
    Other(#[from] anyhow::Error),
}

#[derive(Debug, Builder, Clone)]
#[builder(setter(into))]
pub struct DownloadReq {
    #[builder(default)]
    pub start: usize,
    #[builder(default)]
    pub end: usize,
    #[builder(default)]
    pub cancellation_token: CancellationToken,
    pub client: Client,
    pub url: String,
    #[builder(setter(strip_option), default)]
    pub headers: Option<HeaderMap>,
}

impl DownloadReq {
    pub fn builder() -> DownloadReqBuilder {
        DownloadReqBuilder::default()
    }

    // 分块下载
    async fn require_async(&self) -> Result<Bytes, DownloadReqError> {
        let mut response = self.client.get(&self.url);

        if self.headers.is_some() {
            response = response.headers(self.headers.as_ref().unwrap().to_owned());
        }

        let range = format!("bytes={}-{}", self.start, self.end);

        // 发起请求进行下载
        let response = response.header(RANGE, range).send().await?;
        let content = response.bytes().await?;
        Ok::<Bytes, DownloadReqError>(content)
    }

    pub async fn require(&self) -> Result<Bytes, DownloadReqError> {
        select! {
            res = self.require_async() =>{
                res
            }
            _ = self.cancellation_token.cancelled()=>{
                Err(DownloadReqError::Canceled)
            }
        }
    }

    // 单文件下载，所以使用信道进行流式下载
    async fn require_async_single(&self, sender: Sender<Bytes>) -> Result<(), DownloadReqError> {
        let mut response = self.client.get(&self.url);

        if self.headers.is_some() {
            response = response.headers(self.headers.as_ref().unwrap().to_owned());
        }
        let mut res = response.send().await?.bytes_stream();
        while let Some(bytes) = res.next().await {
            let bytes = bytes?;
            sender.send(bytes).await.context("send failed")?;
        }
        Ok(())
    }

    pub async fn require_single(&self, sender: Sender<Bytes>) -> Result<(), DownloadReqError> {
        select! {
            res = self.require_async_single(sender) =>{
                res
            }
            _ = self.cancellation_token.cancelled()=>{
                Err(DownloadReqError::Canceled)
            }
        }
    }

    pub async fn get_chunks_length(&self) -> Result<usize, DownloadReqError> {
        // 发起range请求获取文件大小
        let mut response = self.client.get(&self.url);
        if self.headers.is_some() {
            response = response.headers(self.headers.as_ref().unwrap().to_owned());
        }
        let response = response.header(RANGE, "bytes=0-0").send().await?;

        // 从请求头中获取文件大小
        let content_range = response
            .headers()
            .get(CONTENT_RANGE)
            .ok_or(DownloadReqError::RangeNotSatisfiable)?
            .to_str()?;

        let size = content_range.split('/').collect::<Vec<_>>();
        let length = size
            .last()
            .ok_or(DownloadReqError::RangeNotSatisfiable)?
            .parse::<usize>()
            .context("failed to parse content-range")?;

        Ok(length)
    }

    pub async fn get_content_info(&self) -> Result<(String, usize), DownloadReqError> {
        let mut response = self.client.head(&self.url);

        if self.headers.is_some() {
            response = response.headers(self.headers.as_ref().unwrap().to_owned());
        }
        let res = response.send().await?;
        let content_length = res
            .headers()
            .get(CONTENT_LENGTH)
            .ok_or(anyhow::anyhow!("content-length not found"))?
            .to_str()?;
        let length = content_length
            .parse::<usize>()
            .context("failed to parse content-length")?;
        let filename = self.url.split('/').last().unwrap();
        Ok((filename.into(), length))
    }

    pub fn cancel(&self) {
        self.cancellation_token.cancel();
    }

    pub fn new_cancellation(&mut self) {
        self.cancellation_token = CancellationToken::new();
    }
}
