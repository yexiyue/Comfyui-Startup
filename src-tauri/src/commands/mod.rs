use tauri::State;

use crate::{
    error::MyError,
    state::ConfigState,
    utils::{Exec, SysInfo},
};

pub mod config;
pub mod download;
pub mod git;
pub mod plugin;

#[tauri::command]
pub async fn startup(
    info: State<'_, SysInfo>,
    config: State<'_, ConfigState>,
) -> Result<(), MyError> {
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
