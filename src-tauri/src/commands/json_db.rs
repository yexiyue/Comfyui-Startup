use tauri::State;

use crate::db::DB;

#[tauri::command]
pub fn get_item(key: &str, db: State<DB>) -> Option<String> {
    let json = db.lock().unwrap();
    json.get_item(key).map(|v| v.clone())
}

#[tauri::command]
pub fn set_item(key: &str, db: State<DB>, value: &str) {
    let mut db = db.lock().unwrap();
    db.set_item(key.to_string(), value.to_string())
}

#[tauri::command]
pub fn remove_item(key: &str, db: State<DB>) {
    let mut db = db.lock().unwrap();
    db.remove_item(key)
}

#[tauri::command]
pub fn save(db: State<DB>) {
    let db = db.lock().unwrap();
    db.save()
}
