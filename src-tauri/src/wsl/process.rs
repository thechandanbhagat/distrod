// @group BusinessLogic : WSL process enumeration and control via ps + kill
use crate::wsl::command;
use serde::{Deserialize, Serialize};

// @group Types : Linux process data model
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct LinuxProcess {
    pub pid: u32,
    pub name: String,
    pub cpu_percent: f32,
    pub mem_percent: f32,
    pub user: String,
    pub command: String,
}

// @group BusinessLogic : List running processes inside a distro via `ps`
pub fn list_processes(distro_name: &str) -> Result<Vec<LinuxProcess>, String> {
    let output = command("wsl")
        .args([
            "-d",
            distro_name,
            "--",
            "ps",
            "aux",
            "--no-headers",
        ])
        .output()
        .map_err(|e| format!("Failed to run ps: {e}"))?;

    if !output.status.success() {
        return Err(format!(
            "ps exited with {}",
            output.status.code().unwrap_or(-1)
        ));
    }

    let stdout = String::from_utf8_lossy(&output.stdout);
    let mut processes = Vec::new();

    for line in stdout.lines() {
        let parts: Vec<&str> = line.split_whitespace().collect();
        // ps aux columns: USER PID %CPU %MEM VSZ RSS TTY STAT START TIME COMMAND...
        if parts.len() < 11 {
            continue;
        }
        let user = parts[0].to_string();
        let pid: u32 = parts[1].parse().unwrap_or(0);
        let cpu_percent: f32 = parts[2].parse().unwrap_or(0.0);
        let mem_percent: f32 = parts[3].parse().unwrap_or(0.0);
        let command = parts[10..].join(" ");
        let name = command
            .split('/')
            .last()
            .unwrap_or(&command)
            .split_whitespace()
            .next()
            .unwrap_or("unknown")
            .to_string();

        processes.push(LinuxProcess {
            pid,
            name,
            cpu_percent,
            mem_percent,
            user,
            command,
        });
    }

    Ok(processes)
}

// @group BusinessLogic : Kill a process by PID inside a distro
pub fn kill_process(distro_name: &str, pid: u32) -> Result<(), String> {
    let status = command("wsl")
        .args(["-d", distro_name, "--", "kill", "-9", &pid.to_string()])
        .status()
        .map_err(|e| format!("Failed to kill process: {e}"))?;
    if status.success() {
        Ok(())
    } else {
        Err(format!("kill -9 {pid} exited with {status}"))
    }
}
