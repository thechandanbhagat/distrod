// @group APIEndpoints : Tauri commands for network info and port forwarding
use tauri::command;
use crate::wsl::network::{self, NetworkInfo, PortForwardRule};

// @group APIEndpoints > Network : Get IP and gateway for a distro
#[command]
pub fn get_network_info(distro_name: String) -> Result<NetworkInfo, String> {
    network::get_network_info(&distro_name)
}

// @group APIEndpoints > Network : List all port forwarding rules
#[command]
pub fn list_port_forwards() -> Result<Vec<PortForwardRule>, String> {
    network::list_port_forwards()
}

// @group APIEndpoints > Network : Add a port forwarding rule
#[command]
pub fn add_port_forward(rule: PortForwardRule) -> Result<(), String> {
    network::add_port_forward(&rule)
}

// @group APIEndpoints > Network : Remove a port forwarding rule
#[command]
pub fn remove_port_forward(listen_address: String, listen_port: u16) -> Result<(), String> {
    network::remove_port_forward(&listen_address, listen_port)
}

// @group APIEndpoints > Network : Ping WSL IP from host
#[command]
pub fn ping_wsl(ip: String) -> Result<bool, String> {
    network::ping_wsl(&ip)
}
