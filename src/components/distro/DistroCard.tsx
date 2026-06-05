// @group BusinessLogic : Card component for a single WSL distro
import { useState } from "react";
import { Play, Square, Star, Upload } from "lucide-react";
import { StatusBadge } from "../layout/StatusBadge";
import type { Distro } from "../../types";

interface DistroCardProps {
  distro: Distro;
  isSelected: boolean;
  onSelect: () => void;
  onStart: () => void;
  onStop: () => void;
  onSetDefault: () => void;
  onExport: () => void;
}

// @group BusinessLogic : DistroCard component
export function DistroCard({ distro, isSelected, onSelect, onStart, onStop, onSetDefault, onExport }: DistroCardProps) {
  const [hovered, setHovered] = useState(false);
  const isRunning = distro.status === "running";

  return (
    <div
      onClick={onSelect}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: "relative",
        background: "var(--bg-surface)",
        border: isSelected
          ? "1px solid var(--border-accent)"
          : `1px solid ${hovered ? "var(--border-hover)" : "var(--border)"}`,
        borderRadius: 12, overflow: "hidden", cursor: "pointer",
        boxShadow: isSelected
          ? "0 0 0 1px var(--accent-glow), 0 6px 24px rgba(0,0,0,0.4)"
          : hovered ? "0 4px 16px rgba(0,0,0,0.28)" : "0 2px 8px rgba(0,0,0,0.18)",
        transition: "border-color 0.15s, box-shadow 0.15s",
      }}
    >
      {/* Top accent stripe */}
      <div style={{ height: 2, background: "linear-gradient(90deg, var(--accent) 0%, var(--accent-text) 60%, transparent 100%)" }} />

      <div style={{ padding: "12px 14px" }}>
        {/* Avatar row */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 34, height: 34, borderRadius: 8,
              background: "linear-gradient(135deg, var(--accent) 0%, var(--accent-text) 100%)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 14, fontWeight: 700, color: "rgba(255,255,255,0.95)", flexShrink: 0,
              boxShadow: isRunning ? `0 0 0 2px var(--bg-surface), 0 0 0 3px rgba(16,185,129,0.38)` : "none",
              transition: "box-shadow 0.2s",
            }}>
              {distro.name[0]?.toUpperCase() ?? "?"}
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-1)", lineHeight: 1.2 }}>
                {distro.name}
              </div>
              <div style={{ fontSize: 10, color: "var(--text-3)", marginTop: 2, fontFamily: "'JetBrains Mono', monospace" }}>
                WSL {distro.version}
              </div>
            </div>
          </div>
          {distro.isDefault && (
            <Star size={11} style={{ color: "#fbbf24", fill: "#fbbf24", filter: "drop-shadow(0 0 4px rgba(251,191,36,0.50))", flexShrink: 0 }} />
          )}
        </div>

        <StatusBadge status={distro.status} />

        <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 10 }}>
          {isRunning ? (
            <ActionBtn onClick={(e) => { e.stopPropagation(); onStop(); }} bg="rgba(244,63,94,0.07)" bgHover="rgba(244,63,94,0.14)" color="#f87171" border="rgba(244,63,94,0.20)">
              <Square size={10} /> Stop
            </ActionBtn>
          ) : (
            <ActionBtn onClick={(e) => { e.stopPropagation(); onStart(); }} bg="rgba(16,185,129,0.07)" bgHover="rgba(16,185,129,0.14)" color="#34d399" border="rgba(16,185,129,0.20)">
              <Play size={10} /> Start
            </ActionBtn>
          )}
          {!distro.isDefault && (
            <IconBtn onClick={(e) => { e.stopPropagation(); onSetDefault(); }} title="Set as default" color="#fbbf24" bg="rgba(245,158,11,0.07)" bgHover="rgba(245,158,11,0.14)" border="rgba(245,158,11,0.20)">
              <Star size={10} />
            </IconBtn>
          )}
          <IconBtn onClick={(e) => { e.stopPropagation(); onExport(); }} title="Export distro" color="var(--text-3)" bg="var(--bg-hover)" bgHover="var(--border)" border="var(--border)">
            <Upload size={10} />
          </IconBtn>
        </div>
      </div>
    </div>
  );
}

// @group Utilities : Pill action button
function ActionBtn({ onClick, bg, bgHover, color, border, children }: { onClick: (e: React.MouseEvent) => void; bg: string; bgHover: string; color: string; border: string; children: React.ReactNode }) {
  const [h, setH] = useState(false);
  return (
    <button onClick={onClick} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "4px 10px", borderRadius: 99, fontSize: 11, fontWeight: 500, fontFamily: "inherit", cursor: "pointer", border: `1px solid ${border}`, background: h ? bgHover : bg, color, transition: "background 0.12s" }}>
      {children}
    </button>
  );
}

// @group Utilities : Square icon button
function IconBtn({ onClick, title, bg, bgHover, color, border, children }: { onClick: (e: React.MouseEvent) => void; title: string; bg: string; bgHover: string; color: string; border: string; children: React.ReactNode }) {
  const [h, setH] = useState(false);
  return (
    <button onClick={onClick} title={title} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{ width: 24, height: 24, borderRadius: 99, display: "inline-flex", alignItems: "center", justifyContent: "center", border: `1px solid ${border}`, background: h ? bgHover : bg, color, cursor: "pointer", transition: "background 0.12s" }}>
      {children}
    </button>
  );
}
