"use client";

import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

type GlassNavLinkProps = ComponentProps<typeof Link> & {
  children: ReactNode;
  active?: boolean;
};

/** Pill nav item — blur/frost only inside the rounded button shape */
export function GlassNavLink({
  children,
  active,
  className = "",
  ...props
}: GlassNavLinkProps) {
  return (
    <Link
      {...props}
      className={`glass-nav-link flex items-center gap-3 rounded-full px-5 py-3 text-sm font-medium text-white transition-all ${
        active ? "glass-nav-link-active" : ""
      } ${className}`.trim()}
    >
      <span className="glass-nav-link-frost" aria-hidden />
      <span className="glass-nav-link-inner">{children}</span>
    </Link>
  );
}

type GlassNavButtonProps = {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
  "aria-busy"?: boolean;
};

/** Same frosted pill shell for non-link actions (e.g. logout) */
export function GlassNavButton({
  children,
  className = "",
  ...props
}: GlassNavButtonProps) {
  return (
    <button
      type="button"
      {...props}
      className={`glass-nav-link flex w-full items-center gap-3 rounded-full px-5 py-3 text-sm font-medium text-white transition-all ${className}`.trim()}
    >
      <span className="glass-nav-link-frost" aria-hidden />
      <span className="glass-nav-link-inner">{children}</span>
    </button>
  );
}
