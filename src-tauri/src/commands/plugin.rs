use std::path::Path;
use tauri::{ipc::Channel, State};
use tracing::error;

use crate::{
    error::MyError,
    plugin::{InstallType, Plugin, PluginList},
    state::ConfigState,
};

#[tauri::command]
pub fn manager_exists(config: State<'_, ConfigState>) -> Result<bool, MyError> {
    let path = &config.comfyui_path;
    let custom_nodes_path = Path::new(path)
        .join("custom_nodes")
        .join("ComfyUI-Manager")
        .join("custom-node-list.json");
    if !custom_nodes_path.exists() {
        // 插件未安装
        Ok(false)
    } else {
        Ok(true)
    }
}

#[tauri::command]
pub async fn download_manager(
    config: State<'_, ConfigState>,
    on_progress: Channel,
) -> Result<(), MyError> {
    let plugin = Plugin {
        author: "ltdrdata".to_string(),
        title: "ComfyUI-Manager".into(),
        reference: "https://github.com/ltdrdata/ComfyUI-Manager.git".into(),
        pip: None,
        files: vec![],
        install_type: InstallType::GitClone,
        description: "".into(),
    };

    let res = plugin
        .download(&config.comfyui_path, config.is_chinese(), |p| {
            on_progress
                .send((p.received_objects(), p.indexed_objects()))
                .unwrap();
            return true;
        })
        .await;
    Ok(res?)
}

#[tauri::command]
pub async fn get_plugin_list(config: State<'_, ConfigState>) -> Result<PluginList, MyError> {
    let path = &config.comfyui_path;
    let custom_nodes_path = Path::new(path)
        .join("custom_nodes")
        .join("ComfyUI-Manager")
        .join("custom-node-list.json");
    if !custom_nodes_path.exists() {
        // 插件未安装
        return Err(MyError::Code(0));
    }
    let plugin_list = PluginList::from_file(custom_nodes_path)?;
    Ok(plugin_list)
}

#[tauri::command]
pub async fn download_plugin(
    config: State<'_, ConfigState>,
    plugin: Plugin,
    on_progress: Channel,
) -> Result<(), MyError> {
    let res = plugin
        .download(&config.comfyui_path, config.is_chinese(), |p| {
            on_progress
                .send((p.received_objects(), p.indexed_objects()))
                .unwrap();
            return true;
        })
        .await;
    Ok(res?)
}

#[tauri::command]
pub async fn update_plugin(
    config: State<'_, ConfigState>,
    plugin: Plugin,
    on_progress: Channel,
) -> Result<usize, MyError> {
    let res = plugin
        .update(&config.comfyui_path, config.is_chinese(), |p| {
            on_progress
                .send((p.received_objects(), p.indexed_objects()))
                .unwrap();
            return true;
        })
        .await;
    match res {
        Ok(i) => {
            return Ok(i);
        }
        Err(e) => {
            error!("download_plugin: {e}");
            Err(MyError::Code(0))
        }
    }
}
#[tauri::command]
pub async fn remove_plugin(config: State<'_, ConfigState>, plugin: Plugin) -> Result<(), MyError> {
    plugin.remove(&config.comfyui_path).await
}
