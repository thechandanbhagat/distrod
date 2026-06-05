// @group BusinessLogic : PTY session management — real interactive shells via ConPTY
use portable_pty::{native_pty_system, CommandBuilder, PtySize};
use std::collections::HashMap;
use std::io::{Read, Write};
use std::sync::Mutex;
use tauri::Emitter;

// @group Types : Live PTY session — holds the write half, master for resize, and child to keep process alive
pub struct PtyHandle {
    pub writer: Box<dyn Write + Send>,
    pub master: Box<dyn portable_pty::MasterPty + Send>,
    #[allow(dead_code)]  // stored to keep WSL process alive — dropped when session closes
    pub child: Box<dyn portable_pty::Child + Send + Sync>,
}

// @group Types : Global PTY session registry managed by Tauri state
#[derive(Default)]
pub struct PtySessions(pub Mutex<HashMap<String, PtyHandle>>);

// @group BusinessLogic : Spawn a WSL distro shell in a PTY and stream output via Tauri events
pub fn create_session(
    app: tauri::AppHandle,
    sessions: &PtySessions,
    distro_name: &str,
    tab_id: &str,
    cols: u16,
    rows: u16,
) -> Result<(), String> {
    eprintln!("[PTY] create_session: distro={distro_name} tab={tab_id} {cols}x{rows}");

    let pty_system = native_pty_system();

    let pair = pty_system
        .openpty(PtySize { rows, cols, pixel_width: 0, pixel_height: 0 })
        .map_err(|e| { eprintln!("[PTY] openpty failed: {e}"); format!("openpty failed: {e}") })?;

    eprintln!("[PTY] openpty OK");

    // Use full system path to avoid PATH lookup issues in Tauri process
    let wsl_path = r"C:\Windows\System32\wsl.exe";
    let mut cmd = CommandBuilder::new(wsl_path);
    // Start in the Linux home dir (~), not the inherited Windows CWD. Without --cd, WSL
    // translates the Tauri process's working directory (e.g. C:\Users\Chand) to /mnt/c/...,
    // so the shell would open in /mnt/c/Users/Chand instead of /home/<user> like a normal launch.
    cmd.args(["-d", distro_name, "--cd", "~", "--", "/bin/bash", "-i", "-l"]);
    cmd.env("TERM", "xterm-256color");
    cmd.env("COLORTERM", "truecolor");

    eprintln!("[PTY] spawning: {wsl_path} -d {distro_name} -- /bin/bash -i -l");

    let child = pair.slave
        .spawn_command(cmd)
        .map_err(|e| { eprintln!("[PTY] spawn_command failed: {e}"); format!("Failed to spawn WSL shell: {e}") })?;

    eprintln!("[PTY] spawn_command OK");

    // Close the slave end on the host side after spawning
    drop(pair.slave);

    let master = pair.master;

    let mut reader = master
        .try_clone_reader()
        .map_err(|e| { eprintln!("[PTY] try_clone_reader failed: {e}"); format!("Failed to clone PTY reader: {e}") })?;

    let writer = master
        .take_writer()
        .map_err(|e| { eprintln!("[PTY] take_writer failed: {e}"); format!("Failed to take PTY writer: {e}") })?;

    eprintln!("[PTY] reader+writer obtained, starting reader thread");

    // @group BusinessLogic : Background thread — pump PTY output to frontend via events
    let tab_id_owned = tab_id.to_string();
    std::thread::spawn(move || {
        eprintln!("[PTY] reader thread started for {tab_id_owned}");
        let mut buf = vec![0u8; 4096];
        loop {
            match reader.read(&mut buf) {
                Ok(0) => { eprintln!("[PTY] reader EOF for {tab_id_owned}"); break; }
                Err(e) => { eprintln!("[PTY] reader error for {tab_id_owned}: {e}"); break; }
                Ok(n) => {
                    let text = String::from_utf8_lossy(&buf[..n]).into_owned();
                    if let Err(e) = app.emit(&format!("pty-output-{tab_id_owned}"), &text) {
                        eprintln!("[PTY] emit error: {e}");
                    }
                }
            }
        }
        let _ = app.emit(&format!("pty-closed-{tab_id_owned}"), ());
        eprintln!("[PTY] reader thread done for {tab_id_owned}");
    });

    sessions
        .0
        .lock()
        .map_err(|_| "Session lock poisoned".to_string())?
        .insert(tab_id.to_string(), PtyHandle { writer, master, child });

    eprintln!("[PTY] create_session complete for {tab_id}");
    Ok(())
}

// @group BusinessLogic : Write keystroke data to a PTY session stdin
pub fn write_session(sessions: &PtySessions, tab_id: &str, data: &str) -> Result<(), String> {
    let mut map = sessions
        .0
        .lock()
        .map_err(|_| "Session lock poisoned")?;
    if let Some(h) = map.get_mut(tab_id) {
        h.writer.write_all(data.as_bytes()).map_err(|e| e.to_string())?;
        h.writer.flush().map_err(|e| e.to_string())?;
    }
    Ok(())
}

// @group BusinessLogic : Resize PTY dimensions (triggered by terminal container resize)
pub fn resize_session(sessions: &PtySessions, tab_id: &str, cols: u16, rows: u16) -> Result<(), String> {
    let map = sessions
        .0
        .lock()
        .map_err(|_| "Session lock poisoned")?;
    if let Some(h) = map.get(tab_id) {
        h.master
            .resize(PtySize { rows, cols, pixel_width: 0, pixel_height: 0 })
            .map_err(|e| e.to_string())?;
    }
    Ok(())
}

// @group BusinessLogic : Close a PTY session — dropping master closes ConPTY and kills child
pub fn close_session(sessions: &PtySessions, tab_id: &str) -> Result<(), String> {
    sessions
        .0
        .lock()
        .map_err(|_| "Session lock poisoned")?
        .remove(tab_id);
    Ok(())
}
