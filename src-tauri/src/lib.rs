mod error;
mod utils;
use db::connect_db;
use tauri::generate_handler;
use utils::open_devtool;

#[cfg(target_os = "macos")]
mod macos;
use macos::{download, install_brew, install_comfyui};
mod db;
mod state;

pub async fn start() {
    let db = connect_db().await.unwrap();
    tauri::Builder::default()
        .manage(db)
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_tracing::init())
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(generate_handler![
            open_devtool,
            install_brew,
            install_comfyui,
            download
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
