import { LightRays } from "@/components/LightRays";

export default function Home() {
  return (
    <main className="min-h-[100dvh] bg-[--bg] text-neutral-200">
      <div className="mx-auto max-w-7xl px-6 py-10">
        <div className="rounded-[28px] border border-white/10 bg-white/[0.02] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.03)] backdrop-blur-sm">
          <div className="px-6 py-8 text-center">
            <h1 className="text-3xl md:text-5xl font-semibold tracking-tight">Startseite</h1>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
          <aside className="rounded-[24px] border border-white/10 bg-white/[0.02] p-6">
            <nav className="space-y-5">
              {[
                "Startseite",
                "Video-Section",
                "Sitzungsaufnahmen",
                "Selbstcheck",
                "Feedback",
                "1:1 Therapie",
                "Einstellungen",
                "Ausloggen",
              ].map((item, idx) => (
                <a
                  key={idx}
                  href="#"
                  className={`block rounded-full border border-white/10 px-5 py-3 text-lg transition-colors hover:bg-white/[0.04] ${
                    idx === 0 ? "bg-white/[0.04]" : ""
                  }`}
                >
                  {item}
                </a>
              ))}
            </nav>
          </aside>

          <section className="relative rounded-[24px] border border-white/10 bg-white/[0.02] p-6 overflow-hidden">
            {/* light rays accent */}
            <div className="pointer-events-none absolute inset-x-0 -top-6 h-40">
              <LightRays className="h-full w-full" raysOrigin="top-center" raysColor="#a445ff" rayLength={2.5} lightSpread={0.8} noiseAmount={0.1} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {["Insights", "Overview", "Teamwork", "Efficiency", "Connectivity", "Protection"].map(
                (card, i) => (
                  <div
                    key={i}
                    className="relative rounded-[20px] border border-white/10 bg-black/40 p-5 min-h-40 shadow-[0_0_30px_rgba(164,69,255,0.2)]"
                  >
                    <div className="text-sm text-white/60">{card}</div>
                    <div className="mt-12 h-2 w-20 rounded-full bg-fuchsia-500/60"></div>
                  </div>
                )
              )}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
