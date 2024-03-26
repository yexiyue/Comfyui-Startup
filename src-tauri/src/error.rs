use std::{error::Error, fmt::Display};

use serde::Serialize;

#[derive(Debug, Serialize)]
pub struct MyError {
    pub message: String,
}

impl Error for MyError {}
impl Display for MyError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{}", self.message)
    }
}

impl From<anyhow::Error> for MyError {
    fn from(e: anyhow::Error) -> Self {
        Self {
            message: e.to_string(),
        }
    }
}
