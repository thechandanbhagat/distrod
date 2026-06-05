# distrod

A native Windows desktop app for managing WSL2 distributions, built with Tauri, React, and Rust.

---

## What it does

- Browse, start, stop, and configure WSL2 distributions
- Monitor real-time CPU, memory, and disk usage per distro
- View and manage running processes inside any distro
- Browse the Linux filesystem from Windows
- Manage system services (start/stop/enable/disable)
- Create and restore distro snapshots
- Inspect network interfaces and port mappings
- Manage nginx configuration
- Integrated PTY terminal with full xterm.js support

---

## Tech stack

| Layer | Technology |
|---|---|
| UI | React 19, TypeScript, Tailwind CSS v4 |
| Charts | Recharts |
| State | Zustand |
| Terminal | xterm.js |
| Desktop shell | Tauri v2 |
| Backend | Rust (Tokio async runtime) |
| PTY | portable-pty |

---

## Prerequisites

- Windows 10/11 with WSL2 enabled
- [Node.js](https://nodejs.org/) 20+
- [Rust](https://rustup.rs/) (stable toolchain)
- [Tauri CLI prerequisites](https://tauri.app/start/prerequisites/)

---

## Getting started

```powershell
# Install dependencies
npm install

# Run in development mode (hot reload)
npm run tauri dev

# Build for production
npm run tauri build
```

---

## Project structure

```
src/                  React frontend
  components/         Layout, distro cards, shared UI
  hooks/              Custom hooks (polling, Tauri invoke, resources)
  pages/              One page per feature (distros, terminal, processes, etc.)
  store/              Zustand stores
  types/              Shared TypeScript types
  themes/             Theme definitions

src-tauri/            Rust backend
  src/commands/       Tauri command handlers
  src/wsl/            WSL2 integration layer
```

---

## Development

```powershell
# Frontend only (Vite dev server)
npm run dev

# Type check
npx tsc --noEmit

# Frontend production build
npm run build
```

---

## Recommended IDE setup

- [VS Code](https://code.visualstudio.com/)
- [Tauri extension](https://marketplace.visualstudio.com/items?itemName=tauri-apps.tauri-vscode)
- [rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer)
