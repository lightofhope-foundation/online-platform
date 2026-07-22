"use client";

import {
  Children,
  cloneElement,
  isValidElement,
  type ReactElement,
  type ReactNode,
} from "react";
import type { SessionPathChrome } from "./SessionPathBubbles";

type SessionPathHeroProps = {
  title: string;
  backgroundUrl: string;
  subtitle?: ReactNode;
  backLink?: ReactNode;
  canEditBackground?: boolean;
  clientUserId?: string;
  clientId?: string;
  children: ReactNode;
};

/** Passes header/background chrome into TherapySessionsWorkspace → SessionPathBubbles. */
export function SessionPathHero({
  title,
  backgroundUrl,
  subtitle,
  backLink,
  canEditBackground,
  clientUserId,
  clientId,
  children,
}: SessionPathHeroProps) {
  const pathChrome: SessionPathChrome = {
    title,
    backgroundUrl,
    subtitle,
    backLink,
    canEditBackground,
    clientUserId,
    clientId,
  };

  return (
    <div className="space-y-6">
      {Children.map(children, (child) => {
        if (!isValidElement(child)) return child;
        return cloneElement(child as ReactElement<{ pathChrome?: SessionPathChrome }>, {
          pathChrome,
        });
      })}
    </div>
  );
}
