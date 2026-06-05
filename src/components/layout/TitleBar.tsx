// @group Configuration : Custom frameless window titlebar
import { useState, useEffect, useCallback, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Minus, Square, X, Maximize2, ChevronDown, Server } from "lucide-react";
import { useUiStore } from "../../store/uiStore";
import { useDistroStore } from "../../store/distroStore";

const PAGE_LABELS: Record<string, string> = {
  distros:   "Distro Manager",
  resources: "Resource Monitor",
  processes: "Process Manager",
  files:     "File Explorer",
  terminal:  "Terminal",
  network:   "Network Info",
  snapshots: "Snapshot Manager",
  services:  "Service Manager",
  nginx:     "Nginx",
  settings:  "Settings",
};

// @group BusinessLogic : TitleBar component
export function TitleBar() {
  const { currentPage } = useUiStore();
  const { distros, selectedDistro, selectDistro } = useDistroStore();
  const [isMaximized, setIsMaximized] = useState(false);
  const [distroDropOpen, setDistroDropOpen] = useState(false);
  const distroDropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!distroDropOpen) return;
    const handler = (e: MouseEvent) => {
      if (distroDropRef.current && !distroDropRef.current.contains(e.target as Node))
        setDistroDropOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [distroDropOpen]);

  const syncMax = useCallback(async () => {
    try { setIsMaximized(await invoke<boolean>("is_maximized")); } catch {}
  }, []);

  useEffect(() => { syncMax(); }, [syncMax]);

  const minimize = () => invoke("minimize_window").catch(() => {});
  const maximize = async () => { await invoke("toggle_maximize").catch(() => {}); syncMax(); };
  const close    = () => invoke("close_window").catch(() => {});

  return (
    <div
      className="flex items-center shrink-0 select-none"
      style={{
        height: 34,
        background: "var(--bg-app)",
        borderBottom: "1px solid var(--border)",
      }}
    >
      {/* Drag region */}
      <div
        className="flex items-center gap-2.5 pl-4 flex-1 h-full"
        data-tauri-drag-region
        style={{ cursor: "default" }}
      >
        <div
          className="flex items-center justify-center rounded shrink-0"
          style={{
            width: 18, height: 18,
            background: "linear-gradient(135deg, var(--accent) 0%, var(--accent-text) 100%)",
          }}
        >
          <svg width="11" height="11" viewBox="0 0 18 18" fill="none">
            <circle cx="9" cy="6.5" r="3.8" fill="white" fillOpacity="0.92" />
            <ellipse cx="9" cy="14" rx="5.5" ry="2.3" fill="white" fillOpacity="0.65" />
            <rect x="7.2" y="10.5" width="3.6" height="2" rx="1" fill="white" fillOpacity="0.88" />
          </svg>
        </div>

        <span style={{ fontSize: 11, fontWeight: 600, color: "var(--text-3)", letterSpacing: "0.02em" }}>
          distrod
        </span>
        <span style={{ color: "var(--text-4)", fontSize: 11, margin: "0 2px" }}>·</span>
        <span style={{ fontSize: 11, fontWeight: 400, color: "var(--text-3)" }}>
          {PAGE_LABELS[currentPage] ?? currentPage}
        </span>
      </div>

      {/* Distro selector */}
      <div ref={distroDropRef} style={{ position: "relative", marginRight: 8 }}>
        <button
          onClick={() => setDistroDropOpen((o) => !o)}
          style={{
            display: "flex", alignItems: "center", gap: 5,
            padding: "3px 8px", borderRadius: 6, cursor: "pointer",
            background: distroDropOpen ? "var(--accent-dim)" : "var(--bg-surface)",
            border: `1px solid ${distroDropOpen ? "var(--border-accent)" : "var(--border)"}`,
            color: selectedDistro ? "var(--text-2)" : "var(--text-3)",
            fontSize: 10, fontFamily: "inherit", fontWeight: 500,
            transition: "background 0.12s, border-color 0.12s",
            maxWidth: 136, height: 22,
          }}
        >
          <Server size={10} style={{ flexShrink: 0, color: selectedDistro ? "var(--accent)" : "var(--text-3)" }} />
          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 90 }}>
            {selectedDistro ?? "Select distro"}
          </span>
          <ChevronDown size={9} style={{ flexShrink: 0, transition: "transform 0.15s", transform: distroDropOpen ? "rotate(180deg)" : "rotate(0deg)" }} />
        </button>

        {distroDropOpen && (
          <div style={{
            position: "absolute", top: "calc(100% + 5px)", right: 0,
            background: "var(--bg-card)", border: "1px solid var(--border-hover)",
            borderRadius: 9, boxShadow: "0 8px 28px rgba(0,0,0,0.5)",
            minWidth: 150, zIndex: 200, overflow: "hidden", padding: 3,
          }}>
            {distros.length === 0 ? (
              <div style={{ padding: "8px 10px", fontSize: 11, color: "var(--text-3)" }}>No distros found</div>
            ) : (
              distros.map((d) => (
                <DropItem
                  key={d.name}
                  active={selectedDistro === d.name}
                  onClick={() => { selectDistro(d.name); setDistroDropOpen(false); }}
                >
                  <span style={{
                    width: 5, height: 5, borderRadius: "50%", flexShrink: 0,
                    background: d.status === "running" ? "#10b981" : "var(--text-4)",
                    boxShadow: d.status === "running" ? "0 0 5px rgba(16,185,129,0.5)" : "none",
                  }} />
                  {d.name}
                </DropItem>
              ))
            )}
          </div>
        )}
      </div>

      {/* Window controls */}
      <div className="flex items-center h-full">
        <WinBtn onClick={minimize} title="Minimize"><Minus size={12} strokeWidth={2.2} /></WinBtn>
        <WinBtn onClick={maximize} title={isMaximized ? "Restore" : "Maximize"}>
          {isMaximized ? <Square size={10} strokeWidth={2.2} /> : <Maximize2 size={11} strokeWidth={2.2} />}
        </WinBtn>
        <WinBtn onClick={close} title="Close" danger><X size={12} strokeWidth={2.2} /></WinBtn>
      </div>
    </div>
  );
}

// @group Utilities : Dropdown item
function DropItem({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  const [h, setH] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      style={{
        width: "100%", textAlign: "left", display: "flex", alignItems: "center",
        gap: 7, padding: "6px 9px", borderRadius: 6, border: "none",
        background: active || h ? "var(--accent-dim)" : "transparent",
        color: active || h ? "var(--accent-text)" : "var(--text-2)",
        fontSize: 11, fontFamily: "inherit", cursor: "pointer",
        transition: "background 0.10s, color 0.10s",
      }}
    >
      {children}
    </button>
  );
}

// @group Utilities : Window control button
function WinBtn({ onClick, title, danger, children }: { onClick: () => void; title: string; danger?: boolean; children: React.ReactNode }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick} title={title}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: 40, height: "100%",
        display: "flex", alignItems: "center", justifyContent: "center",
        border: "none",
        background: hovered ? (danger ? "rgba(244,63,94,0.80)" : "var(--bg-hover)") : "transparent",
        color: hovered ? (danger ? "#fff" : "var(--text-2)") : "var(--text-3)",
        cursor: "default",
        transition: "background 0.12s, color 0.12s",
      }}
    >
      {children}
    </button>
  );
}
