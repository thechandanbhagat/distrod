// @group APIEndpoints : Tauri command wrappers for service management and nginx
use tauri::command;
use crate::wsl::services::{self, NginxInfo, ServiceInfo};

// @group APIEndpoints > Services : List all systemd services
#[command]
pub fn list_services(distro_name: String) -> Result<Vec<ServiceInfo>, String> {
    services::list_services(&distro_name)
}

// @group APIEndpoints > Services : Control a single service
#[command]
pub fn control_service(distro_name: String, service: String, action: String) -> Result<String, String> {
    services::control_service(&distro_name, &service, &action)
}

// @group APIEndpoints > Nginx : Get nginx status, version and config test result
#[command]
pub fn get_nginx_info(distro_name: String) -> Result<NginxInfo, String> {
    services::get_nginx_info(&distro_name)
}

// @group APIEndpoints > Nginx : Start / stop / restart / reload nginx
#[command]
pub fn control_nginx(distro_name: String, action: String) -> Result<String, String> {
    services::control_nginx(&distro_name, &action)
}

// @group APIEndpoints > Nginx : Read /etc/nginx/nginx.conf
#[command]
pub fn get_nginx_config(distro_name: String) -> Result<String, String> {
    services::get_nginx_config(&distro_name)
}

// @group APIEndpoints > Nginx : List enabled nginx site configs
#[command]
pub fn list_nginx_sites(distro_name: String) -> Result<Vec<String>, String> {
    services::list_nginx_sites(&distro_name)
}
