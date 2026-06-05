// @group Authentication : App sidebar navigation component
import { useState } from "react";
import {
  Server, Activity, Cpu, FolderOpen, Terminal,
  Network, Archive, Layers, Globe, Settings, Menu,
} from "lucide-react";
import { useUiStore } from "../../store/uiStore";
import type { Page } from "../../types";

// @group Types : Nav item definition
interface NavItem {
  id: Page;
  label: string;
  icon: React.ReactNode;
}

// @group Constants : Navigation items
const NAV_ITEMS: NavItem[] = [
  { id: "distros",   label: "Distros",   icon: <Server size={14} /> },
  { id: "resources", label: "Resources", icon: <Activity size={14} /> },
  { id: "processes", label: "Processes", icon: <Cpu size={14} /> },
  { id: "files",     label: "Files",     icon: <FolderOpen size={14} /> },
  { id: "terminal",  label: "Terminal",  icon: <Terminal size={14} /> },
  { id: "network",   label: "Network",   icon: <Network size={14} /> },
  { id: "snapshots", label: "Snapshots", icon: <Archive size={14} /> },
  { id: "services",  label: "Services",  icon: <Layers size={14} /> },
  { id: "nginx",     label: "Nginx",     icon: <Globe size={14} /> },
];

// @group BusinessLogic : Sidebar component
export function Sidebar() {
  const { currentPage, sidebarCollapsed, navigate, toggleSidebar } = useUiStore();

  return (
    <aside
      style={{
        width: sidebarCollapsed ? 52 : 196,
        minWidth: sidebarCollapsed ? 52 : 196,
        background: "var(--bg-app)",
        borderRight: "1px solid var(--border)",
        display: "flex",
        flexDirection: "column",
        transition: "width 0.22s ease, min-width 0.22s ease",
        overflow: "hidden",
      }}
    >
      {/* Logo + collapse toggle */}
      <div style={{
        padding: sidebarCollapsed ? "13px 0" : "13px 12px",
        borderBottom: "1px solid var(--border)",
        display: "flex", alignItems: "center", gap: 9,
        justifyContent: sidebarCollapsed ? "center" : "flex-start",
        flexShrink: 0,
      }}>
        <div style={{
          width: 26, height: 26, borderRadius: 7,
          background: "linear-gradient(135deg, var(--accent) 0%, var(--accent-text) 100%)",
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0, boxShadow: "0 0 14px var(--accent-glow)",
        }}>
          <svg width="14" height="14" viewBox="0 0 18 18" fill="none">
            <circle cx="9" cy="6.5" r="3.8" fill="white" fillOpacity="0.95" />
            <ellipse cx="9" cy="14" rx="5.5" ry="2.3" fill="white" fillOpacity="0.70" />
            <rect x="7.2" y="10.5" width="3.6" height="2" rx="1" fill="white" fillOpacity="0.90" />
          </svg>
        </div>

        {!sidebarCollapsed && (
          <div style={{ overflow: "hidden", flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-1)", letterSpacing: "0.01em", lineHeight: 1 }}>
              distrod
            </div>
            <div style={{ fontSize: 10, color: "var(--text-3)", marginTop: 2, letterSpacing: "0.04em" }}>
              WSL Dashboard
            </div>
          </div>
        )}

        <CollapseBtn collapsed={sidebarCollapsed} onClick={toggleSidebar} />
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: "8px 5px", overflowY: "auto", overflowX: "hidden" }}>
        {!sidebarCollapsed && (
          <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: "0.09em", color: "var(--text-4)", padding: "3px 7px 7px", textTransform: "uppercase" }}>
            Workspace
          </div>
        )}
        {NAV_ITEMS.map((item) => (
          <NavButton
            key={item.id}
            item={item}
            active={currentPage === item.id}
            collapsed={sidebarCollapsed}
            onClick={() => navigate(item.id)}
          />
        ))}
      </nav>

      {/* Settings */}
      <div style={{ borderTop: "1px solid var(--border)", padding: "5px 5px" }}>
        <NavButton
          item={{ id: "settings", label: "Settings", icon: <Settings size={14} /> }}
          active={currentPage === "settings"}
          collapsed={sidebarCollapsed}
          onClick={() => navigate("settings")}
        />
      </div>

    </aside>
  );
}

// @group Utilities : Individual nav button
function NavButton({ item, active, collapsed, onClick }: { item: NavItem; active: boolean; collapsed: boolean; onClick: () => void }) {
  const [hovered, setHovered] = useState(false);

  return (
    <button
      onClick={onClick}
      title={collapsed ? item.label : undefined}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: "relative", width: "100%", display: "flex", alignItems: "center", gap: 8,
        padding: collapsed ? "8px 0" : "7px 9px",
        justifyContent: collapsed ? "center" : "flex-start",
        borderRadius: 7, border: "none", cursor: "pointer",
        fontSize: 12, fontWeight: active ? 500 : 400, fontFamily: "inherit", marginBottom: 1,
        background: active ? "var(--bg-active)" : hovered ? "var(--bg-hover)" : "transparent",
        color: active ? "var(--accent-text)" : hovered ? "var(--text-2)" : "var(--text-3)",
        transition: "background 0.12s, color 0.12s", overflow: "hidden",
      }}
    >
      {active && (
        <span style={{
          position: "absolute", left: 0, top: "50%", transform: "translateY(-50%)",
          width: 2, height: 14, borderRadius: "0 2px 2px 0",
          background: "linear-gradient(180deg, var(--accent), var(--accent-text))",
          boxShadow: "0 0 6px var(--accent-glow)",
        }} />
      )}
      <span style={{ flexShrink: 0, display: "flex", alignItems: "center", opacity: active ? 1 : hovered ? 0.8 : 0.55 }}>
        {item.icon}
      </span>
      {!collapsed && (
        <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {item.label}
        </span>
      )}
    </button>
  );
}

// @group Utilities : Collapse/expand toggle button shown in the logo row
function CollapseBtn({ collapsed, onClick }: { collapsed: boolean; onClick: () => void }) {
  const [h, setH] = useState(false);
  return (
    <button
      onClick={onClick}
      title={collapsed ? "Expand" : "Collapse"}
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      style={{
        width: 22, height: 22, borderRadius: 6, flexShrink: 0,
        display: "flex", alignItems: "center", justifyContent: "center",
        border: "1px solid transparent",
        background: h ? "var(--bg-hover)" : "transparent",
        borderColor: h ? "var(--border)" : "transparent",
        color: h ? "var(--text-3)" : "var(--text-4)",
        cursor: "pointer", transition: "all 0.15s",
        marginLeft: collapsed ? 0 : "auto",
      }}
    >
      <Menu size={12} />
    </button>
  );
}
