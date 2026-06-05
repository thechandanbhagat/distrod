// @group APIEndpoints : Tauri commands for snapshot (backup/restore) management
use tauri::command;
use serde::{Deserialize, Serialize};
use std::fs;
use uuid::Uuid;

// @group Types : Snapshot data model
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Snapshot {
    pub id: String,
    pub distro_name: String,
    pub file_path: String,
    pub created_at: u64,
    pub size_bytes: u64,
    pub label: Option<String>,
}

// @group Utilities : Current Unix timestamp in seconds
fn now_secs() -> u64 {
    std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap_or_default()
        .as_secs()
}

// @group APIEndpoints > Snapshot : Export a distro to .tar and return a snapshot record
#[command]
pub fn create_snapshot(
    distro_name: String,
    export_dir: String,
    label: Option<String>,
) -> Result<Snapshot, String> {
    let id = Uuid::new_v4().to_string();
    let filename = format!("{distro_name}_{}.tar", now_secs());
    let file_path = format!("{export_dir}\\{filename}");

    let status = crate::wsl::command("wsl")
        .args(["--export", &distro_name, &file_path])
        .status()
        .map_err(|e| format!("Failed to export: {e}"))?;

    if !status.success() {
        return Err(format!("wsl --export exited with {status}"));
    }

    let size_bytes = fs::metadata(&file_path)
        .map(|m| m.len())
        .unwrap_or(0);

    Ok(Snapshot {
        id,
        distro_name,
        file_path,
        created_at: now_secs(),
        size_bytes,
        label,
    })
}

// @group APIEndpoints > Snapshot : Import a .tar to restore or duplicate a distro
#[command]
pub fn restore_snapshot(
    distro_name: String,
    install_location: String,
    file_path: String,
) -> Result<(), String> {
    let status = crate::wsl::command("wsl")
        .args(["--import", &distro_name, &install_location, &file_path])
        .status()
        .map_err(|e| format!("Failed to import: {e}"))?;

    if status.success() {
        Ok(())
    } else {
        Err(format!("wsl --import exited with {status}"))
    }
}
