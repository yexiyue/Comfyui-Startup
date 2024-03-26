const COMMANDS: &[&str] = &["info", "trace", "warn", "error"];

fn main() {
    tauri_plugin::Builder::new(COMMANDS).build();
}
