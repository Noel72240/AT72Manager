mod paths;

use std::fs::{self, OpenOptions};
use std::io::Write;
use std::panic;
use std::path::PathBuf;
use std::sync::OnceLock;

use serde::Serialize;
use tauri::AppHandle;
use tauri_plugin_opener::OpenerExt;

pub use paths::resolve_app_paths;

static PANIC_HOOK: OnceLock<()> = OnceLock::new();

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AppPathsDto {
    pub app_data_dir: String,
    pub logs_dir: String,
    pub crash_dir: String,
    pub config_dir: String,
}

fn ensure_dirs(paths: &paths::AppPaths) -> Result<(), String> {
    fs::create_dir_all(&paths.logs_dir).map_err(|e| format!("logs_dir: {e}"))?;
    fs::create_dir_all(&paths.crash_dir).map_err(|e| format!("crash_dir: {e}"))?;
    Ok(())
}

fn append_line(path: &PathBuf, line: &str) -> Result<(), String> {
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent).map_err(|e| format!("mkdir: {e}"))?;
    }
    let mut file = OpenOptions::new()
        .create(true)
        .append(true)
        .open(path)
        .map_err(|e| format!("open log: {e}"))?;
    writeln!(file, "{line}").map_err(|e| format!("write log: {e}"))?;
    Ok(())
}

#[tauri::command]
pub fn get_app_paths(app: AppHandle) -> Result<AppPathsDto, String> {
    let paths = resolve_app_paths(&app)?;
    ensure_dirs(&paths)?;
    Ok(paths.to_dto())
}

#[tauri::command]
pub fn write_native_log(app: AppHandle, level: String, message: String) -> Result<(), String> {
    let paths = resolve_app_paths(&app)?;
    ensure_dirs(&paths)?;
    let ts = chrono_lite_timestamp();
    let line = format!("[{ts}] [{level}] {message}");
    append_line(&paths.log_file_today(), &line)
}

#[tauri::command]
pub fn write_crash_report(app: AppHandle, payload: String) -> Result<String, String> {
    let paths = resolve_app_paths(&app)?;
    ensure_dirs(&paths)?;
    let ts = chrono_lite_timestamp();
    let file_name = format!("crash-{ts}.json");
    let file_path = paths.crash_dir.join(&file_name);
    fs::write(&file_path, payload.as_bytes()).map_err(|e| format!("crash write: {e}"))?;
    let report_line = format!("[{ts}] crash report -> {}", file_path.display());
    let _ = append_line(&paths.log_file_today(), &report_line);
    Ok(file_path.to_string_lossy().into_owned())
}

#[tauri::command]
pub fn open_logs_folder(app: AppHandle) -> Result<(), String> {
    let paths = resolve_app_paths(&app)?;
    ensure_dirs(&paths)?;
    app.opener()
        .open_path(paths.logs_dir.to_string_lossy().to_string(), None::<&str>)
        .map_err(|e| format!("open logs: {e}"))
}

pub fn install_panic_hook(app: AppHandle) {
    PANIC_HOOK.get_or_init(|| {
        panic::set_hook(Box::new(move |info| {
            if let Ok(paths) = resolve_app_paths(&app) {
                let _ = ensure_dirs(&paths);
                let ts = chrono_lite_timestamp();
                let file = paths.crash_dir.join(format!("panic-{ts}.txt"));
                let body = format!("{info}\n");
                let _ = fs::write(&file, body);
            }
        }));
    });
}

fn chrono_lite_timestamp() -> String {
    use std::time::{SystemTime, UNIX_EPOCH};
    let secs = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_secs())
        .unwrap_or(0);
    format!("{secs}")
}
