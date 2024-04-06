mod download_chunks;
mod download_tasks;
pub use download_chunks::DownloadChunksService;
pub use download_tasks::DownloadTasksService;
mod model;
mod plugin;
pub use model::ModelService;
pub use plugin::PluginService;
use serde::Deserialize;

#[derive(Debug, Deserialize)]
pub struct Pagination {
    pub page: u64,
    pub page_size: u64,
}
