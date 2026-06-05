// @group APIEndpoints : Nginx management page — status, control, and config viewer
import { useState, useCallback, useEffect, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Play, Square, RotateCcw, RefreshCw, Globe, ChevronDown, ChevronRight, CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import { Header } from "../components/layout/Header";
import { useDistroStore } from "../store/distroStore";
import type { NginxInfo } from "../types";

// @group BusinessLogic : NginxPage component
export function NginxPage() {
  const { selectedDistro } = useDistroStore();
  const [info, setInfo] = useState<NginxInfo | null>(null);
  const [config, setConfig] = useState<string | null>(null);
  const [loadingInfo, setLoadingInfo] = useState(false);
  const [loadingConfig, setLoadingConfig] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionResult, setActionResult] = useState<{ ok: boolean; msg: string } | null>(null);
  const [configOpen, setConfigOpen] = useState(false);
  const [testOpen, setTestOpen] = useState(false);
  const resultTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // @group BusinessLogic : Clear stale data on distro change
  const prevDistro = useRef<string | null>(null);
  useEffect(() => {
    if (prevDistro.current !== selectedDistro) {
      prevDistro.current = selectedDistro;
      setInfo(null);
      setConfig(null);
      setConfigOpen(false);
      setTestOpen(false);
      setActionResult(null);
    }
  }, [selectedDistro]);

  const fetchInfo = useCallback(async () => {
    if (!selectedDistro) return;
    setLoadingInfo(true);
    try {
      const result = await invoke<NginxInfo>("get_nginx_info", { distroName: selectedDistro });
      setInfo(result);
    } catch (err) {
      console.error("get_nginx_info failed:", err);
    } finally {
      setLoadingInfo(false);
    }
  }, [selectedDistro]);

  const fetchConfig = useCallback(async () => {
    if (!selectedDistro) return;
    setLoadingConfig(true);
    try {
      const text = await invoke<string>("get_nginx_config", { distroName: selectedDistro });
      setConfig(text);
    } catch (err) {
      setConfig(`Error: ${String(err)}`);
    } finally {
      setLoadingConfig(false);
    }
  }, [selectedDistro]);

  useEffect(() => { if (selectedDistro) fetchInfo(); }, [selectedDistro, fetchInfo]);
  useEffect(() => { if (configOpen && config === null) fetchConfig(); }, [configOpen, config, fetchConfig]);

  const showResult = (ok: boolean, msg: string) => {
    setActionResult({ ok, msg });
    if (resultTimer.current) clearTimeout(resultTimer.current);
    resultTimer.current = setTimeout(() => setActionResult(null), 4000);
  };

  const handleAction = async (action: "start" | "stop" | "restart" | "reload") => {
    if (!selectedDistro) return;
    setActionLoading(action);
    try {
      const msg = await invoke<string>("control_nginx", { distroName: selectedDistro, action });
      showResult(true, msg || `nginx ${action} succeeded`);
      await fetchInfo();
    } catch (err) {
      showResult(false, String(err));
    } finally {
      setActionLoading(null);
    }
  };

  const isInitialLoad = loadingInfo && info === null;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <Header onRefresh={fetchInfo} />
      <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px", display: "flex", flexDirection: "column", gap: 14 }}>
        {!selectedDistro ? (
          <div className="empty-state">
            <Globe size={24} />
            <p style={{ fontSize: 12, margin: 0 }}>Select a distro to manage nginx.</p>
          </div>
        ) : (
          <>
            {/* Action result banner */}
            {actionResult && (
              <div style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "9px 14px", borderRadius: 8, fontSize: 11,
                background: actionResult.ok ? "rgba(16,185,129,0.07)" : "rgba(244,63,94,0.07)",
                border: `1px solid ${actionResult.ok ? "rgba(16,185,129,0.22)" : "rgba(244,63,94,0.22)"}`,
                color: actionResult.ok ? "#34d399" : "#f87171",
              }}>
                {actionResult.ok
                  ? <CheckCircle size={12} style={{ flexShrink: 0 }} />
                  : <XCircle size={12} style={{ flexShrink: 0 }} />}
                <span style={{ fontFamily: "'JetBrains Mono', monospace", whiteSpace: "pre-wrap", wordBreak: "break-all" }}>
                  {actionResult.msg}
                </span>
              </div>
            )}

            {/* Config test output (collapsible) */}
            {info?.installed && info.configTestOutput && (
              <Collapsible
                open={testOpen}
                onToggle={() => setTestOpen((o) => !o)}
                label="Config Test Output"
                badge={info.configOk
                  ? { text: "OK", color: "#10b981" }
                  : { text: "Error", color: "#f43f5e" }}
              >
                <pre style={{
                  margin: 0, padding: "12px 14px", fontSize: 11,
                  fontFamily: "'JetBrains Mono', 'Cascadia Code', monospace",
                  color: info.configOk ? "#34d399" : "#f87171",
                  overflowX: "auto", lineHeight: 1.6, whiteSpace: "pre-wrap", wordBreak: "break-word",
                }}>
                  {info.configTestOutput}
                </pre>
              </Collapsible>
            )}

            {/* nginx.conf viewer (collapsible) */}
            {info?.installed && (
              <Collapsible
                open={configOpen}
                onToggle={() => setConfigOpen((o) => !o)}
                label="nginx.conf"
                badge={{ text: "/etc/nginx/nginx.conf", color: "var(--text-3)" }}
              >
                {loadingConfig ? (
                  <div style={{ padding: "14px", display: "flex", flexDirection: "column", gap: 6 }}>
                    {Array.from({ length: 8 }).map((_, i) => (
                      <span key={i} className="skel" style={{ height: 11, width: `${40 + (i % 6) * 10}%` }} />
                    ))}
                  </div>
                ) : config ? (
                  <pre style={{
                    margin: 0, padding: "12px 14px", fontSize: 11,
                    fontFamily: "'JetBrains Mono', 'Cascadia Code', monospace",
                    color: "var(--text-2)", lineHeight: 1.65,
                    overflowX: "auto", whiteSpace: "pre", wordBreak: "normal",
                    maxHeight: 480, overflowY: "auto",
                  }}>
                    {config}
                  </pre>
                ) : null}
              </Collapsible>
            )}

            {/* Status card */}
            <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: 10, padding: 16, position: "relative" }}>
              {loadingInfo && !isInitialLoad && <div className="load-bar" />}

              {isInitialLoad ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                    <span className="skel" style={{ width: 32, height: 32, borderRadius: 8 }} />
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      <span className="skel" style={{ width: 80, height: 13 }} />
                      <span className="skel" style={{ width: 120, height: 10 }} />
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 6 }}>
                    {[1, 2, 3, 4].map((i) => <span key={i} className="skel" style={{ width: 64, height: 28, borderRadius: 7 }} />)}
                  </div>
                </div>
              ) : !info?.installed ? (
                <NginxNotInstalled />
              ) : (
                <>
                  {/* Header row */}
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: 9, flexShrink: 0,
                      background: info.running ? "rgba(16,185,129,0.12)" : "rgba(255,255,255,0.04)",
                      border: `1px solid ${info.running ? "rgba(16,185,129,0.28)" : "var(--border)"}`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      <Globe size={16} style={{ color: info.running ? "#10b981" : "var(--text-3)" }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-1)" }}>nginx</span>
                        <span style={{
                          display: "inline-flex", alignItems: "center", gap: 4,
                          padding: "2px 8px", borderRadius: 99, fontSize: 10, fontWeight: 500,
                          background: info.running ? "rgba(16,185,129,0.10)" : "rgba(244,63,94,0.08)",
                          color: info.running ? "#10b981" : "#f87171",
                          border: `1px solid ${info.running ? "rgba(16,185,129,0.22)" : "rgba(244,63,94,0.18)"}`,
                        }}>
                          <span style={{ width: 5, height: 5, borderRadius: "50%", background: "currentColor", display: "inline-block" }} />
                          {info.running ? "Running" : "Stopped"}
                        </span>
                        {info.configOk !== null && (
                          <span style={{
                            display: "inline-flex", alignItems: "center", gap: 4,
                            padding: "2px 8px", borderRadius: 99, fontSize: 10,
                            background: info.configOk ? "rgba(16,185,129,0.07)" : "rgba(244,63,94,0.07)",
                            color: info.configOk ? "#34d399" : "#f87171",
                            border: `1px solid ${info.configOk ? "rgba(16,185,129,0.18)" : "rgba(244,63,94,0.18)"}`,
                          }}>
                            {info.configOk ? <CheckCircle size={9} /> : <XCircle size={9} />}
                            Config {info.configOk ? "OK" : "Error"}
                          </span>
                        )}
                      </div>
                      {info.version && (
                        <div style={{ fontSize: 10, color: "var(--text-3)", fontFamily: "'JetBrains Mono', monospace" }}>
                          {info.version}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Control buttons */}
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {!info.running && (
                      <CtrlBtn loading={actionLoading === "start"} onClick={() => handleAction("start")} color="#10b981">
                        <Play size={10} /> Start
                      </CtrlBtn>
                    )}
                    {info.running && (
                      <CtrlBtn loading={actionLoading === "stop"} onClick={() => handleAction("stop")} color="#f43f5e">
                        <Square size={10} /> Stop
                      </CtrlBtn>
                    )}
                    <CtrlBtn loading={actionLoading === "restart"} onClick={() => handleAction("restart")} color="var(--text-2)">
                      <RotateCcw size={10} /> Restart
                    </CtrlBtn>
                    {info.running && (
                      <CtrlBtn loading={actionLoading === "reload"} onClick={() => handleAction("reload")} color="var(--accent-text)">
                        <RefreshCw size={10} /> Reload
                      </CtrlBtn>
                    )}
                  </div>
                </>
              )}
            </div>

          </>
        )}
      </div>
    </div>
  );
}

// @group Utilities : Nginx not installed placeholder
function NginxNotInstalled() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <div style={{ width: 36, height: 36, borderRadius: 9, background: "var(--bg-hover)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <AlertTriangle size={16} style={{ color: "var(--text-3)" }} />
      </div>
      <div>
        <div style={{ fontSize: 13, fontWeight: 500, color: "var(--text-2)", marginBottom: 3 }}>nginx not installed</div>
        <div style={{ fontSize: 11, color: "var(--text-3)" }}>
          Install it with:{" "}
          <code style={{ fontFamily: "'JetBrains Mono', monospace", background: "var(--bg-hover)", padding: "1px 5px", borderRadius: 4 }}>
            sudo apt install nginx
          </code>
        </div>
      </div>
    </div>
  );
}

// @group Utilities : Control action button
function CtrlBtn({
  loading, onClick, color, children,
}: {
  loading: boolean; onClick: () => void; color: string; children: React.ReactNode;
}) {
  const [h, setH] = useState(false);
  return (
    <button
      onClick={onClick}
      disabled={loading}
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      style={{
        display: "inline-flex", alignItems: "center", gap: 5,
        padding: "5px 12px", borderRadius: 7, border: "1px solid",
        fontSize: 11, fontFamily: "inherit", fontWeight: 500, cursor: loading ? "default" : "pointer",
        opacity: loading ? 0.5 : 1,
        background: h ? `${color}18` : `${color}0d`,
        color,
        borderColor: h ? `${color}40` : `${color}25`,
        transition: "background 0.12s, border-color 0.12s",
      }}
    >
      {children}
    </button>
  );
}

// @group Utilities : Collapsible section wrapper
function Collapsible({
  open, onToggle, label, badge, children,
}: {
  open: boolean;
  onToggle: () => void;
  label: string;
  badge?: { text: string; color: string };
  children: React.ReactNode;
}) {
  return (
    <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: 10, overflow: "hidden" }}>
      <button
        onClick={onToggle}
        style={{
          width: "100%", display: "flex", alignItems: "center", gap: 8,
          padding: "11px 14px", background: "transparent", border: "none",
          cursor: "pointer", textAlign: "left", color: "var(--text-2)",
          borderBottom: open ? "1px solid var(--border)" : "none",
          transition: "background 0.12s",
        }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "var(--bg-hover)"; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
      >
        {open ? <ChevronDown size={12} style={{ color: "var(--text-3)", flexShrink: 0 }} /> : <ChevronRight size={12} style={{ color: "var(--text-3)", flexShrink: 0 }} />}
        <span style={{ fontSize: 11, fontWeight: 600 }}>{label}</span>
        {badge && (
          <span style={{ marginLeft: "auto", fontSize: 10, color: badge.color, fontFamily: "'JetBrains Mono', monospace" }}>
            {badge.text}
          </span>
        )}
      </button>
      {open && children}
    </div>
  );
}
