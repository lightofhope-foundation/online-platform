"use client";

import Link, { useLinkStatus } from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { NavSpinner } from "@/components/ui/NavSpinner";

export function GlassNavLoadingContent() {
  return (
    <>
      <span className="select-none text-white/35" aria-hidden>
        ··
      </span>
      <span>Lade</span>
      <NavSpinner />
      <span className="select-none text-white/35" aria-hidden>
        ··
      </span>
    </>
  );
}

type GlassNavLinkProps = Omit<ComponentProps<typeof Link>, "children"> & {
  icon: ReactNode;
  label: string;
  active?: boolean;
};

function GlassNavLinkInner({
  icon,
  label,
}: {
  icon: ReactNode;
  label: string;
}) {
  const { pending } = useLinkStatus();

  return (
    <span
      className={`glass-nav-link-inner ${pending ? "glass-nav-link-inner--loading justify-center gap-2" : ""}`}
      aria-busy={pending || undefined}
    >
      {pending ? (
        <GlassNavLoadingContent />
      ) : (
        <>
          <span className="text-white">{icon}</span>
          <span>{label}</span>
        </>
      )}
    </span>
  );
}

/** Pill nav item — blur/frost only inside the rounded button shape */
export function GlassNavLink({
  icon,
  label,
  active,
  className = "",
  ...props
}: GlassNavLinkProps) {
  return (
    <Link
      {...props}
      className={`glass-nav-link nav-press-link flex items-center gap-3 rounded-full px-5 py-3 text-sm font-medium text-white transition-all ${
        active ? "glass-nav-link-active" : ""
      } ${className}`.trim()}
    >
      <span className="glass-nav-link-frost" aria-hidden />
      <GlassNavLinkInner icon={icon} label={label} />
    </Link>
  );
}

type GlassNavButtonProps = {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
  "aria-busy"?: boolean;
};

/** Same frosted pill shell for non-link actions (e.g. logout) */
export function GlassNavButton({
  children,
  className = "",
  loading = false,
  ...props
}: GlassNavButtonProps) {
  return (
    <button
      type="button"
      {...props}
      className={`glass-nav-link flex w-full items-center gap-3 rounded-full px-5 py-3 text-sm font-medium text-white transition-all ${className}`.trim()}
    >
      <span className="glass-nav-link-frost" aria-hidden />
      <span
        className={`glass-nav-link-inner ${loading ? "glass-nav-link-inner--loading justify-center gap-2" : ""}`}
        aria-busy={loading || undefined}
      >
        {loading ? <GlassNavLoadingContent /> : children}
      </span>
    </button>
  );
}
