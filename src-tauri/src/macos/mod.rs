mod install_brew;
use anyhow::Context;
pub use install_brew::install_brew;
use reqwest::header::HeaderMap;
use sea_orm::DbConn;
use tauri::State;
use tracing::info;

use crate::{
    error::MyError,
    utils::{download, git},
};

#[tauri::command]
pub async fn install_comfyui() -> Result<(), MyError> {
    let path = std::env::current_dir().unwrap();
    let url = "https://github.com/comfyanonymous/ComfyUI.git";
    git::git_clone(url, path)?;
    Ok(())
}

#[tauri::command]
pub async fn download(db: State<'_, DbConn>) -> Result<(), MyError> {
    db.ping().await.unwrap();
    // let path = std::env::current_dir().unwrap();
    // let url = "https://hf-mirror.com/ai-forever/Real-ESRGAN/resolve/main/RealESRGAN_x2.pth";
    // let filename = path.join("../").join("RealESRGAN_x2.pth");
    // let start = std::time::Instant::now();
    // download::download(
    //     url.into(),
    //     filename.display().to_string(),
    //     10,
    //     1024 * 1024 * 5,
    //     3,
    //     5,
    //     HeaderMap::new(),
    //     Some(|i, a| {
    //         let elapsed = start.elapsed();

    //         let ratio: f64 = match elapsed.as_secs() {
    //             0 => 0f64,
    //             sec => i as f64 / (sec as f64 * 1024.0 * 1024.0),
    //         };

    //         info!(
    //             "downloading file: {} / {} : {:.2} MB/s",
    //             download::format_bytes(i),
    //             download::format_bytes(a),
    //             ratio
    //         )
    //     }),
    // )
    // .await?;
    // let all_time = start.elapsed();
    // info!("all time: {}/s", all_time.as_secs());
    Ok(())
}
