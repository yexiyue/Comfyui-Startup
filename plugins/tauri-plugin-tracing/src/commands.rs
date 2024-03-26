use super::TracingExt;
use tauri::{command, AppHandle, Runtime};

#[command]
pub(crate) async fn trace<R: Runtime>(app: AppHandle<R>, str: String) {
    app.tracing().trace(str);
}

#[command]
pub(crate) async fn info<R: Runtime>(app: AppHandle<R>, str: String) {
    app.tracing().info(str);
}

#[command]
pub(crate) async fn warn<R: Runtime>(app: AppHandle<R>, str: String) {
    app.tracing().warn(str);
}

#[command]
pub(crate) async fn error<R: Runtime>(app: AppHandle<R>, str: String) {
    app.tracing().error(str);
}
