use anyhow::Result;
use std::env;
use tracing::{error, info};
use translate::check::Watcher;

#[tokio::main]
async fn main() -> Result<()> {
    dotenv::dotenv().ok();
    tracing_subscriber::fmt().init();
    // model-list.json models

    let mut res = Watcher::new();
    for i in res.iter_mut() {
        info!("{:#?}", i);
        let should_update = match i.check_update().await {
            Ok(v) => {
                info!("{:?}", v);
                v
            }
            Err(e) => {
                error!("{:?}", e);
                false
            }
        };
        if should_update || (i.also_translate.is_some() && i.also_translate.unwrap()) {
            if let Some(trans_task) = &i.translate_task {
                let path = env::current_dir()?.join(&trans_task.path);
                translate::run(
                    &format!(
                        "https://mirror.ghproxy.com/https://raw.githubusercontent.com/{}/{}/{}/{}",
                        &i.owner, &i.repo, &i.branch, &i.filename
                    ),
                    &trans_task.target_field,
                    path,
                    &trans_task.from,
                    &trans_task.to,
                    Some(&trans_task.field),
                )
                .await?;
            }
        }
    }
    Ok(())
}
