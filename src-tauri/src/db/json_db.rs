use std::{collections::HashMap, fs::File};

use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct JsonDB(HashMap<String, String>);

impl JsonDB {
    pub fn new() -> Self {
        let path = std::env::current_exe()
            .unwrap()
            .parent()
            .unwrap()
            .join("storage.json");
        if path.exists() {
            let data = std::fs::File::open(path).unwrap();
            serde_json::from_reader(data).unwrap()
        } else {
            Self(HashMap::new())
        }
    }

    pub fn set_item(&mut self, key: String, value: String) {
        self.0.insert(key, value);
    }

    pub fn remove_item(&mut self, key: &str) {
        self.0.remove(key);
    }

    pub fn get_item(&self, key: &str) -> Option<&String> {
        self.0.get(key)
    }

    pub fn save(&self) {
        let path = std::env::current_exe()
            .unwrap()
            .parent()
            .unwrap()
            .join("storage.json");
        let file = File::create(path).unwrap();
        serde_json::to_writer_pretty(file, &self.0).unwrap();
    }
}

impl Drop for JsonDB {
    fn drop(&mut self) {
        let path = std::env::current_exe()
            .unwrap()
            .parent()
            .unwrap()
            .join("storage.json");
        let file = File::create(path).unwrap();
        serde_json::to_writer_pretty(file, &self.0).unwrap();
    }
}

pub type DB = std::sync::Arc<std::sync::Mutex<JsonDB>>;
