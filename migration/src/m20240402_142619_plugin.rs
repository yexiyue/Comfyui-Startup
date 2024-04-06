use sea_orm_migration::prelude::*;

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .create_table(
                Table::create()
                    .table(Plugin::Table)
                    .if_not_exists()
                    .col(
                        ColumnDef::new(Plugin::Id)
                            .integer()
                            .not_null()
                            .auto_increment()
                            .primary_key(),
                    )
                    .col(ColumnDef::new(Plugin::Title).string().not_null())
                    .col(ColumnDef::new(Plugin::Author).string().not_null())
                    .col(ColumnDef::new(Plugin::Reference).string().not_null())
                    .col(ColumnDef::new(Plugin::Description).string().not_null())
                    .col(ColumnDef::new(Plugin::InstallType).string().not_null())
                    .col(ColumnDef::new(Plugin::Pip).text())
                    .col(ColumnDef::new(Plugin::Files).text().not_null())
                    .to_owned(),
            )
            .await
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .drop_table(Table::drop().table(Plugin::Table).to_owned())
            .await
    }
}

#[derive(DeriveIden)]
enum Plugin {
    Table,
    Id,
    Title,
    Author,
    Reference,
    Pip,
    Files,
    InstallType,
    Description,
}
