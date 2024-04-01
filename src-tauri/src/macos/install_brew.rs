use crate::error::MyError;
use anyhow::Context;
use std::io::Write;

pub fn install_brew(china_user: bool) -> Result<(String, String), MyError> {
    let bash_url = if china_user {
        "https://gitee.com/cunkai/HomebrewCN/raw/master/Homebrew.sh"
    } else {
        "https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh"
    };

    let res = format!(r#"/bin/zsh -c \"$(curl -fsSL {bash_url})\""#);
    let home = std::env!("HOME");
    let zprofile_path = std::path::Path::new(home).join(".zprofile");
    if !china_user {
        let mut zprofile = std::fs::OpenOptions::new()
            .append(true)
            .write(true)
            .open(&zprofile_path)
            .context("创建zprofile文件失败")?;
        zprofile
            .write_all(include_bytes!("../../asserts/brew_finished.txt"))
            .context("写入zprofile文件失败")?;
        drop(zprofile)
    }

    Ok((res, zprofile_path.display().to_string()))
}
