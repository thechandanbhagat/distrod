// @group APIEndpoints : Tauri command wrappers for PTY session management
use tauri::command;
use crate::wsl::pty::{self, PtySessions};

// @group APIEndpoints > PTY : Create a new PTY session for a WSL distro
#[command]
pub fn pty_create(
    app: tauri::AppHandle,
    state: tauri::State<PtySessions>,
    distro_name: String,
    tab_id: String,
    cols: u16,
    rows: u16,
) -> Result<(), String> {
    pty::create_session(app, &state, &distro_name, &tab_id, cols, rows)
}

// @group APIEndpoints > PTY : Write keystroke data to a PTY session
#[command]
pub fn pty_write(
    state: tauri::State<PtySessions>,
    tab_id: String,
    data: String,
) -> Result<(), String> {
    pty::write_session(&state, &tab_id, &data)
}

// @group APIEndpoints > PTY : Resize a PTY session
#[command]
pub fn pty_resize(
    state: tauri::State<PtySessions>,
    tab_id: String,
    cols: u16,
    rows: u16,
) -> Result<(), String> {
    pty::resize_session(&state, &tab_id, cols, rows)
}

// @group APIEndpoints > PTY : Close and remove a PTY session
#[command]
pub fn pty_close(
    state: tauri::State<PtySessions>,
    tab_id: String,
) -> Result<(), String> {
    pty::close_session(&state, &tab_id)
}
