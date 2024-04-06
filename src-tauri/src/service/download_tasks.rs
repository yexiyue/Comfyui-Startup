use crate::entity::download_tasks::ActiveModel;
use crate::entity::{download_tasks::Model, prelude::DownloadTasks};
use anyhow::anyhow;
use chrono::Local;
use sea_orm::{prelude::*, IntoActiveModel, Set};

pub struct DownloadTasksService;

impl DownloadTasksService {
    pub async fn create(db: &DbConn, model: Model) -> anyhow::Result<i32> {
        let active_model = ActiveModel {
            url: Set(model.url),
            filename: Set(model.filename),
            status: Set(model.status),
            downloaded_size: Set(model.downloaded_size),
            total_size: Set(model.total_size),
            created_at: Set(Some(Local::now().to_string())),
            ..Default::default()
        };
        let res = DownloadTasks::insert(active_model).exec(db).await?;
        Ok(res.last_insert_id)
    }

    pub async fn update(
        db: &DbConn,
        id: i32,
        downloaded_size: Option<i64>,
        status: Option<String>,
    ) -> anyhow::Result<Model> {
        let mut active_model = DownloadTasks::find_by_id(id)
            .one(db)
            .await?
            .ok_or(anyhow!("not found"))?
            .into_active_model();
        active_model.updated_at = Set(Some(Local::now().to_string()));
        active_model.status = Set(status);

        if downloaded_size.is_some() {
            active_model.downloaded_size = Set(downloaded_size.unwrap());
        }

        let res = active_model.update(db).await?;
        Ok(res)
    }

    pub async fn delete(db: &DbConn, id: i32) -> anyhow::Result<()> {
        let active_model = DownloadTasks::find_by_id(id)
            .one(db)
            .await?
            .ok_or(anyhow!("download task {id} not found"))?
            .into_active_model();
        active_model.delete(db).await?;
        Ok(())
    }

    pub async fn find_by_id(db: &DbConn, id: i32) -> anyhow::Result<Model> {
        let res = DownloadTasks::find_by_id(id).one(db).await?;
        Ok(res.ok_or(anyhow!("download task {id} not found"))?)
    }

    pub async fn find_all(db: &DbConn) -> anyhow::Result<Vec<Model>> {
        let res = DownloadTasks::find().all(db).await?;
        Ok(res)
    }
}
