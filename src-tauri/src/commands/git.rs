use crate::ConfigState;
use crate::{error::MyError, git::Git};
use tauri::ipc::Channel;
use tauri::State;

#[tauri::command]
pub async fn git_clone(
    config: State<'_, ConfigState>,
    path: &str,
    url: &str,
    channel: Channel,
) -> Result<(), MyError> {
    let git = Git::builder()
        .path(path)
        .url(url)
        .proxy(config.is_chinese())
        .build()?;
    git.git_clone(|p| {
        channel
            .send((p.received_objects(), p.total_objects()))
            .unwrap();
        return true;
    })?;
    Ok(())
}

#[tauri::command]
pub async fn git_pull(
    config: State<'_, ConfigState>,
    path: &str,
    url: &str,
    channel: Channel,
) -> Result<usize, MyError> {
    let git = Git::builder()
        .path(path)
        .url(url)
        .proxy(config.is_chinese())
        .build()?;
    git.git_pull(|p| {
        channel
            .send((p.received_objects(), p.total_objects()))
            .unwrap();
        return true;
    })
}
