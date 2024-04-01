use crate::git::GITHUB_PROXY;
use serde::{Deserialize, Serialize};
use std::{
    ops::{Deref, DerefMut},
    path::Path,
};
use tracing::warn;
const MODEL_DIR: &str = "models";
const HF_PROXY: &str = "https://hf-mirror.com";

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Model {
    pub name: String,
    #[serde(rename = "type")]
    pub ty: String,
    pub base: String,
    pub save_path: String,
    pub description: String,
    pub reference: String,
    pub filename: String,
    pub url: String,
}

impl Model {
    // 只是生成了没有comfyui 基本路径的模型路径
    pub fn get_model_dir(&self) -> String {
        let path = Path::new(MODEL_DIR);
        if self.save_path != "default" {
            if self.save_path.contains("..") || self.save_path.starts_with('/') {
                warn!(
                    "[WARN] '{}' is not allowed path. So it will be saved into 'models/etc'.",
                    self.save_path
                );
                path.join("etc").display().to_string()
            } else {
                if self.save_path.starts_with("custom_nodes") {
                    self.save_path.clone()
                } else {
                    path.join(&self.save_path).display().to_string()
                }
            }
        } else {
            match self.ty.as_str() {
                "checkpoints" => path.join("checkpoints").display().to_string(),
                "unclip" => path.join("checkpoints").display().to_string(),
                "VAE" => path.join("vae").display().to_string(),
                "lora" => path.join("loras").display().to_string(),
                "T2I-Adapter" => path.join("controlnet").display().to_string(),
                "T2I-Style" => path.join("controlnet").display().to_string(),
                "controlnet" => path.join("controlnet").display().to_string(),
                "clip_vision" => path.join("clip_vision").display().to_string(),
                "gligen" => path.join("gligen").display().to_string(),
                "upscale" => path.join("upscale_models").display().to_string(),
                "embeddings" => path.join("embeddings").display().to_string(),
                _ => path.join("etc").display().to_string(),
            }
        }
    }
    pub fn get_url(&self, proxy: bool) -> String {
        if proxy {
            if self.url.starts_with("https://huggingface.co") {
                self.url.replace("https://huggingface.co", HF_PROXY)
            } else if self.url.starts_with("https://github.com") {
                format!("{GITHUB_PROXY}/{}", self.url)
            } else {
                self.url.clone()
            }
        } else {
            self.url.clone()
        }
    }
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ModelList {
    pub models: Vec<Model>,
}

impl Deref for ModelList {
    type Target = Vec<Model>;

    fn deref(&self) -> &Self::Target {
        &self.models
    }
}

impl DerefMut for ModelList {
    fn deref_mut(&mut self) -> &mut Self::Target {
        &mut self.models
    }
}

impl ModelList {
    pub fn from_file<P: AsRef<Path>>(path: P) -> Result<Self, anyhow::Error> {
        let file = std::fs::File::open(path)?;
        let model_list: ModelList = serde_json::from_reader(file)?;
        Ok(model_list)
    }
}
