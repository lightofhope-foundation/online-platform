"use client";

import Link, { useLinkStatus } from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { NavSpinner } from "./NavSpinner";

type NavPressLinkProps = ComponentProps<typeof Link> & {
  children: ReactNode;
  showSpinner?: boolean;
  spinnerClassName?: string;
  innerClassName?: string;
};

function NavPressLinkStatus({
  children,
  showSpinner = true,
  spinnerClassName = "ml-auto",
  innerClassName = "",
}: {
  children: ReactNode;
  showSpinner?: boolean;
  spinnerClassName?: string;
  innerClassName?: string;
}) {
  const { pending } = useLinkStatus();

  return (
    <span
      className={`nav-press-link-inner ${pending ? "nav-press-link-inner--pending" : ""} ${innerClassName}`.trim()}
      aria-busy={pending || undefined}
    >
      {children}
      {showSpinner && pending ? <NavSpinner className={spinnerClassName} /> : null}
    </span>
  );
}

/** Link with soft press feedback and a small spinner while the route loads */
export function NavPressLink({
  children,
  className = "",
  showSpinner = true,
  spinnerClassName,
  innerClassName,
  ...props
}: NavPressLinkProps) {
  return (
    <Link {...props} className={`nav-press-link ${className}`.trim()}>
      <NavPressLinkStatus
        showSpinner={showSpinner}
        spinnerClassName={spinnerClassName}
        innerClassName={innerClassName}
      >
        {children}
      </NavPressLinkStatus>
    </Link>
  );
}
