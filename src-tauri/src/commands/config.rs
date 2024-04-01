use crate::{error::MyError, state::ConfigState};

use crate::utils::SysInfo;

use tauri::{AppHandle, Manager, State};

#[tauri::command]
pub async fn get_config(app: AppHandle) -> Result<ConfigState, MyError> {
    let config = ConfigState::new();
    let config_state = config.clone();
    app.manage(config);
    Ok(config_state)
}

#[tauri::command]
pub async fn set_config(app: AppHandle, config_state: ConfigState) -> Result<(), MyError> {
    app.manage(config_state);
    Ok(())
}

#[tauri::command]
pub async fn get_info(info: State<'_, SysInfo>) -> Result<SysInfo, MyError> {
    let info = info.inner().to_owned();
    Ok(info)
}
