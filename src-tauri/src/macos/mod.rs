mod install_brew;
pub use install_brew::install_brew;

use crate::{error::MyError, utils::git};

#[tauri::command]
pub async fn install_comfyui() -> Result<(), MyError> {
    let path = std::env::current_dir().unwrap();
    let url = "https://github.com/comfyanonymous/ComfyUI.git";
    git::git_clone(url, path)?;
    Ok(())
}
