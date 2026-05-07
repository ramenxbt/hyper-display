use tauri::{
    image::Image,
    menu::{Menu, MenuItem},
    tray::{MouseButton, MouseButtonState, TrayIcon, TrayIconBuilder, TrayIconEvent},
    webview::WebviewWindowBuilder,
    AppHandle, LogicalSize, Manager, PhysicalPosition, WebviewUrl, WebviewWindow,
};

const WINDOW_FULL: (f64, f64) = (1240.0, 820.0);
const WINDOW_COMPACT: (f64, f64) = (380.0, 540.0);

#[tauri::command]
fn open_pin_window(
    app: AppHandle,
    coin: String,
    wallet: String,
    x: Option<f64>,
    y: Option<f64>,
    w: Option<f64>,
    h: Option<f64>,
) -> Result<(), String> {
    let label_safe = format!(
        "pin-{}-{}",
        coin.to_lowercase(),
        wallet.to_lowercase().trim_start_matches("0x").chars().take(8).collect::<String>(),
    );

    if let Some(existing) = app.get_webview_window(&label_safe) {
        let _ = existing.show();
        let _ = existing.set_focus();
        return Ok(());
    }

    let url = format!("index.html?pin={}&wallet={}", coin, wallet);
    let parsed = url.parse().map_err(|e: std::convert::Infallible| e.to_string())?;

    let mut builder = WebviewWindowBuilder::new(&app, &label_safe, WebviewUrl::App(parsed))
        .title(format!("{} · pinned", coin))
        .inner_size(w.unwrap_or(300.0), h.unwrap_or(180.0))
        .min_inner_size(220.0, 130.0)
        .resizable(true)
        .decorations(false)
        .always_on_top(true)
        .skip_taskbar(true)
        .background_color(tauri::webview::Color(11, 14, 17, 255));

    if let (Some(px), Some(py)) = (x, y) {
        builder = builder.position(px, py);
    }

    builder.build().map_err(|e| e.to_string())?;

    Ok(())
}

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

    if enabled {
        if let Some(tray) = app.tray_by_id("main") {
            anchor_window_to_tray(&tray, &window);
        }
    }

    Ok(())
}

fn anchor_window_to_tray(tray: &TrayIcon, window: &WebviewWindow) {
    let tray_rect = match tray.rect() {
        Ok(Some(r)) => r,
        _ => return,
    };
    let win_size = match window.outer_size() {
        Ok(s) => s,
        Err(_) => return,
    };
    let scale = window.scale_factor().unwrap_or(1.0);
    let tray_pos = tray_rect.position.to_physical::<f64>(scale);
    let tray_size = tray_rect.size.to_physical::<f64>(scale);

    let icon_center_x = tray_pos.x + tray_size.width / 2.0;
    let mut x = icon_center_x - (win_size.width as f64 / 2.0);
    let mut y = tray_pos.y + tray_size.height + 6.0;

    if let Ok(Some(monitor)) = window.current_monitor() {
        let m_pos = monitor.position();
        let m_size = monitor.size();
        let max_x = m_pos.x as f64 + m_size.width as f64 - win_size.width as f64 - 4.0;
        let min_x = m_pos.x as f64 + 4.0;
        if x > max_x {
            x = max_x;
        }
        if x < min_x {
            x = min_x;
        }
        let max_y = m_pos.y as f64 + m_size.height as f64 - win_size.height as f64 - 4.0;
        if y > max_y {
            y = max_y;
        }
    }

    let _ = window.set_position(PhysicalPosition::new(x, y));
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_autostart::init(
            tauri_plugin_autostart::MacosLauncher::LaunchAgent,
            None,
        ))
        .invoke_handler(tauri::generate_handler![set_menubar_mode, open_pin_window])
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
                                // If we're in menubar mode (no decorations), anchor under the icon
                                if !w.is_decorated().unwrap_or(true) {
                                    anchor_window_to_tray(tray, &w);
                                }
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
