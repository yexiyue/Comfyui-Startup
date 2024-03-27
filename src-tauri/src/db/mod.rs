use anyhow::{anyhow, Context};
use migration::MigratorTrait;
use sea_orm::{Database, DbConn};

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
    let db = Database::connect(db_path)
        .await
        .context("failed to connect db")?;
    migration::Migrator::up(&db, None)
        .await
        .context("failed to migrate")?;
    Ok(db)
}
