import type { ReactNode } from "react";
import Link from "next/link";

type DashboardQuickTileProps = {
  title: string;
  icon: ReactNode;
  href?: string | null;
  subtitle?: string;
};

export function DashboardQuickTile({
  title,
  icon,
  href,
  subtitle,
}: DashboardQuickTileProps) {
  const tileClass =
    "group flex flex-col rounded-[16px] border border-white/10 bg-black/50 p-4 min-h-[112px] transition-all hover:border-[#63eca9]/50 hover:bg-white/[0.04] hover:shadow-[0_0_20px_rgba(99,236,169,0.28)]";

  const content = (
    <>
      <div className="mb-3 flex items-start justify-between">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-[#63eca9]">
          {icon}
        </div>
        <div className="h-1.5 w-6 rounded-full bg-[#63eca9]/40 group-hover:bg-[#63eca9]/70 transition-colors" />
      </div>
      <h3 className="text-base font-semibold text-white">{title}</h3>
      {subtitle && <p className="mt-0.5 text-xs text-white/50">{subtitle}</p>}
    </>
  );

  if (href) {
    return (
      <Link href={href} className={tileClass}>
        {content}
      </Link>
    );
  }

  return (
    <div className={`${tileClass} cursor-default opacity-70 hover:shadow-none hover:border-white/10`}>
      {content}
    </div>
  );
}
