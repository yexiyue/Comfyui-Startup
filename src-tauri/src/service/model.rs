use crate::entity::model::{Column, Entity, Model};
use anyhow::Result;
use sea_orm::{ColumnTrait, DbConn, EntityTrait, QueryFilter, QuerySelect};
use serde_json::Value;

use super::Pagination;
pub struct ModelService;

impl ModelService {
    pub async fn get_models(
        db: &DbConn,
        search: &str,
        pagination: Option<Pagination>,
        ty: Option<String>,
        base: Option<String>,
    ) -> Result<Vec<Model>> {
        let mut res = Entity::find();
        if search != "" {
            res = res.filter(
                Column::Name
                    .contains(search)
                    .or(Column::Filename.contains(search))
                    .or(Column::Description.contains(search)),
            );
        }
        if ty.is_some() {
            res = res.filter(Column::Ty.eq(ty.unwrap()));
        }
        if base.is_some() {
            res = res.filter(Column::Base.eq(base.unwrap()));
        }

        if let Some(Pagination { page, page_size }) = pagination {
            res = res.offset((page - 1) * page_size).limit(page_size);
        }
        Ok(res.all(db).await?)
    }

    pub async fn get_type_groups(db: &DbConn) -> Result<Vec<Value>> {
        let res = Entity::find()
            .select_only()
            .column(Column::Ty)
            .group_by(Column::Ty)
            .into_json()
            .all(db)
            .await?;
        Ok(res)
    }

    pub async fn get_base_groups(db: &DbConn) -> Result<Vec<Value>> {
        let res = Entity::find()
            .select_only()
            .column(Column::Base)
            .group_by(Column::Base)
            .into_json()
            .all(db)
            .await?;
        Ok(res)
    }
}
