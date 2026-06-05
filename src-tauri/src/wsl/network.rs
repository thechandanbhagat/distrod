// @group BusinessLogic : WSL network info — IP addresses and port forwarding
use crate::wsl::command;
use serde::{Deserialize, Serialize};

// @group Types : Network info data model
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct NetworkInfo {
    pub distro_name: String,
    pub ip_address: String,
    pub gateway: String,
}

// @group Types : Port forward rule data model
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PortForwardRule {
    pub listen_address: String,
    pub listen_port: u16,
    pub connect_address: String,
    pub connect_port: u16,
}

// @group BusinessLogic : Get IP and gateway for a distro
pub fn get_network_info(distro_name: &str) -> Result<NetworkInfo, String> {
    let output = command("wsl")
        .args([
            "-d",
            distro_name,
            "--",
            "sh",
            "-c",
            "ip route show default; hostname -I | awk '{print $1}'",
        ])
        .output()
        .map_err(|e| format!("Failed to get network info: {e}"))?;

    let stdout = String::from_utf8_lossy(&output.stdout);
    let lines: Vec<&str> = stdout.lines().collect();

    let mut gateway = String::from("unknown");
    let mut ip_address = String::from("unknown");

    for line in &lines {
        if line.starts_with("default via") {
            let parts: Vec<&str> = line.split_whitespace().collect();
            if parts.len() >= 3 {
                gateway = parts[2].to_string();
            }
        }
    }
    if let Some(last) = lines.last() {
        let trimmed = last.trim();
        if !trimmed.is_empty() && !trimmed.starts_with("default") {
            ip_address = trimmed.to_string();
        }
    }

    Ok(NetworkInfo {
        distro_name: distro_name.to_string(),
        ip_address,
        gateway,
    })
}

// @group BusinessLogic : List current port forward rules via netsh
pub fn list_port_forwards() -> Result<Vec<PortForwardRule>, String> {
    let output = command("netsh")
        .args(["interface", "portproxy", "show", "all"])
        .output()
        .map_err(|e| format!("Failed to run netsh: {e}"))?;

    let stdout = String::from_utf8_lossy(&output.stdout);
    let mut rules = Vec::new();

    for line in stdout.lines() {
        let parts: Vec<&str> = line.split_whitespace().collect();
        // netsh output: ListenAddress  ListenPort  ConnectAddress  ConnectPort
        if parts.len() == 4 {
            if let (Ok(lp), Ok(cp)) = (parts[1].parse::<u16>(), parts[3].parse::<u16>()) {
                rules.push(PortForwardRule {
                    listen_address: parts[0].to_string(),
                    listen_port: lp,
                    connect_address: parts[2].to_string(),
                    connect_port: cp,
                });
            }
        }
    }

    Ok(rules)
}

// @group BusinessLogic : Add a port forwarding rule via netsh
pub fn add_port_forward(rule: &PortForwardRule) -> Result<(), String> {
    let status = command("netsh")
        .args([
            "interface",
            "portproxy",
            "add",
            "v4tov4",
            &format!("listenaddress={}", rule.listen_address),
            &format!("listenport={}", rule.listen_port),
            &format!("connectaddress={}", rule.connect_address),
            &format!("connectport={}", rule.connect_port),
        ])
        .status()
        .map_err(|e| format!("Failed to add port forward: {e}"))?;
    if status.success() {
        Ok(())
    } else {
        Err(format!("netsh exited with {status}"))
    }
}

// @group BusinessLogic : Remove a port forwarding rule via netsh
pub fn remove_port_forward(listen_address: &str, listen_port: u16) -> Result<(), String> {
    let status = command("netsh")
        .args([
            "interface",
            "portproxy",
            "delete",
            "v4tov4",
            &format!("listenaddress={listen_address}"),
            &format!("listenport={listen_port}"),
        ])
        .status()
        .map_err(|e| format!("Failed to remove port forward: {e}"))?;
    if status.success() {
        Ok(())
    } else {
        Err(format!("netsh delete exited with {status}"))
    }
}

// @group BusinessLogic : Ping WSL IP from Windows host
pub fn ping_wsl(ip: &str) -> Result<bool, String> {
    let status = command("ping")
        .args(["-n", "1", "-w", "1000", ip])
        .status()
        .map_err(|e| format!("Failed to ping: {e}"))?;
    Ok(status.success())
}
