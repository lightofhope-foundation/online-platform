import type { ReactNode } from "react";

type GlassPanelProps = {
  children: ReactNode;
  className?: string;
  as?: "div" | "section" | "aside";
};

export function GlassPanel({
  children,
  className = "",
  as: Tag = "div",
}: GlassPanelProps) {
  return (
    <Tag className={`glass-panel ${className}`.trim()}>{children}</Tag>
  );
}
