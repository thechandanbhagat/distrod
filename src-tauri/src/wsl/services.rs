// @group BusinessLogic : WSL service management via systemd and nginx control
use crate::wsl::command;
use serde::{Deserialize, Serialize};

// @group Types : Systemd service record
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ServiceInfo {
    pub name: String,
    pub load: String,
    pub active: String,
    pub sub: String,
    pub description: String,
}

// @group Types : Nginx status snapshot
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct NginxInfo {
    pub installed: bool,
    pub running: bool,
    pub version: Option<String>,
    pub config_ok: Option<bool>,
    pub config_test_output: Option<String>,
}

// @group Utilities : Run a command in WSL as the default user, merging stdout+stderr
fn wsl_exec(distro: &str, cmd: &str) -> String {
    command("wsl")
        .args(["-d", distro, "--", "sh", "-c", cmd])
        .output()
        .map(|o| {
            let out = String::from_utf8_lossy(&o.stdout).into_owned();
            let err = String::from_utf8_lossy(&o.stderr).into_owned();
            format!("{out}{err}").trim_end().to_string()
        })
        .unwrap_or_default()
}

// @group Utilities : Run a command in WSL as root
fn wsl_root(distro: &str, cmd: &str) -> Result<String, String> {
    command("wsl")
        .args(["-d", distro, "-u", "root", "--", "sh", "-c", cmd])
        .output()
        .map_err(|e| format!("WSL exec error: {e}"))
        .map(|o| {
            let out = String::from_utf8_lossy(&o.stdout).into_owned();
            let err = String::from_utf8_lossy(&o.stderr).into_owned();
            format!("{out}{err}").trim_end().to_string()
        })
}

// @group Utilities : Validate service name chars to prevent shell injection
fn validate_service_name(name: &str) -> Result<(), String> {
    if name.is_empty() || name.len() > 128 {
        return Err("Invalid service name length".into());
    }
    if !name.chars().all(|c| c.is_alphanumeric() || matches!(c, '-' | '_' | '.')) {
        return Err(format!("Service name contains invalid characters: {name}"));
    }
    Ok(())
}

// @group BusinessLogic : List all systemd services in a distro
pub fn list_services(distro_name: &str) -> Result<Vec<ServiceInfo>, String> {
    let raw = wsl_exec(
        distro_name,
        "systemctl list-units --type=service --all --no-pager --plain --no-legend 2>&1",
    );

    if raw.trim().is_empty() {
        return Err("No output — systemd may not be running in this distro.".into());
    }
    if raw.contains("Failed to connect to bus") || raw.contains("No such file or directory") {
        return Err(
            "systemd is not running. Enable it by adding [boot]\\nsystemd=true to /etc/wsl.conf.".into(),
        );
    }

    let mut services: Vec<ServiceInfo> = raw
        .lines()
        .filter_map(|line| {
            let line = line.trim().trim_start_matches('●').trim();
            if line.is_empty() { return None; }
            let tokens: Vec<&str> = line.split_whitespace().collect();
            if tokens.len() < 4 { return None; }
            let unit = tokens[0];
            if !unit.ends_with(".service") { return None; }
            Some(ServiceInfo {
                name: unit.trim_end_matches(".service").to_string(),
                load: tokens[1].to_string(),
                active: tokens[2].to_string(),
                sub: tokens[3].to_string(),
                description: if tokens.len() > 4 { tokens[4..].join(" ") } else { String::new() },
            })
        })
        .collect();

    // Sort: failed → active → inactive, then alphabetically within groups
    services.sort_by(|a, b| {
        let rank = |s: &str| match s { "failed" => 0u8, "active" => 1, _ => 2 };
        rank(&a.active).cmp(&rank(&b.active)).then(a.name.cmp(&b.name))
    });

    Ok(services)
}

// @group BusinessLogic : Control a single systemd service (start/stop/restart/reload)
pub fn control_service(distro_name: &str, service: &str, action: &str) -> Result<String, String> {
    const ALLOWED: &[&str] = &["start", "stop", "restart", "reload"];
    if !ALLOWED.contains(&action) {
        return Err(format!("Invalid action: {action}"));
    }
    validate_service_name(service)?;
    wsl_root(distro_name, &format!("systemctl {action} {service}.service 2>&1"))
}

// @group BusinessLogic : Get nginx installation, running state and config test
pub fn get_nginx_info(distro_name: &str) -> Result<NginxInfo, String> {
    let which = wsl_exec(distro_name, "command -v nginx 2>/dev/null");
    let installed = !which.trim().is_empty();

    if !installed {
        return Ok(NginxInfo {
            installed: false,
            running: false,
            version: None,
            config_ok: None,
            config_test_output: None,
        });
    }

    let version_raw = wsl_exec(distro_name, "nginx -v 2>&1");
    let version = if version_raw.trim().is_empty() { None } else { Some(version_raw.trim().to_string()) };

    // Try systemctl first, fall back to pidof for non-systemd distros
    let active_raw = wsl_exec(
        distro_name,
        "systemctl is-active nginx 2>/dev/null || (pidof nginx >/dev/null 2>&1 && echo active || echo inactive)",
    );
    let running = active_raw.trim() == "active";

    let config_test = wsl_root(distro_name, "nginx -t 2>&1").ok();
    let config_ok = config_test.as_ref().map(|o| {
        o.contains("syntax is ok") || o.contains("test is successful")
    });

    Ok(NginxInfo { installed, running, version, config_ok, config_test_output: config_test })
}

// @group BusinessLogic : Control nginx (start/stop/restart/reload)
pub fn control_nginx(distro_name: &str, action: &str) -> Result<String, String> {
    const ALLOWED: &[&str] = &["start", "stop", "restart", "reload"];
    if !ALLOWED.contains(&action) {
        return Err(format!("Invalid nginx action: {action}"));
    }
    // Try systemctl first; fall back to legacy service command
    wsl_root(
        distro_name,
        &format!("systemctl {action} nginx 2>&1 || service nginx {action} 2>&1"),
    )
}

// @group BusinessLogic : Read /etc/nginx/nginx.conf from a distro
pub fn get_nginx_config(distro_name: &str) -> Result<String, String> {
    let out = wsl_exec(distro_name, "cat /etc/nginx/nginx.conf 2>&1");
    if out.contains("No such file") || out.contains("cannot open") {
        return Err("nginx.conf not found at /etc/nginx/nginx.conf".into());
    }
    Ok(out)
}

// @group BusinessLogic : List site configs from sites-enabled (or conf.d fallback)
pub fn list_nginx_sites(distro_name: &str) -> Result<Vec<String>, String> {
    let out = wsl_exec(
        distro_name,
        "ls /etc/nginx/sites-enabled/ 2>/dev/null || ls /etc/nginx/conf.d/ 2>/dev/null",
    );
    Ok(out.lines()
        .map(|l| l.trim().to_string())
        .filter(|l| !l.is_empty())
        .collect())
}
