// @group Configuration : Shared distrod logo asset wrapper
import distrodMark from "../../assets/distrod-mark.svg";

interface DistrodLogoProps {
  size: number;
  title?: string;
}

// @group Utilities : Reusable logo image with stable dimensions
export function DistrodLogo({ size, title = "distrod" }: DistrodLogoProps) {
  return (
    <img
      src={distrodMark}
      alt={title}
      draggable={false}
      style={{
        width: size,
        height: size,
        flexShrink: 0,
        display: "block",
        borderRadius: Math.max(4, Math.round(size * 0.24)),
        boxShadow: "0 0 14px var(--accent-glow)",
      }}
    />
  );
}
