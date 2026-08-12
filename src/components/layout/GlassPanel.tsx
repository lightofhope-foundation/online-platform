import type { CSSProperties, ReactNode } from "react";

type GlassPanelProps = {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  as?: "div" | "section" | "aside";
  "data-shell-content-panel"?: boolean;
};

export function GlassPanel({
  children,
  className = "",
  style,
  as: Tag = "div",
  "data-shell-content-panel": shellContentPanel,
}: GlassPanelProps) {
  return (
    <Tag
      className={`glass-panel ${className}`.trim()}
      style={style}
      {...(shellContentPanel ? { "data-shell-content-panel": "" } : {})}
    >
      {children}
    </Tag>
  );
}
