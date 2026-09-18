"use client";

import { Suspense } from "react";
import { BackgroundLayerToggles } from "./BackgroundLayerToggles";
import { GlobalClientSearch } from "./GlobalClientSearch";
import { NotificationBell } from "./NotificationBell";
import { RoleViewSwitcher } from "./RoleViewSwitcher";
import { UserMenu } from "./UserMenu";

type TopBarProps = {
  title?: string;
};

export function TopBar({ title }: TopBarProps) {
  return (
    <header className="mb-6 flex items-center justify-between gap-4">
      {title ? (
        <h1 className="typo-topbar-title shrink-0 font-semibold text-white">{title}</h1>
      ) : null}
      <GlobalClientSearch />
      <div className="flex shrink-0 items-center gap-3">
        <Suspense
          fallback={
            <div className="h-8 w-40 rounded-full border border-white/10 bg-black/20" />
          }
        >
          <RoleViewSwitcher />
        </Suspense>
        <BackgroundLayerToggles />
        <NotificationBell />
        <UserMenu />
      </div>
    </header>
  );
}
