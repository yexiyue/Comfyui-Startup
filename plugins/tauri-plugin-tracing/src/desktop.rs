use serde::de::DeserializeOwned;
use tauri::{plugin::PluginApi, AppHandle, Runtime};

pub fn init<R: Runtime, C: DeserializeOwned>(
    app: &AppHandle<R>,
    _api: PluginApi<R, C>,
) -> crate::Result<Tracing<R>> {
    Ok(Tracing(app.clone()))
}

/// Access to the tracing APIs.
pub struct Tracing<R: Runtime>(AppHandle<R>);

impl<R: Runtime> Tracing<R> {
    pub fn trace(&self, str: String) {
        tracing::trace!("{}", str);
    }
    pub fn info(&self, str: String) {
        tracing::info!("{}", str);
    }
    pub fn warn(&self, str: String) {
        tracing::warn!("{}", str);
    }
    pub fn error(&self, str: String) {
        tracing::error!("{}", str);
    }
}
