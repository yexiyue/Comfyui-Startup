use crate::error::MyError;
use anyhow::Context;
use std::{io::Write, path::Path, process::Command};
use tracing::{error, info};

#[tauri::command]
pub async fn install_brew(china_user: bool) -> Result<(), MyError> {
    let bash_url = if china_user {
        "https://gitee.com/cunkai/HomebrewCN/raw/master/Homebrew.sh"
    } else {
        "https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh"
    };

    // 执行 curl 命令下载 Homebrew 安装脚本
    let curl_output = Command::new("curl")
        .arg("-fsSL")
        .arg(bash_url)
        .output()
        .context("执行 curl 命令失败")?;

    let dir = tempfile::tempdir().context("创建临时目录失败")?;
    let path = dir.path().join("install.sh");
    let mut file = std::fs::File::create(&path).context("创建文件失败")?;

    file.write_all(curl_output.stdout.as_slice())
        .context("写入文件失败")?;

    // 将下载的脚本内容作为子进程的输入
    let mut child = Command::new("/bin/bash")
        .arg(&path.display().to_string())
        .stdin(std::process::Stdio::inherit())
        .stdout(std::process::Stdio::inherit())
        .stderr(std::process::Stdio::inherit())
        .spawn()
        .context("创建子进程失败")?;

    // 等待子进程执行完成
    let status = child.wait().context("等待子进程执行完成失败")?;
    let home = std::env!("HOME");
    let zprofile_path = format!("{}/.zprofile", home);
    if status.success() {
        if china_user {
            let mut zprofile = std::fs::OpenOptions::new()
                .append(true)
                .write(true)
                .open(Path::new(&zprofile_path))
                .context("创建zprofile文件失败")?;
            zprofile
                .write_all(include_bytes!("../../asserts/brew_finished.txt"))
                .context("写入zprofile文件失败")?;
        }
        info!("Homebrew installation succeeded.");
    } else {
        error!("Homebrew installation failed.");
    }

    Command::new("source")
        .arg(&zprofile_path)
        .output()
        .context("执行source命令失败")?;

    Ok(())
}
