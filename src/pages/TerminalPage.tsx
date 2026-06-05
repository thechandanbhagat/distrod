// @group APIEndpoints : Terminal page — real PTY sessions with xterm.js
import { useState, useRef, useCallback, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import "@xterm/xterm/css/xterm.css";
import { Plus, X, Terminal as TerminalIcon } from "lucide-react";
import { Header } from "../components/layout/Header";
import { useDistroStore } from "../store/distroStore";
import type { TerminalTab } from "../types";

// @group Types : Per-tab terminal instance bundle
interface TermInstance {
  term: Terminal;
  fitAddon: FitAddon;
  unlisten: () => void;
  unlistenClose: () => void;
  observer: ResizeObserver;
}

// @group Utilities : Build xterm.js theme from current CSS custom properties
function getXtermTheme() {
  const s = getComputedStyle(document.documentElement);
  const v = (n: string) => s.getPropertyValue(n).trim();
  return {
    background:          v("--bg-app")   || "#060810",
    foreground:          v("--text-1")   || "#dde4f0",
    cursor:              v("--accent")   || "#7c5cfc",
    cursorAccent:        v("--bg-app")   || "#060810",
    selectionBackground: "rgba(124,92,252,0.22)",
    black:   "#1e2a38", red:         "#f43f5e", green:        "#10b981", yellow:       "#f59e0b",
    blue:    "#3b82f6", magenta:     "#7c5cfc", cyan:         "#22d3ee", white:        "#dde4f0",
    brightBlack:   "#3d4f68", brightRed:   "#f87171", brightGreen:  "#34d399", brightYellow: "#fbbf24",
    brightBlue:    "#60a5fa", brightMagenta:"#a78bfa", brightCyan:  "#67e8f9", brightWhite:  "#f1f5f9",
  };
}

// @group BusinessLogic : TerminalPage component
export function TerminalPage() {
  const { selectedDistro } = useDistroStore();
  const [tabs, setTabs] = useState<TerminalTab[]>([]);
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const [fontSize, setFontSize] = useState(9);

  const fontSizeRef    = useRef(fontSize);
  const termInstances  = useRef<Map<string, TermInstance>>(new Map());
  const containerRefs  = useRef<Map<string, HTMLDivElement>>(new Map());
  const initTermRef    = useRef<((tabId: string, distroName: string, el: HTMLDivElement) => Promise<void>) | null>(null);

  // Keep fontSizeRef in sync
  useEffect(() => { fontSizeRef.current = fontSize; }, [fontSize]);

  // Fit active terminal after tab switch (container transitions from display:none to flex)
  useEffect(() => {
    if (!activeTab) return;
    const inst = termInstances.current.get(activeTab);
    if (!inst) return;
    requestAnimationFrame(() => { try { inst.fitAddon.fit(); } catch {} });
  }, [activeTab]);

  // Update font size on all open terminals when changed
  useEffect(() => {
    termInstances.current.forEach(({ term, fitAddon }) => {
      term.options.fontSize = fontSize;
      try { fitAddon.fit(); } catch {}
    });
  }, [fontSize]);

  // Cleanup all sessions when page unmounts
  useEffect(() => {
    return () => {
      termInstances.current.forEach(({ term, fitAddon: _, unlisten, unlistenClose, observer }, tabId) => {
        unlisten();
        unlistenClose();
        observer.disconnect();
        term.dispose();
        invoke("pty_close", { tabId }).catch(() => {});
      });
      termInstances.current.clear();
      containerRefs.current.clear();
    };
  }, []);

  // @group BusinessLogic : Initialise an xterm.js terminal and attach it to a PTY session
  const initTerminal = useCallback(async (tabId: string, distroName: string, container: HTMLDivElement) => {
    console.log(`[PTY] initTerminal start — tab=${tabId} distro=${distroName}`);

    const term = new Terminal({
      fontFamily: "'JetBrains Mono', 'Cascadia Code', 'Consolas', monospace",
      fontSize: fontSizeRef.current,
      theme: getXtermTheme(),
      cursorBlink: true,
      cursorStyle: "bar",
      scrollback: 5000,
      allowProposedApi: true,
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.open(container);
    console.log(`[PTY] xterm opened, container size: ${container.offsetWidth}x${container.offsetHeight}`);

    // Wait two frames so the container has real layout dimensions before fitting
    await new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r())));
    try { fitAddon.fit(); } catch (e) { console.warn("[PTY] fitAddon.fit() error:", e); }

    const dims = fitAddon.proposeDimensions();
    const cols = dims?.cols ?? 80;
    const rows = dims?.rows ?? 24;
    console.log(`[PTY] terminal dimensions: cols=${cols} rows=${rows}`);

    // Register event listeners BEFORE spawning so we don't miss early output
    const unlisten = await listen<string>(`pty-output-${tabId}`, (e) => {
      term.write(e.payload);
    });

    const unlistenClose = await listen(`pty-closed-${tabId}`, () => {
      term.write("\r\n\x1b[2m[session ended — close this tab to open a new one]\x1b[0m\r\n");
    });

    console.log(`[PTY] event listeners registered, invoking pty_create...`);
    try {
      await invoke("pty_create", { distroName, tabId, cols, rows });
      console.log(`[PTY] pty_create succeeded for ${tabId}`);
    } catch (err) {
      console.error(`[PTY] pty_create FAILED for ${tabId}:`, err);
      term.write(`\x1b[31mFailed to start PTY: ${String(err)}\x1b[0m\r\n`);
    }

    // Forward keystrokes to PTY
    term.onData((data) => {
      invoke("pty_write", { tabId, data }).catch((e) => console.error("[PTY] pty_write error:", e));
    });

    // Forward resize events to PTY
    term.onResize(({ cols, rows }) => {
      invoke("pty_resize", { tabId, cols, rows }).catch(() => {});
    });

    // Auto-fit when container size changes
    const observer = new ResizeObserver(() => { try { fitAddon.fit(); } catch {} });
    observer.observe(container);

    termInstances.current.set(tabId, { term, fitAddon, unlisten, unlistenClose, observer });
    console.log(`[PTY] initTerminal complete for ${tabId}`);
  }, []);

  // Keep a stable ref so the container ref callback can always call the latest version
  initTermRef.current = initTerminal;

  // @group BusinessLogic : Stable ref callback — initialises terminal once per container
  const handleContainerRef = useCallback((tabId: string, distroName: string, el: HTMLDivElement | null) => {
    if (!el || containerRefs.current.has(tabId)) return;
    containerRefs.current.set(tabId, el);
    initTermRef.current?.(tabId, distroName, el).catch((err) => {
      console.error("[TerminalPage] initTerminal failed:", err);
    });
  }, []);

  const openTab = useCallback((distroName: string) => {
    // The id is used to build Tauri event channel names (pty-output-<id>), which only
    // allow [a-zA-Z0-9-/:_] — so it must NOT embed the raw distro name (e.g. "Ubuntu-22.04"
    // contains a '.', which would make listen()/emit() fail and leave the pane blank).
    const id = `term-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    setTabs((t) => [...t, { id, distroName, title: distroName }]);
    setActiveTab(id);
  }, []);

  const closeTab = useCallback((id: string) => {
    const inst = termInstances.current.get(id);
    if (inst) {
      inst.unlisten();
      inst.unlistenClose();
      inst.observer.disconnect();
      inst.term.dispose();
      termInstances.current.delete(id);
    }
    containerRefs.current.delete(id);
    invoke("pty_close", { tabId: id }).catch(() => {});

    setTabs((prev) => {
      const remaining = prev.filter((t) => t.id !== id);
      setActiveTab((cur) => {
        if (cur !== id) return cur;
        const idx = prev.findIndex((t) => t.id === id);
        return (remaining[idx] ?? remaining[idx - 1] ?? null)?.id ?? null;
      });
      return remaining;
    });
  }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <Header />

      {/* Tab bar */}
      <div style={{ display: "flex", alignItems: "center", gap: 3, padding: "5px 10px", background: "var(--bg-app)", borderBottom: "1px solid var(--border)", overflowX: "auto", flexShrink: 0 }}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <div key={tab.id} onClick={() => setActiveTab(tab.id)}
              style={{ display: "flex", alignItems: "center", gap: 5, padding: "4px 9px", borderRadius: 6, cursor: "pointer", fontSize: 11, fontWeight: isActive ? 500 : 400, flexShrink: 0, background: isActive ? "var(--bg-active)" : "transparent", color: isActive ? "var(--accent-text)" : "var(--text-3)", border: isActive ? "1px solid var(--border-accent)" : "1px solid transparent", transition: "background 0.12s, color 0.12s" }}
              onMouseEnter={(e) => { if (!isActive) (e.currentTarget as HTMLDivElement).style.color = "var(--text-2)"; }}
              onMouseLeave={(e) => { if (!isActive) (e.currentTarget as HTMLDivElement).style.color = "var(--text-3)"; }}
            >
              <TerminalIcon size={10} />
              <span>{tab.title}</span>
              <button onClick={(e) => { e.stopPropagation(); closeTab(tab.id); }}
                style={{ marginLeft: 1, background: "transparent", border: "none", color: "inherit", cursor: "pointer", padding: 0, display: "flex", alignItems: "center", opacity: 0.5 }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "#f43f5e"; (e.currentTarget as HTMLButtonElement).style.opacity = "1"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "inherit"; (e.currentTarget as HTMLButtonElement).style.opacity = "0.5"; }}
              ><X size={9} /></button>
            </div>
          );
        })}

        {/* New tab — opens a session for the currently selected distro */}
        <button
          onClick={() => selectedDistro && openTab(selectedDistro)}
          disabled={!selectedDistro}
          title={selectedDistro ? `New ${selectedDistro} terminal` : "Select a distro on the Distro Manager first"}
          style={{ display: "flex", alignItems: "center", gap: 3, marginLeft: 2, padding: "4px 9px", borderRadius: 6, cursor: selectedDistro ? "pointer" : "not-allowed", fontSize: 11, fontWeight: 500, fontFamily: "inherit", background: "transparent", color: "var(--text-3)", border: "1px solid transparent", opacity: selectedDistro ? 1 : 0.45, transition: "background 0.12s, color 0.12s" }}
          onMouseEnter={(e) => { if (selectedDistro) (e.currentTarget as HTMLButtonElement).style.color = "var(--text-2)"; }}
          onMouseLeave={(e) => { if (selectedDistro) (e.currentTarget as HTMLButtonElement).style.color = "var(--text-3)"; }}
        >
          <Plus size={10} /><span>New{selectedDistro ? ` · ${selectedDistro}` : ""}</span>
        </button>

        {/* Font size */}
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 5 }}>
          <span style={{ fontSize: 10, color: "var(--text-3)" }}>Size</span>
          <input type="number" min={9} max={20} value={fontSize} onChange={(e) => setFontSize(Number(e.target.value))}
            style={{ width: 38, padding: "2px 5px", borderRadius: 5, background: "var(--bg-surface)", border: "1px solid var(--border)", color: "var(--text-2)", fontSize: 10, fontFamily: "inherit", outline: "none" }} />
        </div>
      </div>

      {/* Terminal area */}
      {tabs.length === 0 ? (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14, background: "var(--bg-app)" }}>
          <TerminalIcon size={28} style={{ color: "var(--text-4)" }} />
          {selectedDistro ? (
            <>
              <p style={{ fontSize: 12, color: "var(--text-3)", margin: 0 }}>Open a terminal session for the selected distro</p>
              <button onClick={() => openTab(selectedDistro)}
                style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 12px", borderRadius: 7, cursor: "pointer", fontSize: 11, fontWeight: 500, fontFamily: "inherit", background: "var(--accent-dim)", color: "var(--accent-text)", border: "1px solid var(--border-accent)", transition: "background 0.12s" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "var(--accent-glow)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "var(--accent-dim)"; }}
              ><TerminalIcon size={10} />Open {selectedDistro}</button>
            </>
          ) : (
            <p style={{ fontSize: 12, color: "var(--text-3)", margin: 0 }}>Select a distro on the Distro Manager to open a terminal.</p>
          )}
        </div>
      ) : (
        // All tab containers are kept mounted; only the active one is visible
        <div style={{ flex: 1, position: "relative", overflow: "hidden", background: "var(--bg-app)" }}>
          {tabs.map((tab) => (
            <div key={tab.id}
              style={{ position: "absolute", inset: 0, display: activeTab === tab.id ? "flex" : "none", flexDirection: "column" }}
            >
              <div
                ref={(el) => handleContainerRef(tab.id, tab.distroName, el)}
                style={{ flex: 1, overflow: "hidden", padding: "6px 4px 4px 8px" }}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
