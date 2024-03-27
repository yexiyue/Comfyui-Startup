use std::{path::Path, process::Command};

use anyhow::{anyhow, Context};
use tracing::{error, info};

use crate::error::MyError;

pub const PROXY: &str = "https://mirror.ghproxy.com/";

pub fn git_clone<P: AsRef<Path>>(url: &str, path: P) -> Result<(), MyError> {
    let output = Command::new("git")
        .arg("clone")
        .arg(url)
        .current_dir(path)
        .stdin(std::process::Stdio::inherit())
        .stdout(std::process::Stdio::inherit())
        .stderr(std::process::Stdio::inherit())
        .spawn()
        .context("执行git clone命令失败")?
        .wait()
        .context("等待git clone命令执行完成失败")?;

    if output.success() {
        info!("clone {} succeeded.", url);
        Ok(())
    } else {
        error!("clone {} failed.", url);
        Err(anyhow!("clone {} failed.", url).into())
    }
}
