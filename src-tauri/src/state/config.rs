use serde::{Deserialize, Serialize};
use std::path::Path;
use std::sync::Arc;
use tokio::sync::Mutex;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub enum Country {
    #[serde(rename = "chinese")]
    Chinese,
    #[serde(rename = "foreign")]
    Foreign,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ConfigState {
    pub country: Country,
    pub comfyui_path: String,
}

impl ConfigState {
    pub fn new() -> Self {
        let home = env!("HOME");
        let comfyui_path = Path::new(home).join("ComfyUI");
        Self {
            country: Country::Chinese,
            comfyui_path: comfyui_path.display().to_string(),
        }
    }

    pub fn is_chinese(&self) -> bool {
        match self.country {
            Country::Chinese => true,
            Country::Foreign => false,
        }
    }
}

pub type MyConfig = Arc<Mutex<ConfigState>>;
