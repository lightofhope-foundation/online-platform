import Link from "next/link";
import type { ReactNode } from "react";

type AdminSettingsSubpageProps = {
  title: string;
  description: string;
  phaseLabel: string;
  children?: ReactNode;
};

export function AdminSettingsSubpage({
  title,
  description,
  phaseLabel,
  children,
}: AdminSettingsSubpageProps) {
  return (
    <div className="space-y-8">
      <div>
        <Link
          href="/admin/einstellungen"
          className="text-sm text-[#63eca9] hover:underline"
        >
          ← Zurück zu Einstellungen
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-white">{title}</h1>
        <p className="mt-1 text-sm text-white/60">{description}</p>
      </div>

      {children ?? (
        <div className="rounded-[20px] border border-white/10 bg-white/[0.02] p-8 text-center">
          <p className="text-white/70">{phaseLabel}</p>
          <p className="mt-2 text-sm text-white/45">
            Dieser Bereich wird im nächsten Entwicklungsschritt freigeschaltet.
          </p>
        </div>
      )}
    </div>
  );
}
