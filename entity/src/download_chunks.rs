//! `SeaORM` Entity. Generated by sea-orm-codegen 0.12.15

use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Eq, Serialize, Deserialize)]
#[sea_orm(table_name = "download_chunks")]
pub struct Model {
    #[sea_orm(primary_key)]
    pub id: i32,
    pub task_id: i32,
    pub start: i64,
    pub end: i64,
    pub downloaded: Option<bool>,
}

#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {
    #[sea_orm(
        belongs_to = "super::download_tasks::Entity",
        from = "Column::TaskId",
        to = "super::download_tasks::Column::Id",
        on_update = "Cascade",
        on_delete = "Cascade"
    )]
    DownloadTasks,
}

impl Related<super::download_tasks::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::DownloadTasks.def()
    }
}

impl ActiveModelBehavior for ActiveModel {}
