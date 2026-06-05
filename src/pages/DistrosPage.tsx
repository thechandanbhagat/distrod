// @group APIEndpoints : Distro Manager page
import { useState } from "react";
import { Download, AlertCircle, Server } from "lucide-react";
import { Header } from "../components/layout/Header";
import { DistroCard } from "../components/distro/DistroCard";
import { useDistros } from "../hooks/useDistros";

// @group BusinessLogic : DistrosPage component
export function DistrosPage() {
  const { distros, selectedDistro, loading, error, selectDistro, startDistro, stopDistro, setDefault, exportDistro, importDistro, refresh } = useDistros();
  const [importPath, setImportPath] = useState("");
  const [importName, setImportName] = useState("");
  const [importLocation, setImportLocation] = useState("C:\\WSL-Distros");
  const [showImport, setShowImport] = useState(false);

  const handleExport = async (name: string) => {
    await exportDistro(name, `C:\\WSL-Exports\\${name}_${Date.now()}.tar`);
  };

  const handleImport = async () => {
    if (!importName.trim() || !importPath.trim()) return;
    await importDistro(importName.trim(), importPath.trim());
    setShowImport(false);
    setImportName("");
    setImportPath("");
  };

  const running = distros.filter((d) => d.status === "running").length;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <Header onRefresh={refresh} />
      <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px" }}>

        {error && (
          <div style={{ display: "flex", alignItems: "center", gap: 7, padding: "8px 12px", marginBottom: 14, borderRadius: 8, background: "rgba(244,63,94,0.07)", border: "1px solid rgba(244,63,94,0.22)", color: "#f87171", fontSize: 12 }}>
            <AlertCircle size={12} /> {error}
          </div>
        )}

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ fontSize: 12, color: "var(--text-3)" }}>
              <span style={{ color: "var(--text-2)", fontWeight: 500 }}>{distros.length}</span> distro{distros.length !== 1 ? "s" : ""}
            </div>
            {running > 0 && (
              <div style={{ fontSize: 11, color: "#34d399", display: "flex", alignItems: "center", gap: 3 }}>
                <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#10b981", display: "inline-block" }} />
                {running} running
              </div>
            )}
          </div>
          <Btn onClick={() => setShowImport(true)}>
            <Download size={11} /> Import Distro
          </Btn>
        </div>

        {loading && distros.length === 0 && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(230px, 1fr))", gap: 10 }}>
            {[1, 2, 3].map((i) => (
              <div key={i} style={{ height: 130, borderRadius: 12, background: "var(--bg-surface)", border: "1px solid var(--border)", animation: "pulse 1.5s ease-in-out infinite" }} />
            ))}
          </div>
        )}

        {distros.length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(230px, 1fr))", gap: 10 }}>
            {distros.map((distro) => (
              <DistroCard
                key={distro.name} distro={distro}
                isSelected={selectedDistro === distro.name}
                onSelect={() => selectDistro(distro.name)}
                onStart={() => startDistro(distro.name)}
                onStop={() => stopDistro(distro.name)}
                onSetDefault={() => setDefault(distro.name)}
                onExport={() => handleExport(distro.name)}
              />
            ))}
          </div>
        )}

        {!loading && distros.length === 0 && (
          <div className="empty-state" style={{ paddingTop: 60 }}>
            <Server size={30} />
            <p style={{ fontSize: 13, fontWeight: 500, margin: 0, color: "var(--text-3)" }}>No WSL distros found</p>
            <p style={{ fontSize: 11, margin: 0, color: "var(--text-4)" }}>Install a distro from the Microsoft Store or import one.</p>
          </div>
        )}
      </div>

      {showImport && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, backdropFilter: "blur(4px)" }}>
          <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-hover)", borderRadius: 14, padding: 22, width: "100%", maxWidth: 400, boxShadow: "0 24px 64px rgba(0,0,0,0.6)" }}>
            <h2 style={{ margin: "0 0 16px", fontSize: 13, fontWeight: 600, color: "var(--text-1)" }}>Import Distro</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <Field label="Distro Name" value={importName} onChange={setImportName} placeholder="e.g. Ubuntu-Backup" />
              <Field label="TAR File Path" value={importPath} onChange={setImportPath} placeholder="C:\WSL-Exports\ubuntu.tar" />
              <Field label="Install Location" value={importLocation} onChange={setImportLocation} placeholder="C:\WSL-Distros" />
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 7, marginTop: 18 }}>
              <button onClick={() => setShowImport(false)} className="btn-ghost">Cancel</button>
              <button onClick={handleImport} className="btn-primary">Import</button>
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes pulse { 0%,100%{opacity:0.6} 50%{opacity:0.3} }`}</style>
    </div>
  );
}

// @group Utilities : Accent button
function Btn({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  const [h, setH] = useState(false);
  return (
    <button onClick={onClick} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 11px", borderRadius: 7, cursor: "pointer", fontSize: 11, fontWeight: 500, fontFamily: "inherit", background: h ? "var(--accent-glow)" : "var(--accent-dim)", color: "var(--accent-text)", border: "1px solid var(--border-accent)", transition: "background 0.12s" }}>
      {children}
    </button>
  );
}

// @group Utilities : Labelled text field
function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div>
      <label style={{ fontSize: 10, color: "var(--text-3)", display: "block", marginBottom: 4 }}>{label}</label>
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="field" />
    </div>
  );
}
