mod error;
mod git;
mod utils;

use db::connect_db;
use tauri::generate_handler;
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
    config::{get_config, get_info, set_config},
    download::{cancel, download, get_model_list, restore},
    git::{git_clone, git_pull},
    plugin::{download_manager, download_plugin, get_plugin_list, manager_exists, update_plugin},
    startup,
};
mod db;
mod state;
use state::ConfigState;

pub async fn start() {
    let db = connect_db().await.unwrap();
    let sys_info = get_sysinfo();
    tauri::Builder::default()
        .manage(db)
        .manage(sys_info)
        .manage(state::DownloadState::new())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(generate_handler![
            open_devtool,
            install_comfyui,
            get_config,
            set_config,
            get_info,
            startup,
            git_clone,
            git_pull,
            // plugin
            get_plugin_list,
            download_plugin,
            update_plugin,
            manager_exists,
            download_manager,
            // model
            download,
            cancel,
            restore,
            get_model_list
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
