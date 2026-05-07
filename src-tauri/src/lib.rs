use tauri::{
    image::Image,
    menu::{Menu, MenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    AppHandle, LogicalSize, Manager,
};

const WINDOW_FULL: (f64, f64) = (1240.0, 820.0);
const WINDOW_COMPACT: (f64, f64) = (380.0, 540.0);

#[tauri::command]
fn set_menubar_mode(app: AppHandle, enabled: bool) -> Result<(), String> {
    let window = app
        .get_webview_window("main")
        .ok_or_else(|| "main window not found".to_string())?;

    let (w, h) = if enabled { WINDOW_COMPACT } else { WINDOW_FULL };
    window
        .set_size(LogicalSize::new(w, h))
        .map_err(|e| e.to_string())?;
    window
        .set_decorations(!enabled)
        .map_err(|e| e.to_string())?;
    window
        .set_always_on_top(enabled)
        .map_err(|e| e.to_string())?;
    let _ = window.set_skip_taskbar(enabled);

    #[cfg(target_os = "macos")]
    {
        use tauri::ActivationPolicy;
        let policy = if enabled {
            ActivationPolicy::Accessory
        } else {
            ActivationPolicy::Regular
        };
        let _ = app.set_activation_policy(policy);
    }

    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_notification::init())
        .invoke_handler(tauri::generate_handler![set_menubar_mode])
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }

            let icon = Image::from_bytes(include_bytes!("../icons/icon.png"))?;
            let show = MenuItem::with_id(app, "show", "Show Hyper-Display", true, None::<&str>)?;
            let hide = MenuItem::with_id(app, "hide", "Hide", true, None::<&str>)?;
            let quit = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;
            let menu = Menu::with_items(app, &[&show, &hide, &quit])?;

            let _tray = TrayIconBuilder::with_id("main")
                .icon(icon)
                .icon_as_template(true)
                .tooltip("Hyper-Display")
                .menu(&menu)
                .show_menu_on_left_click(false)
                .on_menu_event(|app, event| match event.id().as_ref() {
                    "show" => {
                        if let Some(w) = app.get_webview_window("main") {
                            let _ = w.show();
                            let _ = w.set_focus();
                        }
                    }
                    "hide" => {
                        if let Some(w) = app.get_webview_window("main") {
                            let _ = w.hide();
                        }
                    }
                    "quit" => {
                        app.exit(0);
                    }
                    _ => {}
                })
                .on_tray_icon_event(|tray, event| {
                    if let TrayIconEvent::Click {
                        button: MouseButton::Left,
                        button_state: MouseButtonState::Up,
                        ..
                    } = event
                    {
                        let app = tray.app_handle();
                        if let Some(w) = app.get_webview_window("main") {
                            let visible = w.is_visible().unwrap_or(false);
                            if visible {
                                let _ = w.hide();
                            } else {
                                let _ = w.show();
                                let _ = w.set_focus();
                            }
                        }
                    }
                })
                .build(app)?;

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
