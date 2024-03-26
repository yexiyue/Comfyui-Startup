mod error;
mod utils;
use tauri::generate_handler;
use utils::open_devtool;

#[cfg(target_os = "macos")]
mod macos;
use macos::{install_brew, install_comfyui};

pub fn start() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_tracing::init())
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(generate_handler![
            open_devtool,
            install_brew,
            install_comfyui
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
