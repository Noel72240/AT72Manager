use std::path::PathBuf;

use tauri::{AppHandle, Manager};

use super::AppPathsDto;

pub struct AppPaths {
    pub app_data_dir: PathBuf,
    pub logs_dir: PathBuf,
    pub crash_dir: PathBuf,
    pub config_dir: PathBuf,
}

impl AppPaths {
    pub fn log_file_today(&self) -> PathBuf {
        self.logs_dir.join("at72manager.log")
    }

    pub fn to_dto(&self) -> AppPathsDto {
        AppPathsDto {
            app_data_dir: path_to_string(&self.app_data_dir),
            logs_dir: path_to_string(&self.logs_dir),
            crash_dir: path_to_string(&self.crash_dir),
            config_dir: path_to_string(&self.config_dir),
        }
    }
}

pub fn resolve_app_paths(app: &AppHandle) -> Result<AppPaths, String> {
    let app_data = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("app_data_dir: {e}"))?;
    let config_dir = app
        .path()
        .app_config_dir()
        .map_err(|e| format!("app_config_dir: {e}"))?;

    let logs_dir = app_data.join("logs");
    let crash_dir = app_data.join("crashes");

    Ok(AppPaths {
        app_data_dir: app_data,
        logs_dir,
        crash_dir,
        config_dir,
    })
}

fn path_to_string(path: &PathBuf) -> String {
    path.to_string_lossy().replace('\\', "/")
}
