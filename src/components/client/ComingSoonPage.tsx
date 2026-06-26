import Link from "next/link";
import { GlassPanel } from "@/components/layout/GlassPanel";

type ComingSoonPageProps = {
  title: string;
  description?: string;
  backHref?: string;
  backLabel?: string;
};

export function ComingSoonPage({
  title,
  description = "Dieser Bereich wird in einer der nächsten Entwicklungsphasen freigeschaltet.",
  backHref = "/",
  backLabel = "Zurück zur Startseite",
}: ComingSoonPageProps) {
  return (
    <div className="mx-auto max-w-lg space-y-6 py-4 text-center">
      <GlassPanel className="space-y-5 p-8 md:p-10">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-[#63eca9]/30 bg-[#63eca9]/10 text-2xl text-[#63eca9]">
          ◌
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-widest text-[#63eca9]/70">
            Coming soon
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-white">{title}</h1>
          <p className="mt-3 text-sm leading-relaxed text-white/60">{description}</p>
        </div>
        <Link
          href={backHref}
          className="inline-flex rounded-full border border-[#63eca9]/50 bg-[#63eca9]/10 px-5 py-2.5 text-sm font-medium text-[#63eca9] transition hover:bg-[#63eca9]/20"
        >
          {backLabel}
        </Link>
      </GlassPanel>
    </div>
  );
}
