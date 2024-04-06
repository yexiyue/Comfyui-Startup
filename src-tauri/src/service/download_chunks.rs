use crate::entity::download_chunks::{self, ActiveModel};
use crate::entity::{
    download_chunks::Model,
    prelude::{DownloadChunks, DownloadTasks},
};
use anyhow::anyhow;
use sea_orm::{prelude::*, IntoActiveModel, Set};

pub struct DownloadChunksService;

impl DownloadChunksService {
    pub async fn create(db: &DbConn, model: Model) -> anyhow::Result<i32> {
        let active_model = ActiveModel {
            task_id: Set(model.task_id),
            start: Set(model.start),
            end: Set(model.end),
            ..Default::default()
        };
        let res = DownloadChunks::insert(active_model).exec(db).await?;
        Ok(res.last_insert_id)
    }

    pub async fn update(db: &DbConn, id: i32, downloaded: bool) -> anyhow::Result<Model> {
        let mut active_model = DownloadChunks::find_by_id(id)
            .one(db)
            .await?
            .ok_or(anyhow!("not found"))?
            .into_active_model();

        active_model.downloaded = Set(downloaded);
        let res = active_model.update(db).await?;
        Ok(res)
    }

    pub async fn find_all_not_downloaded(db: &DbConn, task_id: i32) -> anyhow::Result<Vec<Model>> {
        let task = DownloadTasks::find_by_id(task_id)
            .one(db)
            .await?
            .ok_or(anyhow!("not found task {task_id}"))?;
        let res = task
            .find_related(DownloadChunks)
            .filter(download_chunks::Column::Downloaded.eq(false))
            .all(db)
            .await?;
        Ok(res)
    }
}
