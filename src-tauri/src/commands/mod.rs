use std::path::Path;

use sea_orm::DbConn;
use tauri::State;

use crate::{
    error::MyError,
    model::{init_model_list, ModelList},
    plugin::{init_plugin_list, PluginList},
    state::MyConfig,
    utils::{Exec, SysInfo},
};

pub mod config;
pub mod download;
pub mod model;
pub mod plugin;

#[tauri::command]
pub async fn startup(info: State<'_, SysInfo>, config: State<'_, MyConfig>) -> Result<(), MyError> {
    let config = config.lock().await;
    let mut cmd = Exec::new();
    let mut cpu = false;
    if info.cpu.starts_with("Apple") && info.os == "macos" {
        cpu = true;
    }
    cmd.add(format!("cd {}", &config.comfyui_path));
    cmd.add("source venv/bin/activate");
    cmd.add(format!(
        "python main.py {}",
        if cpu { "--cpu" } else { "--force-fp16" }
    ));
    cmd.exec()?;
    Ok(())
}

#[tauri::command]
pub async fn init_data(config: State<'_, MyConfig>, db: State<'_, DbConn>) -> Result<(), MyError> {
    let config = config.lock().await;
    let path = &config.comfyui_path;
    let comfyui_manager_path = Path::new(path).join("custom_nodes").join("ComfyUI-Manager");
    if !comfyui_manager_path.exists() {
        // 插件未安装
        return Err(MyError::Code(0));
    }
    let plugin_list = PluginList::from_file(comfyui_manager_path.join("custom-node-list.json"))?;
    init_plugin_list(&db, plugin_list).await?;
    let model_list = ModelList::from_file(comfyui_manager_path.join("model-list.json"))?;
    init_model_list(&db, model_list).await?;
    Ok(())
}
