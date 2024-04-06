use anyhow::Context;
use derive_builder::Builder;
use sea_orm::DbConn;
use serde::{Deserialize, Serialize};
use std::path::Path;
use tauri::{ipc::Channel, State};
use tracing::error;

use crate::{
    entity,
    error::MyError,
    git::get_git_remotes,
    plugin::Plugin,
    service::{Pagination, PluginService},
    state::MyConfig,
};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub enum PluginStatus {
    Success,
    Error,
    Pending,
    Downloading,
    Updating,
    Canceled,
}

#[derive(Debug, Serialize, Deserialize, Clone, Builder)]
#[builder(setter(into))]
pub struct PluginDownloadMessage {
    #[builder(default)]
    progress: Option<(usize, usize)>,
    status: PluginStatus,
    #[builder(default)]
    error_message: Option<String>,
}

impl PluginDownloadMessage {
    pub fn builder() -> PluginDownloadMessageBuilder {
        PluginDownloadMessageBuilder::default()
    }
}

#[tauri::command]
pub async fn manager_exists(config: State<'_, MyConfig>) -> Result<bool, MyError> {
    let config = config.lock().await;
    let path = &config.comfyui_path;
    let comfyui_manager_path = Path::new(path).join("custom_nodes").join("ComfyUI-Manager");
    if comfyui_manager_path.exists() {
        // 插件未安装
        Ok(true)
    } else {
        Ok(false)
    }
}

#[tauri::command]
pub async fn download_manager(
    config: State<'_, MyConfig>,
    on_progress: Channel,
) -> Result<(), MyError> {
    let config = config.lock().await;
    let plugin = Plugin {
        author: "ltdrdata".to_string(),
        title: "ComfyUI-Manager".into(),
        reference: "https://github.com/ltdrdata/ComfyUI-Manager.git".into(),
        pip: None,
        files: vec![].into(),
        install_type: "git-clone".into(),
        description: "".into(),
    };

    plugin
        .download(&config.comfyui_path, config.is_chinese(), |p| {
            on_progress
                .send((p.indexed_objects(), p.total_objects()))
                .unwrap();
            return true;
        })
        .await?;
    Ok(())
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

    tokio::spawn(async move {
        let config = config.lock().await;
        match plugin
            .download(&config.comfyui_path, config.is_chinese(), |p| {
                on_progress
                    .send(
                        PluginDownloadMessage::builder()
                            .status(PluginStatus::Downloading)
                            .progress((p.indexed_objects(), p.total_objects()))
                            .build()
                            .unwrap(),
                    )
                    .unwrap();
                return true;
            })
            .await
        {
            Ok(_) => {
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
    let res = plugin
        .update(&config.comfyui_path, config.is_chinese(), |p| {
            on_progress
                .send((p.indexed_objects(), p.total_objects()))
                .unwrap();
            return true;
        })
        .await;
    match res {
        Ok(i) => {
            return Ok(i);
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
        if let Some(name) = i.split("/").last().map(|s| s.replace(".git", "")) {
            if let Some(plugin) = PluginService::get_plugin(&db, &name).await? {
                plugins.push((i.clone(), Some(plugin)));
            }
        } else {
            plugins.push((i.clone(), None));
        }
    }
    Ok(plugins)
}
