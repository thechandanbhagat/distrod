// @group APIEndpoints : Resource Monitor page — real-time CPU/memory/disk charts
import { type ReactNode } from "react";
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from "recharts";
import { AlertTriangle } from "lucide-react";
import { Header } from "../components/layout/Header";
import { useDistroStore } from "../store/distroStore";
import { useResources } from "../hooks/useResources";

// @group Utilities : Format bytes to human-readable string
function fmtBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024, sz = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sz[i]}`;
}

// @group BusinessLogic : ResourcesPage component
export function ResourcesPage() {
  const { selectedDistro } = useDistroStore();
  const { history, latest, thresholds, cpuAlert, memAlert, setThresholds } = useResources(selectedDistro);

  const chartData = history.map((s) => ({
    t: new Date(s.timestamp * 1000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
    cpu: parseFloat(s.cpuPercent.toFixed(1)),
    mem: parseFloat((s.memoryRss / 1024 / 1024).toFixed(0)),
  }));

  const diskPct = latest && latest.diskTotal > 0 ? Math.round((latest.diskUsed / latest.diskTotal) * 100) : 0;
  const hasData = latest !== null;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <Header />
      <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px", display: "flex", flexDirection: "column", gap: 14 }}>
        {!selectedDistro ? (
          <div className="empty-state">
            <AlertTriangle size={24} />
            <p style={{ fontSize: 12, margin: 0 }}>Select a distro on the Distro Manager to view resources.</p>
          </div>
        ) : (
          <>
            {cpuAlert && <AlertBanner color="#f59e0b" msg={`CPU load exceeds ${thresholds.cpuPercent}%`} />}
            {memAlert && <AlertBanner color="#f43f5e" msg={`Memory usage exceeds ${thresholds.memoryPercent}%`} />}

            {/* Stat cards — skeleton until first snapshot */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 }}>
              {hasData ? (
                <>
                  <StatCard label="CPU Load" value={`${latest.cpuPercent.toFixed(1)}%`} alert={cpuAlert} accent="var(--accent)" />
                  <StatCard label="Memory" value={fmtBytes(latest.memoryRss)} sub={`of ${fmtBytes(latest.memoryVsz)}`} alert={memAlert} accent="#22d3ee" />
                  <StatCard label="Disk Used" value={fmtBytes(latest.diskUsed)} sub={`${diskPct}% of ${fmtBytes(latest.diskTotal)}`} accent="#10b981" />
                </>
              ) : (
                <>
                  <SkeletonStatCard />
                  <SkeletonStatCard />
                  <SkeletonStatCard />
                </>
              )}
            </div>

            {/* CPU chart */}
            <ChartCard title="CPU Load %" accent="var(--accent)" loading={!hasData}>
              {hasData && (
                <ResponsiveContainer width="100%" height={140}>
                  <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                    <defs>
                      <linearGradient id="cpuGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.18} />
                        <stop offset="95%" stopColor="var(--accent)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="2 4" stroke="var(--border)" />
                    <XAxis dataKey="t" tick={{ fontSize: 9, fill: "var(--text-3)" }} tickLine={false} axisLine={false} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 9, fill: "var(--text-3)" }} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ background: "var(--bg-card)", border: "1px solid var(--border-hover)", borderRadius: 7, fontSize: 11 }} labelStyle={{ color: "var(--text-3)" }} itemStyle={{ color: "var(--accent-text)" }} />
                    <Area type="monotone" dataKey="cpu" stroke="var(--accent)" strokeWidth={1.5} fill="url(#cpuGrad)" dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </ChartCard>

            {/* Memory chart */}
            <ChartCard title="Memory Usage (MB)" accent="#22d3ee" loading={!hasData}>
              {hasData && (
                <ResponsiveContainer width="100%" height={140}>
                  <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                    <defs>
                      <linearGradient id="memGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="#22d3ee" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="2 4" stroke="var(--border)" />
                    <XAxis dataKey="t" tick={{ fontSize: 9, fill: "var(--text-3)" }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 9, fill: "var(--text-3)" }} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ background: "var(--bg-card)", border: "1px solid var(--border-hover)", borderRadius: 7, fontSize: 11 }} labelStyle={{ color: "var(--text-3)" }} itemStyle={{ color: "#22d3ee" }} />
                    <Area type="monotone" dataKey="mem" stroke="#22d3ee" strokeWidth={1.5} fill="url(#memGrad)" dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </ChartCard>

            {/* Thresholds */}
            <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: 10, padding: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-3)", marginBottom: 12 }}>Alert Thresholds</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <ThresholdField label="CPU % alert" value={thresholds.cpuPercent} onChange={(v) => setThresholds({ ...thresholds, cpuPercent: v })} />
                <ThresholdField label="Memory % alert" value={thresholds.memoryPercent} onChange={(v) => setThresholds({ ...thresholds, memoryPercent: v })} />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// @group Utilities : Skeleton stat card
function SkeletonStatCard() {
  return (
    <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: 10, padding: 14 }}>
      <span className="skel" style={{ display: "block", width: 48, height: 10, marginBottom: 10 }} />
      <span className="skel" style={{ display: "block", width: 72, height: 22 }} />
      <span className="skel" style={{ display: "block", width: 56, height: 9, marginTop: 8 }} />
      <div style={{ marginTop: 8, height: 1.5, borderRadius: 99, background: "var(--border)" }} />
    </div>
  );
}

// @group Utilities : Stat card
function StatCard({ label, value, sub, alert, accent }: { label: string; value: string; sub?: string; alert?: boolean; accent: string }) {
  return (
    <div style={{ background: "var(--bg-surface)", border: `1px solid ${alert ? "rgba(244,63,94,0.25)" : "var(--border)"}`, borderRadius: 10, padding: 14, boxShadow: alert ? "0 0 16px rgba(244,63,94,0.07)" : "none" }}>
      <div style={{ fontSize: 10, color: "var(--text-3)", marginBottom: 5, fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase" }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 700, color: alert ? "#f87171" : "var(--text-1)", fontFamily: "'JetBrains Mono', monospace", lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: 10, color: "var(--text-3)", marginTop: 5 }}>{sub}</div>}
      <div style={{ marginTop: 8, height: 1.5, borderRadius: 99, background: `linear-gradient(90deg, ${accent} 0%, transparent 100%)`, opacity: 0.45 }} />
    </div>
  );
}

// @group Utilities : Chart card wrapper
function ChartCard({ title, accent, loading, children }: { title: string; accent: string; loading: boolean; children: ReactNode }) {
  return (
    <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: 10, padding: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 14 }}>
        <div style={{ width: 2, height: 12, borderRadius: 99, background: accent }} />
        <span style={{ fontSize: 11, fontWeight: 600, color: "var(--text-3)" }}>{title}</span>
      </div>
      {loading ? (
        <div style={{ height: 140, display: "flex", flexDirection: "column", gap: 6, justifyContent: "flex-end" }}>
          {[40, 55, 30, 70, 45, 60, 35, 50].map((h, i) => (
            <span key={i} className="skel" style={{ height: 2, width: "100%", opacity: 0.3 + (h / 200) }} />
          ))}
          <span className="skel" style={{ height: 140, position: "absolute", width: "calc(100% - 32px)", borderRadius: 8, opacity: 0.15 }} />
        </div>
      ) : children}
    </div>
  );
}

// @group Utilities : Alert banner
function AlertBanner({ color, msg }: { color: string; msg: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 7, padding: "8px 12px", borderRadius: 8, background: `${color}12`, border: `1px solid ${color}38`, color, fontSize: 12 }}>
      <AlertTriangle size={12} /> {msg}
    </div>
  );
}

// @group Utilities : Threshold number input
function ThresholdField({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div>
      <label style={{ fontSize: 10, color: "var(--text-3)", display: "block", marginBottom: 5 }}>{label}</label>
      <input type="number" min={1} max={100} value={value} onChange={(e) => onChange(Number(e.target.value))} className="field" style={{ width: "100%" }} />
    </div>
  );
}
