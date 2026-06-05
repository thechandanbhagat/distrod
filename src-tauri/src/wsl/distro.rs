// @group BusinessLogic : WSL distro enumeration and control via wsl.exe
use crate::wsl::command;
use serde::{Deserialize, Serialize};

// @group Types : Distro data model
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Distro {
    pub name: String,
    pub version: u8,
    pub status: String,
    pub is_default: bool,
    pub kernel_version: Option<String>,
}

// @group BusinessLogic : Parse `wsl --list --verbose` output
pub fn list_distros() -> Result<Vec<Distro>, String> {
    let output = command("wsl")
        .args(["--list", "--verbose"])
        .output()
        .map_err(|e| format!("Failed to run wsl: {e}"))?;

    // wsl.exe outputs UTF-16LE on Windows; decode via lossy
    let raw = String::from_utf16_lossy(
        &output
            .stdout
            .chunks(2)
            .map(|b| u16::from_le_bytes([b[0], b.get(1).copied().unwrap_or(0)]))
            .collect::<Vec<u16>>(),
    );

    let mut distros = Vec::new();
    for line in raw.lines().skip(1) {
        // Format:  * Ubuntu   Running   2
        let trimmed = line.trim();
        if trimmed.is_empty() {
            continue;
        }
        let is_default = trimmed.starts_with('*');
        let parts: Vec<&str> = trimmed
            .trim_start_matches('*')
            .split_whitespace()
            .collect();
        if parts.len() < 3 {
            continue;
        }
        let name = parts[0].to_string();
        let status_raw = parts[1].to_lowercase();
        let status = match status_raw.as_str() {
            "running" => "running",
            "stopped" => "stopped",
            _ => "unknown",
        }
        .to_string();
        let version: u8 = parts[2].parse().unwrap_or(2);

        distros.push(Distro {
            name,
            version,
            status,
            is_default,
            kernel_version: None,
        });
    }

    Ok(distros)
}

// @group BusinessLogic : Terminate a running distro
pub fn stop_distro(name: &str) -> Result<(), String> {
    let status = command("wsl")
        .args(["--terminate", name])
        .status()
        .map_err(|e| format!("Failed to stop distro: {e}"))?;
    if status.success() {
        Ok(())
    } else {
        Err(format!("wsl --terminate {name} exited with {status}"))
    }
}

// @group BusinessLogic : Launch (start) a distro by running a no-op command
pub fn start_distro(name: &str) -> Result<(), String> {
    let status = command("wsl")
        .args(["-d", name, "--", "true"])
        .status()
        .map_err(|e| format!("Failed to start distro: {e}"))?;
    if status.success() {
        Ok(())
    } else {
        Err(format!("wsl -d {name} failed to start (exit {status})"))
    }
}

// @group BusinessLogic : Set the default distro
pub fn set_default_distro(name: &str) -> Result<(), String> {
    let status = command("wsl")
        .args(["--set-default", name])
        .status()
        .map_err(|e| format!("Failed to set default: {e}"))?;
    if status.success() {
        Ok(())
    } else {
        Err(format!("wsl --set-default {name} exited with {status}"))
    }
}

// @group BusinessLogic : Export a distro to a tar file
pub fn export_distro(name: &str, path: &str) -> Result<(), String> {
    let status = command("wsl")
        .args(["--export", name, path])
        .status()
        .map_err(|e| format!("Failed to export distro: {e}"))?;
    if status.success() {
        Ok(())
    } else {
        Err(format!("wsl --export {name} exited with {status}"))
    }
}

// @group BusinessLogic : Import a distro from a tar file
pub fn import_distro(name: &str, install_location: &str, path: &str) -> Result<(), String> {
    let status = command("wsl")
        .args(["--import", name, install_location, path])
        .status()
        .map_err(|e| format!("Failed to import distro: {e}"))?;
    if status.success() {
        Ok(())
    } else {
        Err(format!("wsl --import {name} exited with {status}"))
    }
}
