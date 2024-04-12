use sea_orm_migration::prelude::*;

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .create_table(
                Table::create()
                    .table(Model::Table)
                    .if_not_exists()
                    .col(
                        ColumnDef::new(Model::Id)
                            .integer()
                            .not_null()
                            .auto_increment()
                            .primary_key(),
                    )
                    .col(ColumnDef::new(Model::Name).string().not_null())
                    .col(ColumnDef::new(Model::Type).string().not_null())
                    .col(ColumnDef::new(Model::Base).string().not_null())
                    .col(ColumnDef::new(Model::SavePath).string().not_null())
                    .col(ColumnDef::new(Model::Description).string().not_null())
                    .col(ColumnDef::new(Model::ZhDescription).string())
                    .col(ColumnDef::new(Model::Reference).string().not_null())
                    .col(ColumnDef::new(Model::Filename).string().not_null())
                    .col(ColumnDef::new(Model::Url).string().not_null())
                    .to_owned(),
            )
            .await
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .drop_table(Table::drop().table(Model::Table).to_owned())
            .await
    }
}

#[derive(DeriveIden)]
enum Model {
    Table,
    Id,
    Name,
    Type,
    Base,
    SavePath,
    Description,
    Reference,
    Filename,
    Url,
    ZhDescription
}
