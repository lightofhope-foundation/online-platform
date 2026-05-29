"use client";

import { NotificationBell } from "./NotificationBell";
import { UserMenu } from "./UserMenu";

type TopBarProps = {
  title?: string;
};

export function TopBar({ title }: TopBarProps) {
  return (
    <header className="mb-6 flex items-center justify-between gap-4">
      {title ? (
        <h1 className="text-xl font-semibold text-white lg:text-2xl">{title}</h1>
      ) : (
        <div className="flex-1" />
      )}
      <div className="flex items-center gap-3">
        <NotificationBell />
        <UserMenu />
      </div>
    </header>
  );
}
