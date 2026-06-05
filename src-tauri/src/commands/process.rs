// @group APIEndpoints : Tauri commands for process management
use tauri::command;
use crate::wsl::process::{self, LinuxProcess};

// @group APIEndpoints > Process : List processes inside a distro
#[command]
pub fn list_processes(distro_name: String) -> Result<Vec<LinuxProcess>, String> {
    process::list_processes(&distro_name)
}

// @group APIEndpoints > Process : Kill a process by PID
#[command]
pub fn kill_process(distro_name: String, pid: u32) -> Result<(), String> {
    process::kill_process(&distro_name, pid)
}
