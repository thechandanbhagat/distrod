// @group APIEndpoints : Tauri commands for custom window chrome controls
use tauri::{command, AppHandle, Manager};

// @group APIEndpoints > Window : Minimize the main window
#[command]
pub fn minimize_window(app: AppHandle) -> Result<(), String> {
    app.get_webview_window("main")
        .ok_or_else(|| "Window not found".to_string())?
        .minimize()
        .map_err(|e| e.to_string())
}

// @group APIEndpoints > Window : Toggle maximize / restore
#[command]
pub fn toggle_maximize(app: AppHandle) -> Result<(), String> {
    let win = app
        .get_webview_window("main")
        .ok_or_else(|| "Window not found".to_string())?;

    if win.is_maximized().map_err(|e| e.to_string())? {
        win.unmaximize().map_err(|e| e.to_string())
    } else {
        win.maximize().map_err(|e| e.to_string())
    }
}

// @group APIEndpoints > Window : Close the main window
#[command]
pub fn close_window(app: AppHandle) -> Result<(), String> {
    app.get_webview_window("main")
        .ok_or_else(|| "Window not found".to_string())?
        .close()
        .map_err(|e| e.to_string())
}

// @group APIEndpoints > Window : Check if window is maximized
#[command]
pub fn is_maximized(app: AppHandle) -> Result<bool, String> {
    app.get_webview_window("main")
        .ok_or_else(|| "Window not found".to_string())?
        .is_maximized()
        .map_err(|e| e.to_string())
}
