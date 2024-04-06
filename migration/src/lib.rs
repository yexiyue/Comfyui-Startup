pub use sea_orm_migration::prelude::*;

mod m20220101_000001_create_table;
mod m20240327_044339_chunk;
mod m20240402_142240_model;
mod m20240402_142619_plugin;

pub struct Migrator;

#[async_trait::async_trait]
impl MigratorTrait for Migrator {
    fn migrations() -> Vec<Box<dyn MigrationTrait>> {
        vec![
            Box::new(m20220101_000001_create_table::Migration),
            Box::new(m20240327_044339_chunk::Migration),
            Box::new(m20240402_142240_model::Migration),
            Box::new(m20240402_142619_plugin::Migration),
        ]
    }
}
