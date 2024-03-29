mod install_brew;

use std::borrow::BorrowMut;

use super::state::DownloadState;
use crate::{download::Download, error::MyError, service::DownloadTasksService, utils::git};
use anyhow::{anyhow, Context};
pub use install_brew::install_brew;
use sea_orm::DbConn;
use tauri::{ipc::Channel, State};
use tracing::info;

#[tauri::command]
pub async fn install_comfyui() -> Result<(), MyError> {
    let path = std::env::current_dir().unwrap();
    let url = "https://github.com/comfyanonymous/ComfyUI.git";
    git::git_clone(url, path)?;
    Ok(())
}

#[tauri::command]
pub async fn download(
    db: State<'_, DbConn>,
    download_state: State<'_, DownloadState>,
    channel: Channel,
) -> Result<i32, MyError> {
    let path = std::env::current_dir().unwrap();
    let url =
        "https://hf-mirror.com/stabilityai/stable-cascade/resolve/main/stage_b_lite.safetensors";
    let filename = path.join("../").join("stage_b_lite.safetensors");
    let start = std::time::Instant::now();
    let (tx, mut rx) = tokio::sync::mpsc::channel(1);

    let (task_id, mut download) = Download::new(&db, url, &filename.display().to_string()).await?;
    let download = download
        .sender(tx)
        .max_files(100usize)
        // .signal(true)
        .build()
        .context("创建下载任务失败")?;
    let state = download_state.clone();
    let mut state = state.lock().await;
    let state = state.borrow_mut();
    state.insert(task_id, download.clone());
    tokio::spawn(async move {
        while let Some((i, a)) = rx.recv().await {
            info!("downloading: {i}/{a}");
            channel
                .send(format!("downloading: {i}/{a}"))
                .context("send message failed")
                .unwrap();
        }
    });
    tokio::spawn(async move {
        if let Ok(_) = download.download().await {
            let all_time = start.elapsed();
            info!("all time: {}/s", all_time.as_secs());
        }
    });
    Ok(task_id)
}

#[tauri::command]
pub async fn cancel(
    task_id: i32,
    download_state: State<'_, DownloadState>,
) -> Result<String, MyError> {
    let mut state = download_state.lock().await;
    let state = state.borrow_mut();
    if let Some(download) = state.get(&task_id) {
        download.cancel();
        Ok("Canceled".into())
    } else {
        Err(anyhow!("Task not found").into())
    }
}

#[tauri::command]
pub async fn restore(
    task_id: i32,
    db: State<'_, DbConn>,
    download_state: State<'_, DownloadState>,
    channel: Channel,
) -> Result<String, MyError> {
    let mut state = download_state.lock().await;
    let state = state.borrow_mut();
    //重新生成信道
    let (tx, mut rx) = tokio::sync::mpsc::channel(1);

    // 如果有直接克隆，没有就查找数据库然后创建
    let download = if let Some(download) = state.get(&task_id) {
        let mut download = download.clone();
        download.new_cancellation();
        download.set_sender(tx);
        download
    } else {
        let task = DownloadTasksService::find_by_id(&db, task_id).await?;
        Download::from_task(task, &db, tx)?
    };
    // 然后更新状态
    state.insert(task_id, download.clone());

    tokio::spawn(async move {
        download.restore().await.map_err(|e| anyhow!(e))?;
        Ok::<(), MyError>(())
    });

    tokio::spawn(async move {
        while let Some((i, a)) = rx.recv().await {
            info!("downloading: {i}/{a}");
            channel
                .send(format!("downloading: {i}/{a}"))
                .context("send message failed")
                .unwrap();
        }
    });
    Ok("restore".into())
}
