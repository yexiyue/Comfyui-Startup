use std::io;

use tauri::{
    plugin::{Builder, TauriPlugin},
    Manager, Runtime,
};

mod commands;
mod desktop;
mod error;

pub use error::{Error, Result};

use desktop::Tracing;

/// Extensions to [`tauri::App`], [`tauri::AppHandle`] and [`tauri::Window`] to access the tracing APIs.
pub trait TracingExt<R: Runtime> {
    fn tracing(&self) -> &Tracing<R>;
}

impl<R: Runtime, T: Manager<R>> crate::TracingExt<R> for T {
    fn tracing(&self) -> &Tracing<R> {
        self.state::<Tracing<R>>().inner()
    }
}

/// Initializes the plugin.
pub fn init<R: Runtime>() -> TauriPlugin<R> {
    // 初始化打印日志
    tracing_subscriber::fmt()
        .with_writer(io::stdout)
        .compact()
        .init();
    Builder::new("tracing")
        .invoke_handler(tauri::generate_handler![
            commands::trace,
            commands::info,
            commands::warn,
            commands::error
        ])
        .setup(|app, api| {
            let tracing = desktop::init(app, api)?;
            app.manage(tracing);
            Ok(())
        })
        .build()
}
