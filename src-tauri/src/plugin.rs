use std::{
    ops::{Deref, DerefMut},
    path::Path,
};

use crate::git::Git;
use crate::utils::command;
use git2::Progress;
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub enum InstallType {
    #[serde(rename = "git-clone")]
    GitClone,
    #[serde(rename = "unzip")]
    UnZip,
    #[serde(rename = "copy")]
    Copy,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Plugin {
    pub author: String,
    pub title: String,
    pub reference: String,
    pub pip: Option<Vec<String>>,
    pub files: Vec<String>,
    pub install_type: InstallType,
    pub description: String,
}

impl Plugin {
    pub fn get_file_name(&self) -> String {
        self.reference.split('/').last().unwrap().replace(".git", "")
    }

    pub async fn download<F>(&self, comfyui_path: &str, proxy: bool, cb: F) -> anyhow::Result<()>
    where
        F: Fn(Progress) -> bool,
    {
        let name = self.get_file_name();
        let path = Path::new(comfyui_path)
            .join("custom_nodes")
            .join(name)
            .display()
            .to_string();

        let git = Git::builder()
            .path(&path)
            .url(&self.reference)
            .proxy(proxy)
            .build()?;
        git.git_clone(cb)?;
        command("../../venv/bin/pip install -r requirements.txt", &path).await?;
        if self.pip.is_some() {
            let deps = self.pip.as_ref().unwrap().join(" ");
            command(&format!("../../venv/bin/pip install {}", deps), &path).await?;
        }
        Ok(())
    }

    pub async fn update<F>(&self, comfyui_path: &str, proxy: bool, cb: F) -> anyhow::Result<usize>
    where
        F: Fn(Progress) -> bool,
    {
        let name = self.get_file_name();
        let path = format!("{comfyui_path}/custom_nodes/{name}");
        let git = Git::builder()
            .path(&path)
            .url(&self.reference)
            .proxy(proxy)
            .build()?;
        let res = git.git_pull(cb)?;
        // 1 表示插件已经是最新版
        // 2 表示插件更新成功
        Ok(res)
    }
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct PluginList {
    pub custom_nodes: Vec<Plugin>,
}

impl Deref for PluginList {
    type Target = Vec<Plugin>;

    fn deref(&self) -> &Self::Target {
        &self.custom_nodes
    }
}

impl DerefMut for PluginList {
    fn deref_mut(&mut self) -> &mut Self::Target {
        &mut self.custom_nodes
    }
}

impl PluginList {
    pub fn from_file<P: AsRef<Path>>(path: P) -> Result<Self, anyhow::Error> {
        let file = std::fs::File::open(path)?;
        let plugin_list: PluginList = serde_json::from_reader(file)?;
        Ok(plugin_list)
    }
}
