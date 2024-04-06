use crate::entity::plugin::{Column, Entity, Model};
use anyhow::Result;
use sea_orm::{ColumnTrait, DbConn, EntityTrait, PaginatorTrait, QueryFilter, QuerySelect};

use super::Pagination;

pub struct PluginService;

impl PluginService {
    pub async fn get_plugins(
        db: &DbConn,
        search: &str,
        pagination: Option<Pagination>,
    ) -> Result<(Vec<Model>, u64)> {
        let mut res = Entity::find();
        if search != "" {
            res = res.filter(
                Column::Title
                    .contains(search)
                    .or(Column::Author.contains(search))
                    .or(Column::Description.contains(search)),
            );
        }
        let count = res.clone().count(db).await?;
        if let Some(Pagination { page, page_size }) = pagination {
            res = res.offset((page - 1) * page_size).limit(page_size);
        }
        Ok((res.all(db).await?, count))
    }

    pub async fn get_plugin(db: &DbConn, reference: &str) -> Result<Option<Model>> {
        Ok(Entity::find()
            .filter(Column::Reference.contains(reference))
            .one(db)
            .await?)
    }
}
