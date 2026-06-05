// @group Utilities : WSL API wrapper — thin layer over wsl.exe CLI
pub mod distro;
pub mod process;
pub mod network;
pub mod resource;
pub mod services;
pub mod pty;

// @group Utilities : Build a std::process::Command that never flashes a console window.
// On Windows, GUI apps must pass CREATE_NO_WINDOW (0x0800_0000) to child processes,
// otherwise each wsl.exe/netsh/ping invocation pops up a black console window —
// extremely visible here because Resources/Processes poll on an interval.
pub fn command(program: &str) -> std::process::Command {
    let cmd = std::process::Command::new(program);
    #[cfg(windows)]
    {
        use std::os::windows::process::CommandExt;
        const CREATE_NO_WINDOW: u32 = 0x0800_0000;
        let mut cmd = cmd;
        cmd.creation_flags(CREATE_NO_WINDOW);
        return cmd;
    }
    #[cfg(not(windows))]
    cmd
}
