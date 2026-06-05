// @group BusinessLogic : Resource snapshot collection per distro
use crate::wsl::command;
use serde::{Deserialize, Serialize};

// @group Types : Resource snapshot data model
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ResourceSnapshot {
    pub timestamp: u64,
    pub cpu_percent: f32,
    pub memory_rss: u64,
    pub memory_vsz: u64,
    pub disk_used: u64,
    pub disk_total: u64,
}

// @group Utilities : Get current Unix timestamp in seconds
fn now_secs() -> u64 {
    std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap_or_default()
        .as_secs()
}

// @group BusinessLogic : Collect resource snapshot for a distro
pub fn get_resource_snapshot(distro_name: &str) -> Result<ResourceSnapshot, String> {
    // CPU: use /proc/loadavg for a quick approximation
    let cpu_output = command("wsl")
        .args([
            "-d",
            distro_name,
            "--",
            "sh",
            "-c",
            "cat /proc/loadavg",
        ])
        .output()
        .map_err(|e| format!("Failed to read loadavg: {e}"))?;

    let cpu_str = String::from_utf8_lossy(&cpu_output.stdout);
    let cpu_load: f32 = cpu_str
        .split_whitespace()
        .next()
        .unwrap_or("0")
        .parse()
        .unwrap_or(0.0);
    // Convert 1-min load avg to a rough % (cap at 100)
    let cpu_percent = (cpu_load * 100.0).min(100.0);

    // Memory: parse /proc/meminfo
    let mem_output = command("wsl")
        .args([
            "-d",
            distro_name,
            "--",
            "sh",
            "-c",
            "grep -E '^(MemTotal|MemAvailable)' /proc/meminfo",
        ])
        .output()
        .map_err(|e| format!("Failed to read meminfo: {e}"))?;

    let mem_str = String::from_utf8_lossy(&mem_output.stdout);
    let mut mem_total_kb: u64 = 0;
    let mut mem_avail_kb: u64 = 0;
    for line in mem_str.lines() {
        let parts: Vec<&str> = line.split_whitespace().collect();
        if parts.len() >= 2 {
            let val: u64 = parts[1].parse().unwrap_or(0);
            if line.starts_with("MemTotal") {
                mem_total_kb = val;
            } else if line.starts_with("MemAvailable") {
                mem_avail_kb = val;
            }
        }
    }
    let memory_rss = (mem_total_kb.saturating_sub(mem_avail_kb)) * 1024;
    let memory_vsz = mem_total_kb * 1024;

    // Disk: df on WSL root
    let disk_output = command("wsl")
        .args(["-d", distro_name, "--", "df", "-B1", "/"])
        .output()
        .map_err(|e| format!("Failed to run df: {e}"))?;

    let disk_str = String::from_utf8_lossy(&disk_output.stdout);
    let mut disk_used: u64 = 0;
    let mut disk_total: u64 = 0;
    for line in disk_str.lines().skip(1) {
        let parts: Vec<&str> = line.split_whitespace().collect();
        // df -B1 columns: Filesystem 1B-blocks Used Available Use% Mounted-on
        if parts.len() >= 4 {
            disk_total = parts[1].parse().unwrap_or(0);
            disk_used = parts[2].parse().unwrap_or(0);
            break;
        }
    }

    Ok(ResourceSnapshot {
        timestamp: now_secs(),
        cpu_percent,
        memory_rss,
        memory_vsz,
        disk_used,
        disk_total,
    })
}
