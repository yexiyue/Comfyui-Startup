use std::{
    borrow::BorrowMut,
    path::{Path, PathBuf},
    str::FromStr,
    time::Duration,
};

use crate::{
    db::Status,
    download::{cache_file, Download, DownloadError},
    error::MyError,
    model::Model,
    service::DownloadTasksService,
    state::{DownloadState, MyConfig},
};
use anyhow::{anyhow, Context};
use derive_builder::Builder;
use sea_orm::DbConn;
use serde::Serialize;
use tauri::{ipc::Channel, State};
use tracing::info;

#[derive(Debug, Serialize, Clone, Builder)]
#[builder(setter(into))]
pub struct DownloadMessage {
    #[builder(default)]
    progress: Option<(usize, usize)>,
    #[builder(default)]
    speed: Option<f64>,
    status: Status,
    #[builder(default)]
    error_message: Option<String>,
}

impl DownloadMessage {
    pub fn builder() -> DownloadMessageBuilder {
        DownloadMessageBuilder::default()
    }
}

#[tauri::command]
pub async fn download(
    db: State<'_, DbConn>,
    download_state: State<'_, DownloadState>,
    state: State<'_, MyConfig>,
    model: Model,
    on_progress: Channel,
) -> Result<i32, MyError> {
    let config = state.lock().await;
    let path = Path::new(&config.comfyui_path);
    let filename = path.join(model.get_model_dir()).join(&model.filename);
    let url = &model.get_url(config.is_chinese());

    let (tx, mut rx) = tokio::sync::mpsc::channel(10);

    let (task_id, mut download) =
        Download::new(&db, url, &filename.display().to_string(), &model.url).await?;
    info!("taskId = {}", task_id);
    let download = download.sender(tx).build().context("创建下载任务失败")?;

    let state = download_state.clone();
    let mut state = state.lock().await;
    let state = state.borrow_mut();
    state.insert(task_id, download.clone());
    let on_progress2 = on_progress.clone();

    tokio::spawn(async move {
        let time = std::time::Instant::now();
        match download.download().await {
            Ok(_) => {
                on_progress2.send(DownloadMessage::builder().status(Status::Success).build()?)?;
            }
            Err(e) => match e {
                DownloadError::Canceled => {
                    on_progress2
                        .send(DownloadMessage::builder().status(Status::Paused).build()?)?;
                }
                other => {
                    on_progress2.send(
                        DownloadMessage::builder()
                            .status(Status::Failed)
                            .error_message(other.to_string())
                            .build()?,
                    )?;
                }
            },
        }

        info!("download time = {:?}/s", time.elapsed().as_secs_f64());
        Ok::<(), anyhow::Error>(())
    });

    on_progress
        .send(
            DownloadMessage::builder()
                .status(Status::Pending)
                .build()
                .unwrap(),
        )
        .unwrap();

    tokio::spawn(async move {
        let mut start_time = std::time::Instant::now();
        // 记录17次60毫秒的速度，这样求出的数度更平稳
        let mut queue_list = vec![];
        let mut last_a = 0f64;
        while let Some((a, b)) = rx.recv().await {
            if start_time.elapsed() > Duration::from_millis(60) {
                let speed = if a == 0 {
                    0f64
                } else {
                    queue_list.push(((a as f64 - last_a), start_time.elapsed().as_secs_f64()));

                    if queue_list.len() > 30 {
                        queue_list.remove(0);
                    }
                    (queue_list.iter().map(|x| x.0).sum::<f64>()
                        / queue_list.iter().map(|x| x.1).sum::<f64>())
                    .floor()
                };

                start_time = std::time::Instant::now();
                last_a = a as f64;
                on_progress
                    .send(
                        DownloadMessage::builder()
                            .status(Status::Running)
                            .progress((a, b))
                            .speed(speed)
                            .build()
                            .unwrap(),
                    )
                    .unwrap();
            }
        }
    });

    Ok(task_id)
}

#[tauri::command]
pub async fn cancel(task_id: i32, download_state: State<'_, DownloadState>) -> Result<(), MyError> {
    let mut state = download_state.lock().await;
    let state = state.borrow_mut();
    if let Some(download) = state.get(&task_id) {
        download.cancel();
        Ok(())
    } else {
        Err(anyhow!("Task not found").into())
    }
}

#[tauri::command]
pub async fn restore(
    task_id: i32,
    db: State<'_, DbConn>,
    download_state: State<'_, DownloadState>,
    on_progress: Channel,
) -> Result<(), MyError> {
    let mut state = download_state.lock().await;
    let state = state.borrow_mut();
    //重新生成信道
    let (tx, mut rx) = tokio::sync::mpsc::channel(10);
    info!("restore taskId = {}", task_id);
    // 获取上一次的下载进度
    let task = DownloadTasksService::find_by_id(&db, task_id).await?;
    let downloaded_size = task.downloaded_size;

    // 如果有直接克隆，没有就查找数据库然后创建
    let download = if let Some(download) = state.get(&task_id) {
        let mut download = download.clone();
        download.new_cancellation();
        download.set_sender(tx);
        download
    } else {
        Download::from_task(task, &db, tx)?
    };

    // 然后更新状态
    state.insert(task_id, download.clone());

    let on_progress2 = on_progress.clone();

    tokio::spawn(async move {
        match download.restore().await {
            Ok(_) => {
                on_progress2.send(DownloadMessage::builder().status(Status::Success).build()?)?;
            }
            Err(e) => match e {
                DownloadError::Canceled => {
                    on_progress2
                        .send(DownloadMessage::builder().status(Status::Paused).build()?)?;
                }
                other => {
                    on_progress2.send(
                        DownloadMessage::builder()
                            .status(Status::Failed)
                            .error_message(other.to_string())
                            .build()?,
                    )?;
                }
            },
        }
        Ok::<(), anyhow::Error>(())
    });

    on_progress
        .send(
            DownloadMessage::builder()
                .status(Status::Pending)
                .build()
                .unwrap(),
        )
        .unwrap();

    tokio::spawn(async move {
        let mut start_time = std::time::Instant::now();
        // 记录17次60毫秒的速度，这样求出的数度更平稳
        let mut queue_list = vec![];
        let mut last_a = downloaded_size as f64;
        while let Some((a, b)) = rx.recv().await {
            if start_time.elapsed() > Duration::from_millis(60) {
                let speed = if a == 0 {
                    0f64
                } else {
                    queue_list.push(((a as f64 - last_a), start_time.elapsed().as_secs_f64()));

                    if queue_list.len() > 30 {
                        queue_list.remove(0);
                    }
                    (queue_list.iter().map(|x| x.0).sum::<f64>()
                        / queue_list.iter().map(|x| x.1).sum::<f64>())
                    .floor()
                };
                start_time = std::time::Instant::now();
                last_a = a as f64;
                on_progress
                    .send(
                        DownloadMessage::builder()
                            .status(Status::Running)
                            .progress((a, b))
                            .speed(speed)
                            .build()
                            .unwrap(),
                    )
                    .unwrap();
            }
        }
    });

    Ok(())
}

#[tauri::command]
pub async fn remove(
    url: &str,
    download_state: State<'_, DownloadState>,
    db: State<'_, DbConn>,
) -> Result<(), MyError> {
    let mut state = download_state.lock().await;
    let state = state.borrow_mut();
    let task = DownloadTasksService::find_by_url(&db, url).await?;
    if let Some(download) = state.get(&task.id) {
        download.cancel();
    }
    DownloadTasksService::delete(&db, task.id).await?;
    match task.status {
        Some(status) => {
            let success: String = Status::Success.into();
            let path = if status == success {
                PathBuf::from_str(&task.filename)?
            } else {
                let file_path = cache_file(&task.filename)?;
                PathBuf::from_str(&file_path)?
            };
            if path.exists() {
                tokio::fs::remove_file(path).await?;
            }
            Ok(())
        }
        None => Err(anyhow!("Task not found").into()),
    }
}
