use std::{
    ops::{Deref, DerefMut},
    path::Path,
};

use crate::entity::plugin::{ActiveModel, Entity, StringVec};
use crate::utils::command;
use crate::{error::MyError, git::Git};
use git2::Progress;
use sea_orm::*;
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Plugin {
    pub author: String,
    pub title: String,
    pub reference: String,
    pub pip: Option<Vec<String>>,
    pub files: Vec<String>,
    pub install_type: String,
    pub description: String,
}

impl IntoActiveModel<ActiveModel> for Plugin {
    fn into_active_model(self) -> ActiveModel {
        ActiveModel {
            title: Set(self.title),
            author: Set(self.author),
            reference: Set(self.reference),
            description: Set(self.description),
            install_type: Set(self.install_type),
            pip: Set(self.pip.map(|p| p.into())),
            files: Set(self.files.into()),
            ..Default::default()
        }
    }
}

impl From<Vec<String>> for StringVec {
    fn from(value: Vec<String>) -> Self {
        Self(value)
    }
}

impl Plugin {
    pub fn get_file_name(&self) -> String {
        self.reference
            .split('/')
            .last()
            .unwrap()
            .replace(".git", "")
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
        let res = git.git_pull(cb)?;
        // 1 表示插件已经是最新版
        // 2 表示插件更新成功
        Ok(res)
    }

    pub async fn remove(&self, comfyui_path: &str) -> Result<(), MyError> {
        let name = self.get_file_name();
        let path = Path::new(comfyui_path).join("custom_nodes").join(name);
        if path.exists() {
            std::fs::remove_dir_all(path)?;
        }
        Ok(())
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

pub async fn init_plugin_list(db: &DbConn, plugin_list: PluginList) -> anyhow::Result<()> {
    Entity::delete_many().exec(db).await?;
    let models = plugin_list
        .custom_nodes
        .into_iter()
        .map(|p| p.into_active_model())
        .collect::<Vec<_>>();
    Entity::insert_many(models).exec(db).await?;
    Ok(())
}
