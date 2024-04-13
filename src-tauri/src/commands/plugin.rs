use anyhow::Context;
use derive_builder::Builder;
use sea_orm::DbConn;
use serde::Serialize;
use serde_json::Value;
use std::{
    path::Path,
    sync::{atomic::AtomicBool, Arc},
    time::{Duration, Instant},
};
use tauri::{ipc::Channel, AppHandle, State};
use tokio::time::sleep;
use tracing::{error, info};

use crate::{
    entity,
    error::MyError,
    git::get_git_remotes,
    plugin::Plugin,
    service::{Pagination, PluginService},
    state::MyConfig,
};

#[derive(Debug, Serialize, Clone)]
pub enum PluginStatus {
    Success,
    Error,
    Pending,
    Downloading,
    Canceled,
}

#[derive(Debug, Serialize, Clone, Builder)]
#[builder(setter(into))]
pub struct PluginDownloadMessage {
    #[builder(default)]
    progress: Option<f64>,
    status: PluginStatus,
    #[builder(default)]
    error_message: Option<String>,
}

impl PluginDownloadMessage {
    pub fn builder() -> PluginDownloadMessageBuilder {
        PluginDownloadMessageBuilder::default()
    }
}

pub fn percent(a: usize, b: usize) -> f64 {
    (a as f64 / b as f64 * 100f64).floor()
}

#[tauri::command]
pub async fn get_plugin_list(
    db: State<'_, DbConn>,
    search: &str,
    pagination: Option<Pagination>,
) -> Result<(Vec<entity::plugin::Model>, u64), MyError> {
    Ok(PluginService::get_plugins(&db, search, pagination).await?)
}

#[tauri::command]
pub async fn download_plugin(
    app: AppHandle,
    config: State<'_, MyConfig>,
    plugin: Plugin,
    on_progress: Channel,
) -> Result<(), MyError> {
    let config = config.inner().clone();
    on_progress
        .send(
            PluginDownloadMessage::builder()
                .status(PluginStatus::Pending)
                .build()
                .unwrap(),
        )
        .context("Send Message Error")?;

    let cancel = Arc::new(AtomicBool::new(true));
    let cancel2 = cancel.clone();
    let plugin_reference = plugin.reference.clone();
    let on_progress2 = on_progress.clone();

    let handler = tokio::spawn(async move {
        let config = config.lock().await;
        let mut start_time = Instant::now();
        let mut progress = 0f64;

        match plugin
            .download(&config.comfyui_path, config.is_chinese(), |p| {
                let v = cancel2.load(std::sync::atomic::Ordering::SeqCst);
                let new_progress = percent(p.received_objects(), p.total_objects());
                // 当下载进度太快时，会发生大量消息到前端，导致阻塞，所以这里做了一个截流
                if start_time.elapsed() > Duration::from_millis(60) && progress != new_progress {
                    start_time = Instant::now();
                    progress = new_progress;
                    info!("Download Progress: {}", new_progress);
                    on_progress
                        .send(
                            PluginDownloadMessage::builder()
                                .status(PluginStatus::Downloading)
                                .progress(new_progress)
                                .build()
                                .unwrap(),
                        )
                        .unwrap();
                }
                v
            })
            .await
        {
            Ok(_) => {
                on_progress.send(100f64).unwrap();
                sleep(Duration::from_millis(500)).await;
                on_progress
                    .send(
                        PluginDownloadMessage::builder()
                            .status(PluginStatus::Success)
                            .build()
                            .unwrap(),
                    )
                    .unwrap();
            }
            Err(e) => {
                if !cancel2.load(std::sync::atomic::Ordering::SeqCst) {
                    on_progress
                        .send(
                            PluginDownloadMessage::builder()
                                .status(PluginStatus::Error)
                                .error_message(e.to_string())
                                .build()
                                .unwrap(),
                        )
                        .unwrap();
                }
            }
        }
    });

    app.listen("plugin-cancel", move |event| {
        let reference = serde_json::from_str::<Value>(event.payload()).unwrap();

        if reference["reference"] == plugin_reference
            && cancel
                .compare_exchange(
                    true,
                    false,
                    std::sync::atomic::Ordering::SeqCst,
                    std::sync::atomic::Ordering::SeqCst,
                )
                .is_ok()
        {
            on_progress2
                .send(
                    PluginDownloadMessage::builder()
                        .status(PluginStatus::Canceled)
                        .build()
                        .unwrap(),
                )
                .context("Send Message Error")
                .unwrap();
            handler.abort();
        }
    });

    Ok(())
}

#[tauri::command]
pub async fn update_plugin(
    config: State<'_, MyConfig>,
    plugin: Plugin,
    on_progress: Channel,
) -> Result<usize, MyError> {
    let config = config.lock().await;
    let mut start_time = Instant::now();
    let mut progress = 0f64;

    let res = plugin
        .update(&config.comfyui_path, config.is_chinese(), |p| {
            let new_progress = percent(p.received_objects(), p.total_objects());
            if start_time.elapsed() > Duration::from_millis(60) && progress != new_progress {
                start_time = Instant::now();
                progress = new_progress;
                on_progress
                    .send(
                        PluginDownloadMessage::builder()
                            .status(PluginStatus::Downloading)
                            .progress(new_progress)
                            .build()
                            .unwrap(),
                    )
                    .unwrap();
            }
            true
        })
        .await;

    match res {
        Ok(i) => {
            on_progress.send(100f64).unwrap();
            sleep(Duration::from_millis(500)).await;
            Ok(i)
        }
        Err(e) => {
            error!("update_plugin: {e}");
            Err(MyError::Code(0))
        }
    }
}

#[tauri::command]
pub async fn remove_plugin(config: State<'_, MyConfig>, plugin: Plugin) -> Result<(), MyError> {
    let config = config.lock().await;
    plugin.remove(&config.comfyui_path).await
}

#[tauri::command]
pub async fn get_installed_plugins(
    config: State<'_, MyConfig>,
    db: State<'_, DbConn>,
) -> Result<Vec<(String, Option<entity::plugin::Model>)>, MyError> {
    let config = config.lock().await;
    let path = &config.comfyui_path;
    let custom_nodes_path = Path::new(path).join("custom_nodes");
    let res = get_git_remotes(custom_nodes_path);
    let mut plugins = vec![];
    for i in res.iter() {
        if let Some(name) = i.split('/').last().map(|s| s.replace(".git", "")) {
            if let Some(plugin) = PluginService::get_plugin(&db, &name).await? {
                plugins.push((i.clone(), Some(plugin)));
            }
        } else {
            plugins.push((i.clone(), None));
        }
    }
    Ok(plugins)
}
