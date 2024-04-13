mod error;
mod git;
mod utils;

use db::connect_db;
use tauri::generate_handler;
use tokio::sync::Mutex;
use utils::{get_sysinfo, open_devtool};
mod download;
mod plugin;
mod service;

#[cfg(target_os = "macos")]
mod macos;
use macos::install_comfyui;
mod commands;
mod model;

use commands::{
    comfyui_exists,
    config::{get_config, get_info, set_config},
    download::{cancel, download, remove, restore},
    init_data,
    model::{get_download_model, get_model_base_groups, get_model_list, get_model_type_groups},
    plugin::{
        download_plugin, get_installed_plugins, get_plugin_list, remove_plugin, update_plugin,
    },
    startup,
};
mod db;
mod state;
use state::{ConfigState, MyConfig};
mod entity;

pub async fn start() {
    let db = connect_db().await.unwrap();
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_notification::init())
        .manage(db)
        .manage(get_sysinfo())
        .manage(MyConfig::new(Mutex::new(ConfigState::new())))
        .manage(state::DownloadState::new())
        .invoke_handler(generate_handler![
            open_devtool,
            install_comfyui,
            comfyui_exists,
            get_config,
            set_config,
            get_info,
            startup,
            // plugin
            get_plugin_list,
            download_plugin,
            update_plugin,
            // model
            download,
            cancel,
            restore,
            remove,
            get_model_list,
            remove_plugin,
            init_data,
            get_download_model,
            get_model_type_groups,
            get_model_base_groups,
            get_installed_plugins
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
