// @group Configuration : Settings page — app preferences and theme selection
import { type ReactNode } from "react";
import { Check } from "lucide-react";
import { Header } from "../components/layout/Header";
import { useResourceStore } from "../store/resourceStore";
import { useThemeStore } from "../store/themeStore";
import { THEMES } from "../themes/themes";

// @group BusinessLogic : SettingsPage component
export function SettingsPage() {
  const { thresholds, setThresholds } = useResourceStore();
  const { themeId, setTheme } = useThemeStore();

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <Header />
      <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px", display: "flex", flexDirection: "column", gap: 14, maxWidth: 580 }}>

        {/* Theme picker */}
        <Section title="Appearance">
          <div style={{ fontSize: 11, color: "var(--text-3)", marginBottom: 14 }}>
            Choose a color theme for the interface.
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
            {THEMES.map((theme) => {
              const active = themeId === theme.id;
              return (
                <button
                  key={theme.id}
                  onClick={() => setTheme(theme.id)}
                  style={{
                    background: active ? "var(--bg-active)" : "var(--bg-input)",
                    border: `1px solid ${active ? "var(--border-accent)" : "var(--border)"}`,
                    borderRadius: 9,
                    padding: "10px 11px",
                    cursor: "pointer",
                    textAlign: "left",
                    transition: "border-color 0.15s, background 0.15s",
                    position: "relative",
                  }}
                  onMouseEnter={(e) => {
                    if (!active) (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--border-hover)";
                  }}
                  onMouseLeave={(e) => {
                    if (!active) (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--border)";
                  }}
                >
                  {/* Swatch row */}
                  <div style={{ display: "flex", gap: 4, marginBottom: 8 }}>
                    {theme.preview.map((color, i) => (
                      <div
                        key={i}
                        style={{
                          flex: i === 0 ? 2 : 1,
                          height: 20,
                          borderRadius: 4,
                          background: color,
                          border: "1px solid rgba(255,255,255,0.08)",
                        }}
                      />
                    ))}
                  </div>

                  {/* Name */}
                  <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-1)", lineHeight: 1.2 }}>
                    {theme.name}
                  </div>
                  <div style={{ fontSize: 10, color: "var(--text-3)", marginTop: 2 }}>
                    {theme.description}
                  </div>

                  {/* Active checkmark */}
                  {active && (
                    <div
                      style={{
                        position: "absolute", top: 8, right: 8,
                        width: 16, height: 16, borderRadius: "50%",
                        background: "var(--accent)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}
                    >
                      <Check size={9} color="#fff" strokeWidth={2.5} />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </Section>

        {/* Alert thresholds */}
        <Section title="Alert Thresholds">
          <div style={{ fontSize: 11, color: "var(--text-3)", marginBottom: 14 }}>
            Highlight resource metrics when they exceed these values.
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <NumberField
              label="CPU % threshold"
              value={thresholds.cpuPercent}
              onChange={(v) => setThresholds({ ...thresholds, cpuPercent: v })}
              min={1} max={100}
            />
            <NumberField
              label="Memory % threshold"
              value={thresholds.memoryPercent}
              onChange={(v) => setThresholds({ ...thresholds, memoryPercent: v })}
              min={1} max={100}
            />
          </div>
        </Section>

        {/* About */}
        <Section title="About distrod">
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <AboutRow label="Version" value="0.1.0" />
            <AboutRow label="Stack" value="Tauri v2 · Rust · React · TypeScript" />
            <AboutRow label="License" value="MIT" accent />
          </div>
        </Section>

      </div>
    </div>
  );
}

// @group Utilities : Section card wrapper
function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 10, padding: "14px 16px" }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-2)", marginBottom: 12 }}>{title}</div>
      {children}
    </div>
  );
}

// @group Utilities : Number input field
function NumberField({ label, value, onChange, min, max }: { label: string; value: number; onChange: (v: number) => void; min: number; max: number }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
      <label style={{ fontSize: 12, color: "var(--text-2)" }}>{label}</label>
      <input
        type="number" min={min} max={max} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="field"
        style={{ width: 80, textAlign: "right" }}
      />
    </div>
  );
}

// @group Utilities : About info row
function AboutRow({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div style={{ display: "flex", gap: 8, fontSize: 12 }}>
      <span style={{ color: "var(--text-3)", minWidth: 70 }}>{label}</span>
      <span style={{ color: accent ? "var(--accent-text)" : "var(--text-2)" }}>{value}</span>
    </div>
  );
}
