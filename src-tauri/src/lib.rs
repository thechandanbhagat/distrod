// @group Configuration : Tauri application library entry point
mod commands;
mod wsl;

use commands::{distro, file, network, process, pty, resource, services, snapshot, terminal, window};
use wsl::pty::PtySessions;

// @group BusinessLogic : Register all Tauri commands and plugins
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .manage(PtySessions::default())
        .invoke_handler(tauri::generate_handler![
            // Distro commands
            distro::list_distros,
            distro::start_distro,
            distro::stop_distro,
            distro::set_default_distro,
            distro::export_distro,
            distro::import_distro,
            // Process commands
            process::list_processes,
            process::kill_process,
            // Resource commands
            resource::get_resource_snapshot,
            // Network commands
            network::get_network_info,
            network::list_port_forwards,
            network::add_port_forward,
            network::remove_port_forward,
            network::ping_wsl,
            // File commands
            file::list_directory,
            file::create_directory,
            file::delete_entry,
            file::rename_entry,
            file::copy_to_wsl,
            // Snapshot commands
            snapshot::create_snapshot,
            snapshot::restore_snapshot,
            // PTY commands
            pty::pty_create,
            pty::pty_write,
            pty::pty_resize,
            pty::pty_close,
            // Service commands
            services::list_services,
            services::control_service,
            services::get_nginx_info,
            services::control_nginx,
            services::get_nginx_config,
            services::list_nginx_sites,
            // Terminal commands
            terminal::run_shell_command,
            // Window commands
            window::minimize_window,
            window::toggle_maximize,
            window::close_window,
            window::is_maximized,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
