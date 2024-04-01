use std::io;

use serde::Serialize;
use thiserror::Error;

use crate::{git, utils::GitBuilderError};

#[derive(Debug, Error)]
pub enum MyError {
    #[error(transparent)]
    Error(#[from] anyhow::Error),
    #[error(transparent)]
    GitBuilder(#[from] GitBuilderError),
    #[error(transparent)]
    Id(#[from] io::Error),
    #[error(transparent)]
    Shell(#[from] tauri_plugin_shell::Error),
    #[error(transparent)]
    FromUtf8(#[from] std::string::FromUtf8Error),
    #[error(transparent)]
    Git(#[from] git2::Error),
    #[error(transparent)]
    Git2Builder(#[from] git::GitBuilderError),
    #[error("{0}")]
    Code(i32),
}

impl Serialize for MyError {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        serializer.serialize_str(&self.to_string())
    }
}
