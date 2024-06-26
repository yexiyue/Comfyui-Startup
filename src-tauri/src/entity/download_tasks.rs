//! `SeaORM` Entity. Generated by sea-orm-codegen 0.12.15

use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Eq, Serialize, Deserialize)]
#[sea_orm(table_name = "download_tasks")]
pub struct Model {
    #[sea_orm(primary_key)]
    pub id: i32,
    pub url: String,
    pub origin_url: String,
    pub filename: String,
    pub downloaded_size: i64,
    pub total_size: i64,
    pub created_at: Option<String>,
    pub updated_at: Option<String>,
    pub status: Option<String>,
}

#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {
    #[sea_orm(has_many = "super::download_chunks::Entity")]
    DownloadChunks,
}

impl Related<super::download_chunks::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::DownloadChunks.def()
    }
}

impl ActiveModelBehavior for ActiveModel {}
