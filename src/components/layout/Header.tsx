// @group Authentication : Page header bar
import { useState } from "react";
import { RefreshCw, Server, Activity, Cpu, FolderOpen, Terminal, Network, Archive, Layers, Globe, Settings } from "lucide-react";
import { useUiStore } from "../../store/uiStore";
import type { Page } from "../../types";

// @group Constants : Per-page metadata
const PAGE_META: Record<Page, { title: string; sub: string; icon: React.ReactNode }> = {
  distros:   { title: "Distro Manager",   sub: "Manage your WSL distributions",         icon: <Server size={13} /> },
  resources: { title: "Resource Monitor", sub: "CPU, memory & disk in real time",        icon: <Activity size={13} /> },
  processes: { title: "Process Manager",  sub: "Inspect and control Linux processes",    icon: <Cpu size={13} /> },
  files:     { title: "File Explorer",    sub: "Browse and manage the WSL filesystem",   icon: <FolderOpen size={13} /> },
  terminal:  { title: "Terminal",         sub: "Interactive shell sessions per distro",  icon: <Terminal size={13} /> },
  network:   { title: "Network Info",     sub: "IP addresses and port forwarding rules", icon: <Network size={13} /> },
  snapshots: { title: "Snapshot Manager", sub: "Backup and restore distro snapshots",    icon: <Archive size={13} /> },
  services:  { title: "Service Manager",  sub: "Control systemd services",               icon: <Layers size={13} /> },
  nginx:     { title: "Nginx",            sub: "Web server status and configuration",    icon: <Globe size={13} /> },
  settings:  { title: "Settings",         sub: "Configure distrod preferences",          icon: <Settings size={13} /> },
};

interface HeaderProps { onRefresh?: () => void; }

// @group BusinessLogic : Header component
export function Header({ onRefresh }: HeaderProps) {
  const { currentPage } = useUiStore();
  const meta = PAGE_META[currentPage];
  const [spinning, setSpinning] = useState(false);

  const handleRefresh = () => {
    if (!onRefresh || spinning) return;
    setSpinning(true);
    onRefresh();
    setTimeout(() => setSpinning(false), 600);
  };

  return (
    <header style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "10px 20px",
      borderBottom: "1px solid var(--border)",
      background: "var(--bg-app)",
      backdropFilter: "blur(8px)",
      flexShrink: 0,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{
          width: 2, height: 28, borderRadius: 99,
          background: "linear-gradient(180deg, var(--accent) 0%, transparent 100%)",
          flexShrink: 0,
        }} />
        <div style={{
          width: 28, height: 28, borderRadius: 7,
          background: "var(--accent-dim)",
          border: "1px solid var(--border-accent)",
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "var(--accent-text)", flexShrink: 0,
        }}>
          {meta.icon}
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-1)", lineHeight: 1.2 }}>
            {meta.title}
          </div>
          <div style={{ fontSize: 10, color: "var(--text-3)", marginTop: 1.5, lineHeight: 1 }}>
            {meta.sub}
          </div>
        </div>
      </div>

      {onRefresh && (
        <button
          onClick={handleRefresh}
          title="Refresh"
          style={{
            width: 28, height: 28, borderRadius: 7,
            border: "1px solid var(--border)",
            background: "transparent", color: "var(--text-3)",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", transition: "background 0.15s, color 0.15s, border-color 0.15s",
          }}
          onMouseEnter={(e) => {
            const b = e.currentTarget as HTMLButtonElement;
            b.style.background = "var(--accent-dim)";
            b.style.color = "var(--accent-text)";
            b.style.borderColor = "var(--border-accent)";
          }}
          onMouseLeave={(e) => {
            const b = e.currentTarget as HTMLButtonElement;
            b.style.background = "transparent";
            b.style.color = "var(--text-3)";
            b.style.borderColor = "var(--border)";
          }}
        >
          <RefreshCw size={12} style={{ transition: "transform 0.55s", transform: spinning ? "rotate(360deg)" : "rotate(0deg)" }} />
        </button>
      )}
    </header>
  );
}
