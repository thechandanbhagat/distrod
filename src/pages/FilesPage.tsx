// @group APIEndpoints : File Explorer page — browse and manage WSL filesystem
import { useState, useCallback, useEffect, useRef, Fragment } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Folder, FileText, ChevronRight, Trash2, Plus, AlertCircle, FolderOpen } from "lucide-react";
import { Header } from "../components/layout/Header";
import { useDistroStore } from "../store/distroStore";
import type { FsEntry } from "../types";

// @group BusinessLogic : FilesPage component
export function FilesPage() {
  const { selectedDistro } = useDistroStore();
  const [currentPath, setCurrentPath] = useState("/");
  const [entries, setEntries] = useState<FsEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newFolderMode, setNewFolderMode] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const prevDistro = useRef<string | null>(null);

  // @group BusinessLogic : Clear stale entries when distro changes
  useEffect(() => {
    if (prevDistro.current !== selectedDistro) {
      prevDistro.current = selectedDistro;
      setEntries([]);
      setCurrentPath("/");
    }
  }, [selectedDistro]);

  const loadDir = useCallback(async (path: string) => {
    if (!selectedDistro) return;
    setLoading(true); setError(null);
    try {
      const result = await invoke<FsEntry[]>("list_directory", { distroName: selectedDistro, path });
      setEntries(result); setCurrentPath(path);
    } catch (err) { setError(err instanceof Error ? err.message : String(err)); }
    finally { setLoading(false); }
  }, [selectedDistro]);

  useEffect(() => { if (selectedDistro) loadDir("/"); }, [selectedDistro, loadDir]);

  const handleDelete = async (entry: FsEntry) => {
    if (!selectedDistro) return;
    try { await invoke("delete_entry", { distroName: selectedDistro, path: entry.path, isDir: entry.kind === "dir" }); await loadDir(currentPath); }
    catch (err) { setError(err instanceof Error ? err.message : String(err)); }
  };

  const handleCreateFolder = async () => {
    if (!selectedDistro || !newFolderName.trim()) return;
    const path = `${currentPath}/${newFolderName.trim()}`.replace(/\/+/g, "/");
    try { await invoke("create_directory", { distroName: selectedDistro, path }); await loadDir(currentPath); setNewFolderMode(false); setNewFolderName(""); }
    catch (err) { setError(err instanceof Error ? err.message : String(err)); }
  };

  const pathParts = currentPath.split("/").filter(Boolean);
  const isInitialLoad = loading && entries.length === 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <Header onRefresh={() => loadDir(currentPath)} />
      <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column", padding: "16px 20px", gap: 10 }}>
        {!selectedDistro ? (
          <div className="empty-state"><FolderOpen size={24} /><p style={{ fontSize: 12, margin: 0 }}>Select a distro on the Distro Manager to browse files.</p></div>
        ) : (
          <>
            {error && (
              <div style={{ display: "flex", alignItems: "center", gap: 7, padding: "8px 12px", borderRadius: 8, background: "rgba(244,63,94,0.07)", border: "1px solid rgba(244,63,94,0.22)", color: "#f87171", fontSize: 12 }}>
                <AlertCircle size={11} /> {error}
              </div>
            )}

            {/* Breadcrumb + toolbar */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 1, fontSize: 11, flex: 1, opacity: isInitialLoad ? 0.4 : 1 }}>
                <button onClick={() => loadDir("/")} style={{ color: currentPath === "/" ? "var(--accent-text)" : "var(--text-3)", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: 11, padding: "2px 4px", borderRadius: 4 }}>
                  /
                </button>
                {pathParts.map((part, i) => {
                  const target = "/" + pathParts.slice(0, i + 1).join("/");
                  const isLast = i === pathParts.length - 1;
                  return (
                    <Fragment key={i}>
                      <ChevronRight size={10} style={{ color: "var(--text-4)", flexShrink: 0 }} />
                      <button onClick={() => loadDir(target)} style={{ color: isLast ? "var(--accent-text)" : "var(--text-3)", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: 11, padding: "2px 4px", borderRadius: 4 }}>{part}</button>
                    </Fragment>
                  );
                })}
              </div>

              {!newFolderMode ? (
                <button onClick={() => setNewFolderMode(true)} disabled={isInitialLoad}
                  style={{ display: "flex", alignItems: "center", gap: 4, padding: "5px 10px", borderRadius: 7, cursor: isInitialLoad ? "default" : "pointer", fontSize: 11, fontWeight: 500, fontFamily: "inherit", background: "var(--accent-dim)", color: "var(--accent-text)", border: "1px solid var(--border-accent)", opacity: isInitialLoad ? 0.4 : 1 }}
                ><Plus size={11} /> New Folder</button>
              ) : (
                <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <input autoFocus value={newFolderName} onChange={(e) => setNewFolderName(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") handleCreateFolder(); if (e.key === "Escape") { setNewFolderMode(false); setNewFolderName(""); } }}
                    placeholder="Folder name" className="field" style={{ width: 140, padding: "5px 9px", fontSize: 11 }} />
                  <button onClick={handleCreateFolder} className="btn-primary" style={{ padding: "5px 10px", fontSize: 11 }}>Create</button>
                  <button onClick={() => { setNewFolderMode(false); setNewFolderName(""); }} className="btn-ghost" style={{ padding: "5px 9px", fontSize: 11 }}>Cancel</button>
                </div>
              )}
            </div>

            {/* File list */}
            <div style={{ flex: 1, overflow: "auto", background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: 10, position: "relative" }}>
              {/* Loading bar during navigation */}
              {loading && !isInitialLoad && <div className="load-bar" />}

              {isInitialLoad ? (
                /* Skeleton rows */
                <table className="data-table" style={{ width: "100%" }}>
                  <thead>
                    <tr><th>Name</th><th>Size</th><th>Modified</th><th style={{ width: 40 }} /></tr>
                  </thead>
                  <tbody>
                    {Array.from({ length: 12 }).map((_, i) => (
                      <tr key={i}>
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                            <span className="skel" style={{ width: 12, height: 12, flexShrink: 0, borderRadius: 3 }} />
                            <span className="skel" style={{ width: `${50 + (i % 6) * 25}px`, height: 11 }} />
                          </div>
                        </td>
                        <td><span className="skel" style={{ display: "block", width: 30, height: 11 }} /></td>
                        <td><span className="skel" style={{ display: "block", width: 60, height: 11 }} /></td>
                        <td />
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : entries.length === 0 ? (
                <div className="empty-state" style={{ padding: 36 }}><Folder size={20} /><p style={{ margin: 0, fontSize: 12 }}>Empty directory</p></div>
              ) : (
                <table className="data-table" style={{ width: "100%" }}>
                  <thead>
                    <tr><th>Name</th><th>Size</th><th>Modified</th><th style={{ width: 40 }} /></tr>
                  </thead>
                  <tbody>
                    {entries.map((entry) => (
                      <tr key={entry.path} style={{ cursor: entry.kind === "dir" ? "pointer" : "default" }}>
                        <td>
                          <button onClick={() => entry.kind === "dir" && loadDir(entry.path)}
                            style={{ display: "flex", alignItems: "center", gap: 7, background: "none", border: "none", cursor: entry.kind === "dir" ? "pointer" : "default", fontFamily: "inherit", fontSize: 12, padding: 0, color: entry.kind === "dir" ? "var(--accent-text)" : "var(--text-2)", transition: "color 0.12s" }}
                            onMouseEnter={(e) => { if (entry.kind === "dir") (e.currentTarget as HTMLButtonElement).style.color = "var(--text-1)"; }}
                            onMouseLeave={(e) => { if (entry.kind === "dir") (e.currentTarget as HTMLButtonElement).style.color = "var(--accent-text)"; }}
                          >
                            {entry.kind === "dir" ? <Folder size={12} style={{ flexShrink: 0, color: "var(--accent)" }} /> : <FileText size={12} style={{ flexShrink: 0, color: "var(--text-3)" }} />}
                            {entry.name}
                          </button>
                        </td>
                        <td style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "var(--text-3)" }}>{entry.kind === "dir" ? "—" : entry.size ? fmtBytes(entry.size) : "—"}</td>
                        <td style={{ fontSize: 11, color: "var(--text-3)" }}>{entry.modifiedAt ? new Date(entry.modifiedAt * 1000).toLocaleDateString() : "—"}</td>
                        <td style={{ padding: "7px 10px" }}>
                          <button onClick={() => handleDelete(entry)} title="Delete"
                            style={{ width: 22, height: 22, borderRadius: 5, display: "flex", alignItems: "center", justifyContent: "center", background: "transparent", border: "1px solid transparent", color: "var(--text-4)", cursor: "pointer", opacity: 0, transition: "all 0.12s" }}
                            className="delete-btn"
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
      <style>{`tr:hover .delete-btn { opacity:1!important; color:#f43f5e!important; border-color:rgba(244,63,94,0.22)!important; background:rgba(244,63,94,0.08)!important; }`}</style>
    </div>
  );
}

// @group Utilities : Format bytes
function fmtBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024, sz = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sz[i]}`;
}
