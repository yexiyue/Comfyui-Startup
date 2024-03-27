use sea_orm_migration::{
    prelude::*,
    sea_orm::{EnumIter, Iterable},
};

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .create_table(
                Table::create()
                    .table(DownloadTasks::Table)
                    .if_not_exists()
                    .col(
                        ColumnDef::new(DownloadTasks::Id)
                            .integer()
                            .not_null()
                            .auto_increment()
                            .primary_key(),
                    )
                    .col(ColumnDef::new(DownloadTasks::Url).string().not_null())
                    .col(ColumnDef::new(DownloadTasks::Filename).string().not_null())
                    .col(
                        ColumnDef::new(DownloadTasks::DownloadedSize)
                            .big_integer()
                            .not_null(),
                    )
                    .col(
                        ColumnDef::new(DownloadTasks::TotalSize)
                            .big_integer()
                            .not_null(),
                    )
                    .col(
                        ColumnDef::new(DownloadTasks::CreatedAt)
                            .timestamp_with_time_zone()
                            .default(Expr::current_timestamp()),
                    )
                    .col(
                        ColumnDef::new(DownloadTasks::UpdatedAt)
                            .timestamp_with_time_zone()
                            .default(Expr::current_timestamp()),
                    )
                    .col(ColumnDef::new(DownloadTasks::CompletedAt).timestamp_with_time_zone())
                    .col(
                        ColumnDef::new(DownloadTasks::Status)
                            .enumeration(Alias::new("status"), Status::iter()),
                    )
                    .to_owned(),
            )
            .await
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .drop_table(Table::drop().table(DownloadTasks::Table).to_owned())
            .await
    }
}

#[derive(DeriveIden)]
pub enum DownloadTasks {
    Table,
    Id,
    Url,
    Filename,
    DownloadedSize,
    TotalSize,
    CreatedAt,
    UpdatedAt,
    CompletedAt,
    Status,
}

#[derive(Iden, EnumIter)]
pub enum Status {
    Failed,
    Pending,
    Paused,
}
