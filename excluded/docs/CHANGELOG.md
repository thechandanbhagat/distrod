# Changelog

All notable changes to distrod are documented here.

## [0.1.1] — 2026-06-19

### Added
- Shared distrod logo component and SVG mark
- Regenerated branded app icons for the desktop bundle

### Changed
- Reused the new logo in the sidebar and title bar

## [0.1.0] — 2026-05-26

### Added
- Initial project scaffold with Tauri v2 + React + TypeScript
- **Distro Manager** — list, start, stop, set-default, import, export WSL distros
- **Resource Monitor** — real-time CPU/memory/disk charts (2s refresh) with configurable alert thresholds
- **Process Manager** — ps-based process table with kill, search, and sortable columns
- **File Explorer** — browse WSL filesystem via `\\wsl$`, create/delete folders
- **Terminal** — embedded multi-tab shell with command history and font size control
- **Network Info** — WSL IP display, ping test, port forwarding management via `netsh`
- **Snapshot Manager** — one-click `wsl --export` / `wsl --import` with history
- **Settings** — configurable resource alert thresholds
- Dark theme with Tailwind CSS
- Zustand state management
- Recharts for resource graphs
- MIT license
