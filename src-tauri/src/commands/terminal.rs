// @group APIEndpoints : Tauri command for running shell commands inside a distro
use tauri::command;

// @group APIEndpoints > Terminal : Run an arbitrary shell command in a distro and return stdout+stderr
#[command]
pub fn run_shell_command(
    distro_name: String,
    command: String,
    cwd: String,
) -> Result<String, String> {
    // Expand ~ to /root as a simple heuristic; actual home varies per distro
    let resolved_cwd = if cwd == "~" { "/root".to_string() } else { cwd };

    let shell_cmd = format!("cd {resolved_cwd} && {command} 2>&1");

    let output = crate::wsl::command("wsl")
        .args(["-d", &distro_name, "--", "sh", "-c", &shell_cmd])
        .output()
        .map_err(|e| format!("Failed to execute command: {e}"))?;

    let stdout = String::from_utf8_lossy(&output.stdout).into_owned();
    let stderr = String::from_utf8_lossy(&output.stderr).into_owned();

    // Merge stdout and stderr (stderr already redirected via 2>&1, but include as fallback)
    let combined = if stderr.is_empty() {
        stdout
    } else {
        format!("{stdout}{stderr}")
    };

    Ok(combined.trim_end().to_string())
}
