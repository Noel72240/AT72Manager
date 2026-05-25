mod desktop;
mod oauth;

use desktop::{
    get_app_paths, install_panic_hook, open_logs_folder, write_crash_report, write_native_log,
};
use oauth::google_oauth_loopback;
use tauri_plugin_log::{Target, TargetKind};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_notification::init())
        .invoke_handler(tauri::generate_handler![
            google_oauth_loopback,
            get_app_paths,
            write_native_log,
            write_crash_report,
            open_logs_folder,
        ])
        .setup(|app| {
            let handle = app.handle().clone();

            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Debug)
                        .targets([Target::new(TargetKind::Stdout)])
                        .build(),
                )?;
            } else {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .targets([
                            Target::new(TargetKind::Stdout),
                            Target::new(TargetKind::LogDir {
                                file_name: Some("at72manager".into()),
                            }),
                        ])
                        .build(),
                )?;
                install_panic_hook(handle);
            }

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
