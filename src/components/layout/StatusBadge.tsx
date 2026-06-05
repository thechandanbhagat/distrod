// @group Utilities : Status badge for distro running/stopped states
import type { DistroStatus } from "../../types";

interface StatusBadgeProps {
  status: DistroStatus;
}

// @group Constants : Status visual tokens
const S: Record<DistroStatus, { bg: string; border: string; color: string; dot: string; pulse: boolean }> = {
  running:    { bg: "rgba(16,185,129,0.10)",  border: "rgba(16,185,129,0.28)",  color: "#34d399", dot: "#10b981", pulse: true },
  stopped:    { bg: "rgba(71,85,105,0.10)",   border: "rgba(71,85,105,0.22)",   color: "#64748b", dot: "#475569", pulse: false },
  installing: { bg: "rgba(245,158,11,0.10)",  border: "rgba(245,158,11,0.28)",  color: "#fbbf24", dot: "#f59e0b", pulse: true },
  unknown:    { bg: "rgba(30,41,59,0.20)",    border: "rgba(30,41,59,0.40)",    color: "#334155", dot: "#1e293b", pulse: false },
};

// @group BusinessLogic : StatusBadge component
export function StatusBadge({ status }: StatusBadgeProps) {
  const s = S[status];
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        padding: "2px 8px",
        borderRadius: 99,
        fontSize: 11,
        fontWeight: 500,
        background: s.bg,
        border: `1px solid ${s.border}`,
        color: s.color,
      }}
    >
      <span style={{ position: "relative", width: 6, height: 6, display: "inline-flex", flexShrink: 0 }}>
        <span style={{ position: "absolute", inset: 0, borderRadius: "50%", background: s.dot }} />
        {s.pulse && (
          <span
            className="animate-ping"
            style={{ position: "absolute", inset: "-2px", borderRadius: "50%", border: `1px solid ${s.dot}`, opacity: 0.45 }}
          />
        )}
      </span>
      {status}
    </span>
  );
}
