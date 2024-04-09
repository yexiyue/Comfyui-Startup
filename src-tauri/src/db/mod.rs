use anyhow::{anyhow, Context};
use migration::MigratorTrait;
use sea_orm::{ConnectOptions, Database, DbConn};
use serde::Serialize;
use tracing::log::LevelFilter;

use crate::error::MyError;

pub async fn connect_db() -> Result<DbConn, MyError> {
    let dir = std::env::current_exe().context("failed to get current exe")?;
    let dir = dir
        .parent()
        .ok_or(anyhow!("failed to get parent dir"))?
        .join("./db/database.db");
    if !dir.exists() {
        tokio::fs::create_dir_all(dir.parent().unwrap())
            .await
            .context("failed to create db dir")?;
        tokio::fs::File::create(&dir)
            .await
            .context("failed to create db file")?;
    }

    let db_path = format!("sqlite:{}?mode=rwc", dir.display());
    let mut option = ConnectOptions::new(db_path);
    option.sqlx_logging_level(LevelFilter::Debug);
    let db = Database::connect(option)
        .await
        .context("failed to connect db")?;
    migration::Migrator::up(&db, None)
        .await
        .context("failed to migrate")?;
    Ok(db)
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "lowercase")]
pub enum Status {
    Pending,
    Running,
    Paused,
    Success,
    Failed,
}

impl From<Status> for String {
    fn from(val: Status) -> Self {
        match val {
            Status::Pending => "pending".to_string(),
            Status::Running => "running".to_string(),
            Status::Paused => "paused".to_string(),
            Status::Success => "success".to_string(),
            Status::Failed => "failed".to_string(),
        }
    }
}

impl ToString for Status {
    fn to_string(&self) -> String {
        match self {
            Status::Pending => "pending".to_string(),
            Status::Running => "running".to_string(),
            Status::Paused => "paused".to_string(),
            Status::Success => "success".to_string(),
            Status::Failed => "failed".to_string(),
        }
    }
}
