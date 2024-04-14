use std::borrow::BorrowMut;

use crate::state::MyConfig;
use crate::{error::MyError, state::ConfigState};

use crate::utils::SysInfo;

use tauri::State;

#[tauri::command]
pub async fn get_config(state: State<'_, MyConfig>) -> Result<ConfigState, MyError> {
    let config = state.lock().await;
    let config_state = config.clone();
    Ok(config_state)
}

#[tauri::command]
pub async fn set_config(
    state: State<'_, MyConfig>,
    config_state: ConfigState,
) -> Result<(), MyError> {
    let mut config = state.lock().await;
    let new_config = config.borrow_mut();
    new_config.comfyui_path = config_state.comfyui_path;
    new_config.country = config_state.country;
    Ok(())
}

#[tauri::command]
pub async fn get_info(info: State<'_, SysInfo>) -> Result<SysInfo, MyError> {
    let info = &*info;
    Ok(info.clone())
}
