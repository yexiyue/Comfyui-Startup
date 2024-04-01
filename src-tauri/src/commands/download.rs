use std::{borrow::BorrowMut, path::Path};

use crate::{
    download::Download,
    error::MyError,
    model::{Model, ModelList},
    service::DownloadTasksService,
    state::{ConfigState, DownloadState},
};
use anyhow::{anyhow, Context};
use sea_orm::DbConn;
use tauri::{ipc::Channel, State};
use tracing::info;

#[tauri::command]
pub async fn get_model_list(config: State<'_, ConfigState>) -> Result<ModelList, MyError> {
    let path = &config.comfyui_path;
    let custom_nodes_path = Path::new(path)
        .join("custom_nodes")
        .join("ComfyUI-Manager")
        .join("model-list.json");
    if !custom_nodes_path.exists() {
        // 插件未安装
        return Err(MyError::Code(0));
    }
    let model_list = ModelList::from_file(custom_nodes_path)?;

    Ok(model_list)
}

#[tauri::command]
pub async fn download(
    db: State<'_, DbConn>,
    download_state: State<'_, DownloadState>,
    config: State<'_, ConfigState>,
    model: Model,
    on_progress: Channel,
) -> Result<i32, MyError> {
    let path = Path::new(&config.comfyui_path);
    let filename = path.join(model.get_model_dir()).join(&model.filename);
    let url = &model.get_url(config.is_chinese());

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
            on_progress
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
    on_progress: Channel,
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
            on_progress
                .send(format!("downloading: {i}/{a}"))
                .context("send message failed")
                .unwrap();
        }
    });
    Ok("restore".into())
}
