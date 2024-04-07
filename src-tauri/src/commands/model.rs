use crate::{
    entity,
    error::MyError,
    service::{ModelService, Pagination},
};
use sea_orm::DbConn;
use serde_json::Value;
use tauri::State;

#[tauri::command]
pub async fn get_model_list(
    db: State<'_, DbConn>,
    search: &str,
    pagination: Option<Pagination>,
    ty: Option<String>,
    base: Option<String>,
) -> Result<(Vec<entity::model::Model>, u64), MyError> {
    Ok(ModelService::get_models(&db, search, pagination, ty, base).await?)
}

#[tauri::command]
pub async fn get_model_type_groups(db: State<'_, DbConn>) -> Result<Vec<Value>, MyError> {
    Ok(ModelService::get_type_groups(&db).await?)
}

#[tauri::command]
pub async fn get_model_base_groups(db: State<'_, DbConn>) -> Result<Vec<Value>, MyError> {
    Ok(ModelService::get_base_groups(&db).await?)
}
