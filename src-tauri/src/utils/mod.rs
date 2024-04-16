use anyhow::Context;
use std::process::{Command, ExitStatus};

use tracing::info;
mod git;

#[allow(unused)]
pub use git::{Git, GitBuilderError};
mod sysinfo;
pub use self::sysinfo::SysInfo;
pub use sysinfo::get_sysinfo;

#[cfg(debug_assertions)]
use tauri::Manager;

#[cfg(debug_assertions)]
#[tauri::command]
pub async fn open_devtool(app: tauri::AppHandle) {
    app.get_webview_window("main").unwrap().open_devtools();
}

#[derive(Debug, Clone)]
pub struct Exec {
    inner: Vec<String>,
}

impl Exec {
    pub fn new() -> Self {
        Self { inner: vec![] }
    }

    pub fn add<P: Into<String>>(&mut self, cmd: P) {
        self.inner.push(cmd.into());
    }

    pub fn exec(&self) -> anyhow::Result<ExitStatus> {
        let commands = self.inner.join(";");
        Command::new("open").args(["-a", "Terminal"]).output()?;
        let mut cmd = Command::new("osascript");
        let cmd = cmd.args([
            "-e",
            &format!(r#"tell application "Terminal" to do script "{commands}" in front window"#),
        ]);
        let res = cmd.status()?;
        Ok(res)
    }
}

pub async fn command(str: &str, dir: &str) -> anyhow::Result<()> {
    let args = str.split_whitespace().collect::<Vec<_>>();
    let res = tokio::process::Command::new(args.first().context("命令不能为空")?)
        .args(args.iter().skip(1))
        .current_dir(dir)
        .output()
        .await?;
    info!("{}", String::from_utf8_lossy(&res.stdout));
    Ok(())
}
