use sea_orm_migration::prelude::*;

use crate::m20220101_000001_create_table::DownloadTasks;

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .create_table(
                Table::create()
                    .table(DownloadChunks::Table)
                    .if_not_exists()
                    .col(
                        ColumnDef::new(DownloadChunks::Id)
                            .integer()
                            .not_null()
                            .auto_increment()
                            .primary_key(),
                    )
                    .col(ColumnDef::new(DownloadChunks::TaskId).integer().not_null())
                    .col(
                        ColumnDef::new(DownloadChunks::Start)
                            .big_integer()
                            .not_null(),
                    )
                    .col(ColumnDef::new(DownloadChunks::End).big_integer().not_null())
                    .col(
                        ColumnDef::new(DownloadChunks::Downloaded)
                            .boolean()
                            .default(false)
                            .not_null(),
                    )
                    .foreign_key(
                        ForeignKey::create()
                            .from(DownloadChunks::Table, DownloadChunks::TaskId)
                            .to(DownloadTasks::Table, DownloadTasks::Id)
                            .on_delete(ForeignKeyAction::Cascade)
                            .on_update(ForeignKeyAction::Cascade),
                    )
                    .to_owned(),
            )
            .await
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .drop_table(Table::drop().table(DownloadChunks::Table).to_owned())
            .await
    }
}

#[derive(DeriveIden)]
enum DownloadChunks {
    Table,
    Id,
    TaskId,
    Start,
    End,
    Downloaded,
}
