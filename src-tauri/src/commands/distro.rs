// @group APIEndpoints : Tauri commands for distro management
use tauri::command;
use crate::wsl::distro::{self, Distro};

// @group APIEndpoints > Distro : List all installed WSL distros
#[command]
pub fn list_distros() -> Result<Vec<Distro>, String> {
    distro::list_distros()
}

// @group APIEndpoints > Distro : Start a distro
#[command]
pub fn start_distro(name: String) -> Result<(), String> {
    distro::start_distro(&name)
}

// @group APIEndpoints > Distro : Stop (terminate) a distro
#[command]
pub fn stop_distro(name: String) -> Result<(), String> {
    distro::stop_distro(&name)
}

// @group APIEndpoints > Distro : Set the default distro
#[command]
pub fn set_default_distro(name: String) -> Result<(), String> {
    distro::set_default_distro(&name)
}

// @group APIEndpoints > Distro : Export a distro to a .tar file
#[command]
pub fn export_distro(name: String, path: String) -> Result<(), String> {
    distro::export_distro(&name, &path)
}

// @group APIEndpoints > Distro : Import a distro from a .tar file
#[command]
pub fn import_distro(name: String, install_location: String, path: String) -> Result<(), String> {
    distro::import_distro(&name, &install_location, &path)
}
