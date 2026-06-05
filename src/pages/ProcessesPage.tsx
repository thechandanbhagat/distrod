// @group APIEndpoints : Process Manager page — list and kill Linux processes
import { useCallback, useEffect, useRef } from "react";
import { Search, Skull, ChevronUp, ChevronDown, Cpu } from "lucide-react";
import { invoke } from "@tauri-apps/api/core";
import { Header } from "../components/layout/Header";
import { useDistroStore } from "../store/distroStore";
import { useProcessStore } from "../store/processStore";
import { usePolling } from "../hooks/usePolling";
import type { LinuxProcess } from "../types";

// @group BusinessLogic : ProcessesPage component
export function ProcessesPage() {
  const { selectedDistro } = useDistroStore();
  const { processes, filterText, sortKey, sortAsc, loading, setProcesses, clearProcesses, setFilter, setSort, setLoading } = useProcessStore();

  // @group BusinessLogic : Clear stale data when distro changes
  const prevDistro = useRef<string | null>(null);
  useEffect(() => {
    if (prevDistro.current !== selectedDistro) {
      prevDistro.current = selectedDistro;
      clearProcesses();
    }
  }, [selectedDistro, clearProcesses]);

  const fetchProcesses = useCallback(async () => {
    if (!selectedDistro) return;
    setLoading(true);
    try {
      const result = await invoke<LinuxProcess[]>("list_processes", { distroName: selectedDistro });
      setProcesses(result);
    } finally {
      setLoading(false);
    }
  }, [selectedDistro, setProcesses, setLoading]);

  usePolling(fetchProcesses, 3000, !!selectedDistro);

  const killProcess = async (pid: number) => {
    if (!selectedDistro) return;
    try { await invoke("kill_process", { distroName: selectedDistro, pid }); await fetchProcesses(); }
    catch (err) { console.error("Kill failed:", err); }
  };

  const visible = processes
    .filter((p) => !filterText || p.name.toLowerCase().includes(filterText.toLowerCase()) || p.command.toLowerCase().includes(filterText.toLowerCase()) || p.user.toLowerCase().includes(filterText.toLowerCase()))
    .sort((a, b) => {
      const av = a[sortKey], bv = b[sortKey];
      const cmp = typeof av === "number" && typeof bv === "number" ? av - bv : String(av).localeCompare(String(bv));
      return sortAsc ? cmp : -cmp;
    });

  const ColHeader = ({ col, label }: { col: keyof LinuxProcess; label: string }) => (
    <th onClick={() => setSort(col)} style={{ cursor: "pointer", userSelect: "none", padding: "8px 14px", textAlign: "left", fontSize: 10, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--text-3)", borderBottom: "1px solid var(--border)", whiteSpace: "nowrap" }}>
      <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}>
        {label}
        {sortKey === col ? sortAsc ? <ChevronUp size={10} style={{ color: "var(--accent-text)" }} /> : <ChevronDown size={10} style={{ color: "var(--accent-text)" }} /> : <ChevronDown size={10} style={{ opacity: 0.2 }} />}
      </span>
    </th>
  );

  // @group BusinessLogic : Skeleton rows for initial load
  const isInitialLoad = loading && processes.length === 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <Header onRefresh={fetchProcesses} />
      <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column", padding: "16px 20px", gap: 12 }}>
        {!selectedDistro ? (
          <div className="empty-state"><Cpu size={24} /><p style={{ fontSize: 12, margin: 0 }}>Select a distro on the Distro Manager to view processes.</p></div>
        ) : (
          <>
            <div style={{ position: "relative" }}>
              <Search size={11} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--text-3)", pointerEvents: "none" }} />
              <input value={filterText} onChange={(e) => setFilter(e.target.value)} placeholder="Filter by name, command or user…" className="field" style={{ paddingLeft: 30, fontSize: 12 }} />
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 11, color: "var(--text-3)" }}>
              {!isInitialLoad && <span><span style={{ color: "var(--text-2)", fontWeight: 500 }}>{visible.length}</span> processes</span>}
            </div>

            <div style={{ flex: 1, overflow: "auto", background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: 10, position: "relative" }}>
              {/* Loading bar — shown during background refreshes */}
              {loading && !isInitialLoad && <div className="load-bar" />}

              <table className="data-table" style={{ width: "100%" }}>
                <thead>
                  <tr>
                    <ColHeader col="pid" label="PID" />
                    <ColHeader col="name" label="Name" />
                    <ColHeader col="cpuPercent" label="CPU %" />
                    <ColHeader col="memPercent" label="MEM %" />
                    <ColHeader col="user" label="User" />
                    <th style={{ padding: "8px 14px", textAlign: "left", fontSize: 10, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--text-3)", borderBottom: "1px solid var(--border)" }}>Command</th>
                    <th style={{ width: 40, borderBottom: "1px solid var(--border)" }} />
                  </tr>
                </thead>
                <tbody>
                  {/* Skeleton rows on initial load */}
                  {isInitialLoad && Array.from({ length: 10 }).map((_, i) => (
                    <tr key={i}>
                      <td><span className="skel" style={{ display: "block", width: 36, height: 11 }} /></td>
                      <td><span className="skel" style={{ display: "block", width: `${60 + (i % 4) * 20}px`, height: 11 }} /></td>
                      <td><span className="skel" style={{ display: "block", width: 32, height: 11 }} /></td>
                      <td><span className="skel" style={{ display: "block", width: 32, height: 11 }} /></td>
                      <td><span className="skel" style={{ display: "block", width: 50, height: 11 }} /></td>
                      <td><span className="skel" style={{ display: "block", width: `${80 + (i % 5) * 30}px`, height: 11 }} /></td>
                      <td />
                    </tr>
                  ))}

                  {/* Real rows */}
                  {!isInitialLoad && visible.map((p) => (
                    <tr key={p.pid}>
                      <td style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "var(--text-3)" }}>{p.pid}</td>
                      <td style={{ fontWeight: 500, color: "var(--text-1)", fontSize: 12 }}>{p.name}</td>
                      <td><span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: p.cpuPercent > 50 ? "#f59e0b" : p.cpuPercent > 25 ? "var(--text-2)" : "var(--text-3)" }}>{p.cpuPercent.toFixed(1)}%</span></td>
                      <td><span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: p.memPercent > 50 ? "#f43f5e" : p.memPercent > 25 ? "var(--text-2)" : "var(--text-3)" }}>{p.memPercent.toFixed(1)}%</span></td>
                      <td style={{ fontSize: 11, color: "var(--text-3)" }}>{p.user}</td>
                      <td style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, maxWidth: 260, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "var(--text-2)" }}>{p.command}</td>
                      <td style={{ padding: "7px 10px" }}>
                        <button onClick={() => killProcess(p.pid)} title={`Kill PID ${p.pid}`}
                          style={{ width: 22, height: 22, borderRadius: 5, display: "flex", alignItems: "center", justifyContent: "center", background: "transparent", border: "1px solid transparent", color: "var(--text-3)", cursor: "pointer", transition: "all 0.12s" }}
                          onMouseEnter={(e) => { const b = e.currentTarget as HTMLButtonElement; b.style.background = "rgba(244,63,94,0.10)"; b.style.color = "#f43f5e"; b.style.borderColor = "rgba(244,63,94,0.22)"; }}
                          onMouseLeave={(e) => { const b = e.currentTarget as HTMLButtonElement; b.style.background = "transparent"; b.style.color = "var(--text-3)"; b.style.borderColor = "transparent"; }}
                        ><Skull size={11} /></button>
                      </td>
                    </tr>
                  ))}

                  {!isInitialLoad && visible.length === 0 && (
                    <tr><td colSpan={7} style={{ padding: "36px 14px", textAlign: "center", color: "var(--text-3)", fontSize: 12 }}>{filterText ? "No processes match your filter." : "No processes found."}</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
