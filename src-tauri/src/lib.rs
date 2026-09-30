mod scanner;

use scanner::ProjectScan;
use std::path::PathBuf;

#[tauri::command]
fn scan_project(root: String) -> Result<ProjectScan, String> {
    scanner::scan_project(PathBuf::from(root).as_path()).map_err(|error| error.to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![scan_project])
        .run(tauri::generate_context!())
        .expect("error while running AgentStudio");
}
