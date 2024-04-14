use reqwest::Client;
use sea_orm::DbConn;
use tauri::State;

use crate::{
    error::MyError,
    git::GITHUB_PROXY,
    model::{init_model_list, Model},
    plugin::{init_plugin_list, Plugin},
    state::MyConfig,
    utils::{Exec, SysInfo},
};

pub mod config;
pub mod download;
pub mod json_db;
pub mod model;
pub mod plugin;

#[tauri::command]
pub async fn startup(info: State<'_, SysInfo>, config: State<'_, MyConfig>) -> Result<(), MyError> {
    let config = config.lock().await;
    let mut cmd = Exec::new();
    let mut cpu = false;
    if !info.cpu.starts_with("Apple") && info.os == "macos" {
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
    let proxy = config.is_chinese();
    let client = Client::builder().user_agent("Edge").build()?;

    let prefix = if proxy {
        format!(
            "{}/https://raw.githubusercontent.com/yexiyue/Comfyui-Startup/main",
            GITHUB_PROXY
        )
    } else {
        "https://raw.githubusercontent.com/yexiyue/Comfyui-Startup/main".to_string()
    };

    let plugin_list = client
        .get(format!("{}/custom-node-list.json", prefix))
        .send()
        .await?
        .json::<Vec<Plugin>>()
        .await?;
    let model_list = client
        .get(format!("{}/model-list.json", prefix))
        .send()
        .await?
        .json::<Vec<Model>>()
        .await?;

    init_plugin_list(&db, plugin_list.into()).await?;
    init_model_list(&db, model_list.into()).await?;

    Ok(())
}

#[tauri::command]
pub async fn comfyui_exists(path: &str) -> Result<bool, MyError> {
    let path = std::path::Path::new(path).join("main.py");
    Ok(path.exists())
}
