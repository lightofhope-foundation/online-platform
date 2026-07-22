import type { ReactNode } from "react";

type GlassPanelProps = {
  children: ReactNode;
  className?: string;
  as?: "div" | "section" | "aside";
  "data-shell-content-panel"?: boolean;
};

export function GlassPanel({
  children,
  className = "",
  as: Tag = "div",
  "data-shell-content-panel": shellContentPanel,
}: GlassPanelProps) {
  return (
    <Tag
      className={`glass-panel ${className}`.trim()}
      {...(shellContentPanel ? { "data-shell-content-panel": "" } : {})}
    >
      {children}
    </Tag>
  );
}
