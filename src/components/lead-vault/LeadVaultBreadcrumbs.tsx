import Link from "next/link";
import type { LeadVaultArea, LeadVaultBoard } from "@/lib/leadVault";
import { accentClass, leadVaultBasePath } from "@/lib/leadVault";

type Props = {
  area: LeadVaultArea;
  crumbs: LeadVaultBoard[];
};

export function LeadVaultBreadcrumbs({ area, crumbs }: Props) {
  const base = leadVaultBasePath(area);

  return (
    <nav className="flex flex-wrap items-center gap-1.5 text-sm text-white/55">
      <Link href={base} className="hover:text-white/90">
        Klientenakte
      </Link>
      {crumbs.map((c) => (
        <span key={c.id} className="flex items-center gap-1.5">
          <span className="text-white/30">/</span>
          <Link
            href={`${base}/${c.id}`}
            className="inline-flex items-center gap-1.5 hover:text-white/90"
          >
            <span
              className={`inline-block h-2.5 w-2.5 rounded-sm ${accentClass(c.accent)}`}
            />
            {c.title}
          </Link>
        </span>
      ))}
    </nav>
  );
}
