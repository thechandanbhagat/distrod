// @group APIEndpoints : Tauri commands for WSL filesystem operations
use tauri::command;
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::Path;

// @group Types : Filesystem entry model
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct FsEntry {
    pub name: String,
    pub path: String,
    pub kind: String, // "file" | "dir" | "symlink"
    pub size: Option<u64>,
    pub permissions: Option<String>,
    pub modified_at: Option<u64>,
    pub children: Option<Vec<FsEntry>>,
}

// @group Validation : Build a UNC path for a distro's root in \\wsl$, rejecting traversal.
// Both the distro name and the requested path are frontend-supplied, so we must ensure
// the result stays inside the selected distro's tree — otherwise a path containing ".."
// could escape into another distro or, combined with delete_entry's remove_dir_all,
// recursively wipe an unintended location.
fn wsl_path(distro_name: &str, wsl_path: &str) -> Result<String, String> {
    if distro_name.is_empty()
        || distro_name.contains('/')
        || distro_name.contains('\\')
        || distro_name.contains("..")
    {
        return Err("Invalid distro name".into());
    }
    let clean = wsl_path.trim_start_matches('/');
    // Any ".." component (in either separator style) can escape the distro root.
    if clean.split(['/', '\\']).any(|comp| comp == "..") {
        return Err("Path traversal ('..') is not allowed".into());
    }
    Ok(format!("\\\\wsl$\\{distro_name}\\{}", clean.replace('/', "\\")))
}

// @group APIEndpoints > File : List directory contents
#[command]
pub fn list_directory(distro_name: String, path: String) -> Result<Vec<FsEntry>, String> {
    let win_path = wsl_path(&distro_name, &path)?;
    let entries = fs::read_dir(&win_path)
        .map_err(|e| format!("Failed to read directory {win_path}: {e}"))?;

    let mut result = Vec::new();
    for entry in entries.flatten() {
        let metadata = entry.metadata().ok();
        let kind = if let Some(ref m) = metadata {
            if m.is_dir() {
                "dir"
            } else if m.is_symlink() {
                "symlink"
            } else {
                "file"
            }
        } else {
            "file"
        };
        let size = metadata.as_ref().map(|m| m.len());
        let modified_at = metadata
            .as_ref()
            .and_then(|m| m.modified().ok())
            .and_then(|t| {
                t.duration_since(std::time::UNIX_EPOCH)
                    .ok()
                    .map(|d| d.as_secs())
            });

        let name = entry.file_name().to_string_lossy().into_owned();
        let entry_path = format!("{path}/{name}");

        result.push(FsEntry {
            name,
            path: entry_path,
            kind: kind.to_string(),
            size,
            permissions: None,
            modified_at,
            children: None,
        });
    }

    result.sort_by(|a, b| {
        // Dirs first, then files
        match (a.kind.as_str(), b.kind.as_str()) {
            ("dir", "dir") | ("file", "file") => a.name.cmp(&b.name),
            ("dir", _) => std::cmp::Ordering::Less,
            (_, "dir") => std::cmp::Ordering::Greater,
            _ => a.name.cmp(&b.name),
        }
    });

    Ok(result)
}

// @group APIEndpoints > File : Create a new directory
#[command]
pub fn create_directory(distro_name: String, path: String) -> Result<(), String> {
    let win_path = wsl_path(&distro_name, &path)?;
    fs::create_dir_all(&win_path).map_err(|e| format!("Failed to create directory: {e}"))
}

// @group APIEndpoints > File : Delete a file or directory
#[command]
pub fn delete_entry(distro_name: String, path: String, is_dir: bool) -> Result<(), String> {
    let win_path = wsl_path(&distro_name, &path)?;
    if is_dir {
        fs::remove_dir_all(&win_path).map_err(|e| format!("Failed to delete directory: {e}"))
    } else {
        fs::remove_file(&win_path).map_err(|e| format!("Failed to delete file: {e}"))
    }
}

// @group APIEndpoints > File : Rename (move) a file or directory
#[command]
pub fn rename_entry(
    distro_name: String,
    old_path: String,
    new_path: String,
) -> Result<(), String> {
    let old = wsl_path(&distro_name, &old_path)?;
    let new = wsl_path(&distro_name, &new_path)?;
    fs::rename(&old, &new).map_err(|e| format!("Failed to rename: {e}"))
}

// @group APIEndpoints > File : Copy a Windows file into WSL
#[command]
pub fn copy_to_wsl(
    distro_name: String,
    windows_src: String,
    wsl_dest: String,
) -> Result<(), String> {
    let dest = wsl_path(&distro_name, &wsl_dest)?;
    let src_path = Path::new(&windows_src);
    let dest_path = Path::new(&dest);
    let dest_file = if dest_path.is_dir() {
        dest_path.join(src_path.file_name().ok_or("Invalid source path")?)
    } else {
        dest_path.to_path_buf()
    };
    fs::copy(&windows_src, dest_file).map_err(|e| format!("Failed to copy file: {e}"))?;
    Ok(())
}
