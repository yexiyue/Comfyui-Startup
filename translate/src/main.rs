use std::env;

use anyhow::Result;

#[tokio::main]
async fn main() -> Result<()> {
    dotenv::dotenv().ok();
    tracing_subscriber::fmt().init();
    let path = env::current_dir()?.join("custom-node-list.json");
    translate::run(
        "https://raw.githubusercontent.com/ltdrdata/ComfyUI-Manager/main/custom-node-list.json",
        "description",
        path,
        "en",
        "zh",
        Some("custom_nodes"),
    )
    .await
}
