use tauri::Manager;
pub mod git;

#[tauri::command]
pub async fn open_devtool(app: tauri::AppHandle) {
    app.get_webview_window("main").unwrap().open_devtools();
}
