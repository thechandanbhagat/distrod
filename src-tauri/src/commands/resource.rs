// @group APIEndpoints : Tauri commands for resource monitoring
use tauri::command;
use crate::wsl::resource::{self, ResourceSnapshot};

// @group APIEndpoints > Resource : Get a single resource snapshot for a distro
#[command]
pub fn get_resource_snapshot(distro_name: String) -> Result<ResourceSnapshot, String> {
    resource::get_resource_snapshot(&distro_name)
}
