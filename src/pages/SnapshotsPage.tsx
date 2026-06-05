// @group APIEndpoints : Snapshot Manager page — export/import distro backups
import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Archive, Download, Upload, Trash2, AlertCircle } from "lucide-react";
import { Header } from "../components/layout/Header";
import { useDistroStore } from "../store/distroStore";
import { useSnapshotStore } from "../store/snapshotStore";
import type { Snapshot } from "../types";

// @group BusinessLogic : SnapshotsPage component
export function SnapshotsPage() {
  const { distros } = useDistroStore();
  const { snapshots, loading, error, addSnapshot, removeSnapshot, setLoading, setError } = useSnapshotStore();

  const [exportDistro, setExportDistro] = useState("");
  const [exportDir, setExportDir] = useState("C:\\WSL-Snapshots");
  const [exportLabel, setExportLabel] = useState("");
  const [showExport, setShowExport] = useState(false);

  const [restoreFile, setRestoreFile] = useState("");
  const [restoreName, setRestoreName] = useState("");
  const [restoreDir, setRestoreDir] = useState("C:\\WSL-Distros");
  const [showRestore, setShowRestore] = useState(false);

  const handleExport = async () => {
    if (!exportDistro || !exportDir) return;
    setLoading(true); setError(null);
    try {
      const snapshot = await invoke<Snapshot>("create_snapshot", { distroName: exportDistro, exportDir, label: exportLabel || null });
      addSnapshot(snapshot); setShowExport(false); setExportLabel("");
    } catch (err) { setError(err instanceof Error ? err.message : String(err)); }
    finally { setLoading(false); }
  };

  const handleRestore = async () => {
    if (!restoreFile || !restoreName || !restoreDir) return;
    setLoading(true); setError(null);
    try {
      await invoke("restore_snapshot", { distroName: restoreName, installLocation: restoreDir, filePath: restoreFile });
      setShowRestore(false); setRestoreFile(""); setRestoreName("");
    } catch (err) { setError(err instanceof Error ? err.message : String(err)); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <Header />
      <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px", display: "flex", flexDirection: "column", gap: 14 }}>
        {error && (
          <div style={{ display: "flex", alignItems: "center", gap: 7, padding: "8px 12px", borderRadius: 8, background: "rgba(244,63,94,0.07)", border: "1px solid rgba(244,63,94,0.22)", color: "#f87171", fontSize: 12 }}>
            <AlertCircle size={12} /> {error}
          </div>
        )}

        {/* Action buttons */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <AccentBtn onClick={() => setShowExport(true)} color="accent">
            <Upload size={11} /> Create Snapshot
          </AccentBtn>
          <AccentBtn onClick={() => setShowRestore(true)} color="green">
            <Download size={11} /> Restore Snapshot
          </AccentBtn>
        </div>

        {/* Snapshot list */}
        {snapshots.length === 0 ? (
          <div className="empty-state" style={{ paddingTop: 60 }}>
            <Archive size={30} />
            <p style={{ fontSize: 12, margin: 0 }}>No snapshots yet. Create one to backup a distro.</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {snapshots.map((snap) => (
              <SnapshotRow key={snap.id} snapshot={snap} onDelete={() => removeSnapshot(snap.id)} />
            ))}
          </div>
        )}
      </div>

      {/* Export dialog */}
      {showExport && (
        <Modal title="Create Snapshot" onClose={() => setShowExport(false)}>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <DSelect label="Distro" value={exportDistro} onChange={setExportDistro} options={distros.map((d) => d.name)} placeholder="Select distro" />
            <DField label="Export Directory" value={exportDir} onChange={setExportDir} />
            <DField label="Label (optional)" value={exportLabel} onChange={setExportLabel} placeholder="e.g. before-upgrade" />
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 7, marginTop: 18 }}>
            <button onClick={() => setShowExport(false)} className="btn-ghost">Cancel</button>
            <button disabled={loading} onClick={handleExport} className="btn-primary" style={{ opacity: loading ? 0.5 : 1 }}>{loading ? "Exporting…" : "Create Snapshot"}</button>
          </div>
        </Modal>
      )}

      {/* Restore dialog */}
      {showRestore && (
        <Modal title="Restore Snapshot" onClose={() => setShowRestore(false)}>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <DField label="TAR File Path" value={restoreFile} onChange={setRestoreFile} placeholder="C:\WSL-Snapshots\ubuntu_123.tar" />
            <DField label="New Distro Name" value={restoreName} onChange={setRestoreName} placeholder="e.g. Ubuntu-Restored" />
            <DField label="Install Location" value={restoreDir} onChange={setRestoreDir} />
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 7, marginTop: 18 }}>
            <button onClick={() => setShowRestore(false)} className="btn-ghost">Cancel</button>
            <button disabled={loading} onClick={handleRestore} className="btn-primary" style={{ opacity: loading ? 0.5 : 1 }}>{loading ? "Restoring…" : "Restore"}</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// @group Utilities : Snapshot row
function SnapshotRow({ snapshot, onDelete }: { snapshot: Snapshot; onDelete: () => void }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderRadius: 10, border: "1px solid var(--border)", background: "var(--bg-surface)" }}>
      <Archive size={16} style={{ color: "var(--accent-text)", flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 500, color: "var(--text-1)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {snapshot.label ?? snapshot.distroName}
        </div>
        <div style={{ fontSize: 10, color: "var(--text-3)", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{snapshot.filePath}</div>
        <div style={{ fontSize: 10, color: "var(--text-3)", marginTop: 1 }}>
          {new Date(snapshot.createdAt * 1000).toLocaleString()} · {formatBytes(snapshot.sizeBytes)}
        </div>
      </div>
      <button onClick={onDelete} title="Remove"
        style={{ width: 24, height: 24, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", background: "transparent", border: "1px solid transparent", color: "var(--text-3)", cursor: "pointer", flexShrink: 0, transition: "all 0.12s" }}
        onMouseEnter={(e) => { const b = e.currentTarget as HTMLButtonElement; b.style.background = "rgba(244,63,94,0.10)"; b.style.color = "#f43f5e"; b.style.borderColor = "rgba(244,63,94,0.22)"; }}
        onMouseLeave={(e) => { const b = e.currentTarget as HTMLButtonElement; b.style.background = "transparent"; b.style.color = "var(--text-3)"; b.style.borderColor = "transparent"; }}
      ><Trash2 size={12} /></button>
    </div>
  );
}

// @group Utilities : Modal wrapper
function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, backdropFilter: "blur(4px)" }} onClick={onClose}>
      <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-hover)", borderRadius: 14, padding: 22, width: "100%", maxWidth: 400, boxShadow: "0 24px 64px rgba(0,0,0,0.6)" }} onClick={(e) => e.stopPropagation()}>
        <h2 style={{ margin: "0 0 16px", fontSize: 13, fontWeight: 600, color: "var(--text-1)" }}>{title}</h2>
        {children}
      </div>
    </div>
  );
}

// @group Utilities : Accent button
function AccentBtn({ onClick, color, children }: { onClick: () => void; color: "accent" | "green"; children: React.ReactNode }) {
  const [h, setH] = useState(false);
  const isGreen = color === "green";
  const bg = isGreen ? "rgba(16,185,129,0.08)" : "var(--accent-dim)";
  const bgH = isGreen ? "rgba(16,185,129,0.14)" : "var(--accent-glow)";
  const col = isGreen ? "#34d399" : "var(--accent-text)";
  const bdr = isGreen ? "rgba(16,185,129,0.22)" : "var(--border-accent)";
  return (
    <button onClick={onClick} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 12px", borderRadius: 7, cursor: "pointer", fontSize: 12, fontWeight: 500, fontFamily: "inherit", background: h ? bgH : bg, color: col, border: `1px solid ${bdr}`, transition: "background 0.12s" }}>
      {children}
    </button>
  );
}

// @group Utilities : Dialog text field
function DField({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div>
      <label style={{ fontSize: 10, color: "var(--text-3)", display: "block", marginBottom: 4 }}>{label}</label>
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="field" />
    </div>
  );
}

// @group Utilities : Dialog select field
function DSelect({ label, value, onChange, options, placeholder }: { label: string; value: string; onChange: (v: string) => void; options: string[]; placeholder?: string }) {
  return (
    <div>
      <label style={{ fontSize: 10, color: "var(--text-3)", display: "block", marginBottom: 4 }}>{label}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="field" style={{ appearance: "none" }}>
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

// @group Utilities : Format bytes helper
function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024, sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}
