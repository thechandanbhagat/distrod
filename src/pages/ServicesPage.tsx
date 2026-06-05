// @group APIEndpoints : Services page — systemd service list and control
import { useState, useCallback, useEffect, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Search, Play, Square, RotateCcw, Layers, AlertTriangle } from "lucide-react";
import { Header } from "../components/layout/Header";
import { useDistroStore } from "../store/distroStore";
import { usePolling } from "../hooks/usePolling";
import type { ServiceInfo } from "../types";

// @group Types : Status filter tab values
type StatusFilter = "all" | "active" | "failed" | "inactive";

// @group BusinessLogic : ServicesPage component
export function ServicesPage() {
  const { selectedDistro } = useDistroStore();
  const [services, setServices] = useState<ServiceInfo[]>([]);
  const [filterText, setFilterText] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busyServices, setBusyServices] = useState<Set<string>>(new Set());

  // @group BusinessLogic : Clear stale data when distro changes
  const prevDistro = useRef<string | null>(null);
  useEffect(() => {
    if (prevDistro.current !== selectedDistro) {
      prevDistro.current = selectedDistro;
      setServices([]);
      setError(null);
    }
  }, [selectedDistro]);

  const fetchServices = useCallback(async () => {
    if (!selectedDistro) return;
    setLoading(true);
    try {
      const result = await invoke<ServiceInfo[]>("list_services", { distroName: selectedDistro });
      setServices(result);
      setError(null);
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }, [selectedDistro]);

  usePolling(fetchServices, 5000, !!selectedDistro);

  const handleAction = async (service: string, action: "start" | "stop" | "restart") => {
    if (!selectedDistro) return;
    setBusyServices((s) => new Set(s).add(service));
    try {
      await invoke("control_service", { distroName: selectedDistro, service, action });
      await fetchServices();
    } catch (err) {
      console.error(`${action} ${service} failed:`, err);
    } finally {
      setBusyServices((s) => { const n = new Set(s); n.delete(service); return n; });
    }
  };

  const isInitialLoad = loading && services.length === 0;

  const visible = services.filter((s) => {
    const matchesText =
      !filterText ||
      s.name.toLowerCase().includes(filterText.toLowerCase()) ||
      s.description.toLowerCase().includes(filterText.toLowerCase());
    const matchesStatus =
      statusFilter === "all" ||
      s.active === statusFilter ||
      (statusFilter === "inactive" && s.active !== "active" && s.active !== "failed");
    return matchesText && matchesStatus;
  });

  const counts = {
    active: services.filter((s) => s.active === "active").length,
    failed: services.filter((s) => s.active === "failed").length,
    inactive: services.filter((s) => s.active !== "active" && s.active !== "failed").length,
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <Header onRefresh={fetchServices} />
      <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column", padding: "16px 20px", gap: 12 }}>
        {!selectedDistro ? (
          <div className="empty-state">
            <Layers size={24} />
            <p style={{ fontSize: 12, margin: 0 }}>Select a distro to view services.</p>
          </div>
        ) : (
          <>
            {error && !isInitialLoad && (
              <div style={{ display: "flex", alignItems: "flex-start", gap: 8, padding: "10px 14px", borderRadius: 8, background: "rgba(244,63,94,0.07)", border: "1px solid rgba(244,63,94,0.22)", color: "#f87171", fontSize: 11 }}>
                <AlertTriangle size={13} style={{ flexShrink: 0, marginTop: 1 }} />
                <span>{error}</span>
              </div>
            )}

            {/* Toolbar */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <div style={{ position: "relative", flex: 1, minWidth: 160 }}>
                <Search size={11} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--text-3)", pointerEvents: "none" }} />
                <input
                  value={filterText}
                  onChange={(e) => setFilterText(e.target.value)}
                  placeholder="Filter services…"
                  className="field"
                  style={{ paddingLeft: 30, fontSize: 12 }}
                />
              </div>

              <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                {(["all", "active", "failed", "inactive"] as StatusFilter[]).map((f) => {
                  const count = f === "all" ? services.length : counts[f as keyof typeof counts];
                  const active = statusFilter === f;
                  const color = f === "failed" ? "#f43f5e" : f === "active" ? "#10b981" : "var(--text-3)";
                  return (
                    <button key={f} onClick={() => setStatusFilter(f)}
                      style={{
                        display: "flex", alignItems: "center", gap: 5,
                        padding: "4px 10px", borderRadius: 6, border: "none", cursor: "pointer",
                        fontSize: 11, fontFamily: "inherit", fontWeight: active ? 500 : 400,
                        background: active ? "var(--bg-active)" : "transparent",
                        color: active ? "var(--accent-text)" : "var(--text-3)",
                        transition: "background 0.12s, color 0.12s",
                      }}
                    >
                      {f !== "all" && (
                        <span style={{ width: 5, height: 5, borderRadius: "50%", background: active ? color : "var(--text-4)", display: "inline-block" }} />
                      )}
                      {f.charAt(0).toUpperCase() + f.slice(1)}
                      {!isInitialLoad && (
                        <span style={{ fontSize: 10, color: active ? "var(--accent-text)" : "var(--text-4)", fontWeight: 400 }}>
                          {count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Table */}
            <div style={{ flex: 1, overflow: "auto", background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: 10, position: "relative" }}>
              {loading && !isInitialLoad && <div className="load-bar" />}

              <table className="data-table" style={{ width: "100%" }}>
                <thead>
                  <tr>
                    <th>Service</th>
                    <th>State</th>
                    <th>Sub</th>
                    <th>Description</th>
                    <th style={{ width: 80 }} />
                  </tr>
                </thead>
                <tbody>
                  {/* Skeleton rows */}
                  {isInitialLoad && Array.from({ length: 12 }).map((_, i) => (
                    <tr key={i}>
                      <td><span className="skel" style={{ display: "block", width: `${60 + (i % 5) * 18}px`, height: 11 }} /></td>
                      <td><span className="skel" style={{ display: "block", width: 48, height: 11 }} /></td>
                      <td><span className="skel" style={{ display: "block", width: 40, height: 11 }} /></td>
                      <td><span className="skel" style={{ display: "block", width: `${80 + (i % 4) * 30}px`, height: 11 }} /></td>
                      <td />
                    </tr>
                  ))}

                  {/* Real rows */}
                  {!isInitialLoad && visible.map((svc) => {
                    const isBusy = busyServices.has(svc.name);
                    const isActive = svc.active === "active";
                    return (
                      <tr key={svc.name} style={{ opacity: isBusy ? 0.5 : 1, transition: "opacity 0.15s" }}>
                        <td style={{ fontWeight: 500, color: "var(--text-1)", fontSize: 12 }}>{svc.name}</td>
                        <td>
                          <ServiceBadge active={svc.active} />
                        </td>
                        <td style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "var(--text-3)" }}>{svc.sub}</td>
                        <td style={{ fontSize: 11, color: "var(--text-2)", maxWidth: 280, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{svc.description}</td>
                        <td style={{ padding: "6px 10px" }}>
                          <div style={{ display: "flex", gap: 4, justifyContent: "flex-end" }}>
                            {!isActive && (
                              <ActionBtn onClick={() => handleAction(svc.name, "start")} disabled={isBusy} title="Start" color="#10b981">
                                <Play size={10} />
                              </ActionBtn>
                            )}
                            {isActive && (
                              <ActionBtn onClick={() => handleAction(svc.name, "stop")} disabled={isBusy} title="Stop" color="#f43f5e">
                                <Square size={10} />
                              </ActionBtn>
                            )}
                            <ActionBtn onClick={() => handleAction(svc.name, "restart")} disabled={isBusy} title="Restart" color="var(--text-3)">
                              <RotateCcw size={10} />
                            </ActionBtn>
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                  {!isInitialLoad && visible.length === 0 && !error && (
                    <tr>
                      <td colSpan={5} style={{ padding: "36px 14px", textAlign: "center", color: "var(--text-3)", fontSize: 12 }}>
                        {filterText || statusFilter !== "all" ? "No services match your filter." : "No services found."}
                      </td>
                    </tr>
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

// @group Utilities : Coloured active-state badge
function ServiceBadge({ active }: { active: string }) {
  const color =
    active === "active" ? "#10b981" :
    active === "failed" ? "#f43f5e" :
    active === "activating" || active === "deactivating" ? "#f59e0b" :
    "var(--text-4)";

  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, color }}>
      <span style={{ width: 5, height: 5, borderRadius: "50%", background: color, display: "inline-block", boxShadow: active === "active" ? `0 0 5px ${color}80` : "none" }} />
      {active}
    </span>
  );
}

// @group Utilities : Small icon action button
function ActionBtn({
  onClick, disabled, title, color, children,
}: {
  onClick: () => void; disabled: boolean; title: string; color: string; children: React.ReactNode;
}) {
  const [h, setH] = useState(false);
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      style={{
        width: 22, height: 22, borderRadius: 5, border: "1px solid transparent",
        display: "flex", alignItems: "center", justifyContent: "center",
        background: h ? `${color}18` : "transparent",
        color: h ? color : "var(--text-3)",
        borderColor: h ? `${color}30` : "transparent",
        cursor: disabled ? "default" : "pointer",
        transition: "all 0.12s",
      }}
    >
      {children}
    </button>
  );
}
