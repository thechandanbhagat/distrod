// @group APIEndpoints : Network Info page — WSL IPs and port forwarding
import { useState, useCallback, useRef, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Plus, Trash2, Wifi, AlertCircle, CheckCircle } from "lucide-react";
import { Header } from "../components/layout/Header";
import { useDistroStore } from "../store/distroStore";
import { usePolling } from "../hooks/usePolling";
import type { NetworkInfo, PortForwardRule } from "../types";

// @group BusinessLogic : NetworkPage component
export function NetworkPage() {
  const { selectedDistro } = useDistroStore();
  const [networkInfo, setNetworkInfo] = useState<NetworkInfo | null>(null);
  const [portRules, setPortRules] = useState<PortForwardRule[]>([]);
  const [loading, setLoading] = useState(false);
  const [pingResult, setPingResult] = useState<boolean | null>(null);
  const [showAddRule, setShowAddRule] = useState(false);
  const [newRule, setNewRule] = useState<PortForwardRule>({ listenAddress: "0.0.0.0", listenPort: 8080, connectAddress: "", connectPort: 8080 });
  const prevDistro = useRef<string | null>(null);

  // @group BusinessLogic : Clear stale data when distro changes
  useEffect(() => {
    if (prevDistro.current !== selectedDistro) {
      prevDistro.current = selectedDistro;
      setNetworkInfo(null);
      setPortRules([]);
    }
  }, [selectedDistro]);

  const fetchData = useCallback(async () => {
    if (!selectedDistro) return;
    setLoading(true);
    try {
      const info = await invoke<NetworkInfo>("get_network_info", { distroName: selectedDistro });
      setNetworkInfo(info);
      setNewRule((r) => ({ ...r, connectAddress: info.ipAddress }));
    } catch {}
    try {
      const rules = await invoke<PortForwardRule[]>("list_port_forwards");
      setPortRules(rules);
    } catch {}
    setLoading(false);
  }, [selectedDistro]);

  usePolling(fetchData, 10000, !!selectedDistro);

  const handlePing = async () => {
    if (!networkInfo) return;
    try { const ok = await invoke<boolean>("ping_wsl", { ip: networkInfo.ipAddress }); setPingResult(ok); setTimeout(() => setPingResult(null), 3000); }
    catch { setPingResult(false); }
  };

  const handleAddRule = async () => {
    try { await invoke("add_port_forward", { rule: newRule }); await fetchData(); setShowAddRule(false); }
    catch (err) { console.error(err); }
  };

  const handleRemoveRule = async (rule: PortForwardRule) => {
    try { await invoke("remove_port_forward", { listenAddress: rule.listenAddress, listenPort: rule.listenPort }); await fetchData(); } catch {}
  };

  const isInitialLoad = loading && networkInfo === null;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <Header onRefresh={fetchData} />
      <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px", display: "flex", flexDirection: "column", gap: 14 }}>
        {!selectedDistro ? (
          <div className="empty-state"><p style={{ fontSize: 12, margin: 0 }}>Select a distro from the Distros page.</p></div>
        ) : (
          <>
            {/* Network info card */}
            <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: 10, padding: 16, position: "relative" }}>
              {loading && !isInitialLoad && <div className="load-bar" />}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-2)" }}>Network Info — {selectedDistro}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  {pingResult !== null && (
                    <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: pingResult ? "#34d399" : "#f87171" }}>
                      {pingResult ? <CheckCircle size={11} /> : <AlertCircle size={11} />}
                      {pingResult ? "Reachable" : "Unreachable"}
                    </span>
                  )}
                  <button onClick={handlePing} disabled={!networkInfo}
                    style={{ display: "flex", alignItems: "center", gap: 4, padding: "4px 10px", borderRadius: 7, background: "var(--accent-dim)", color: "var(--accent-text)", border: "1px solid var(--border-accent)", fontSize: 11, fontFamily: "inherit", cursor: networkInfo ? "pointer" : "default", opacity: networkInfo ? 1 : 0.4, transition: "background 0.12s" }}
                    onMouseEnter={(e) => { if (networkInfo) (e.currentTarget as HTMLButtonElement).style.background = "var(--accent-glow)"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "var(--accent-dim)"; }}
                  ><Wifi size={11} /> Ping</button>
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                {isInitialLoad ? (
                  <>
                    <SkeletonInfoRow />
                    <SkeletonInfoRow />
                  </>
                ) : (
                  <>
                    <InfoRow label="IP Address" value={networkInfo?.ipAddress ?? "–"} />
                    <InfoRow label="Gateway" value={networkInfo?.gateway ?? "–"} />
                  </>
                )}
              </div>
            </div>

            {/* Port forwarding */}
            <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: 10, padding: 16 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-2)" }}>Port Forwarding Rules</div>
                <button onClick={() => setShowAddRule(true)}
                  style={{ display: "flex", alignItems: "center", gap: 4, padding: "4px 10px", borderRadius: 7, background: "rgba(16,185,129,0.08)", color: "#34d399", border: "1px solid rgba(16,185,129,0.22)", fontSize: 11, fontFamily: "inherit", cursor: "pointer", transition: "background 0.12s" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(16,185,129,0.14)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(16,185,129,0.08)"; }}
                ><Plus size={11} /> Add Rule</button>
              </div>
              {isInitialLoad ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {[1, 2].map((i) => <span key={i} className="skel" style={{ height: 32, borderRadius: 6 }} />)}
                </div>
              ) : portRules.length === 0 ? (
                <p style={{ fontSize: 12, color: "var(--text-3)", textAlign: "center", padding: "20px 0", margin: 0 }}>No port forwarding rules active.</p>
              ) : (
                <table className="data-table" style={{ width: "100%" }}>
                  <thead><tr><th>Listen</th><th>Connect</th><th style={{ width: 40 }} /></tr></thead>
                  <tbody>
                    {portRules.map((rule, i) => (
                      <tr key={i}>
                        <td style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11 }}>{rule.listenAddress}:{rule.listenPort}</td>
                        <td style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11 }}>{rule.connectAddress}:{rule.connectPort}</td>
                        <td style={{ padding: "7px 10px" }}>
                          <button onClick={() => handleRemoveRule(rule)} title="Remove"
                            style={{ width: 22, height: 22, borderRadius: 5, display: "flex", alignItems: "center", justifyContent: "center", background: "transparent", border: "1px solid transparent", color: "var(--text-3)", cursor: "pointer", transition: "all 0.12s" }}
                            onMouseEnter={(e) => { const b = e.currentTarget as HTMLButtonElement; b.style.background = "rgba(244,63,94,0.10)"; b.style.color = "#f43f5e"; b.style.borderColor = "rgba(244,63,94,0.22)"; }}
                            onMouseLeave={(e) => { const b = e.currentTarget as HTMLButtonElement; b.style.background = "transparent"; b.style.color = "var(--text-3)"; b.style.borderColor = "transparent"; }}
                          ><Trash2 size={11} /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </>
        )}
      </div>

      {showAddRule && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, backdropFilter: "blur(4px)" }}>
          <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-hover)", borderRadius: 14, padding: 22, width: "100%", maxWidth: 400, boxShadow: "0 24px 64px rgba(0,0,0,0.6)" }}>
            <h2 style={{ margin: "0 0 16px", fontSize: 13, fontWeight: 600, color: "var(--text-1)" }}>Add Port Forwarding Rule</h2>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <DField label="Listen Address" value={newRule.listenAddress} onChange={(v) => setNewRule({ ...newRule, listenAddress: v })} />
              <DField label="Listen Port" value={String(newRule.listenPort)} onChange={(v) => setNewRule({ ...newRule, listenPort: Number(v) })} type="number" />
              <DField label="Connect Address" value={newRule.connectAddress} onChange={(v) => setNewRule({ ...newRule, connectAddress: v })} />
              <DField label="Connect Port" value={String(newRule.connectPort)} onChange={(v) => setNewRule({ ...newRule, connectPort: Number(v) })} type="number" />
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 7, marginTop: 18 }}>
              <button onClick={() => setShowAddRule(false)} className="btn-ghost">Cancel</button>
              <button onClick={handleAddRule} className="btn-primary">Add Rule</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// @group Utilities : Skeleton info row
function SkeletonInfoRow() {
  return (
    <div>
      <span className="skel" style={{ display: "block", width: 56, height: 10, marginBottom: 6 }} />
      <span className="skel" style={{ display: "block", width: 110, height: 14 }} />
    </div>
  );
}

// @group Utilities : Info label/value row
function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{ fontSize: 10, color: "var(--text-3)", marginBottom: 3 }}>{label}</div>
      <div style={{ fontSize: 12, fontFamily: "'JetBrains Mono', monospace", color: "var(--text-1)" }}>{value}</div>
    </div>
  );
}

// @group Utilities : Dialog text field
function DField({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <div>
      <label style={{ fontSize: 10, color: "var(--text-3)", display: "block", marginBottom: 4 }}>{label}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} className="field" />
    </div>
  );
}
