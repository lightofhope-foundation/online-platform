import LightRays from "@/components/LightRays";

export default function Home() {
  return (
    <>
      {/* Full page light rays background */}
      <div className="page-light-rays">
        <LightRays 
          className="h-full w-full" 
          raysOrigin="top-center" 
          raysColor="#53e0b6" 
          rayLength={2.5} 
          lightSpread={0.8} 
          noiseAmount={0.1}
          pulsating={true}
          raysSpeed={1.2}
          followMouse={true}
          mouseInfluence={0.15}
          distortion={0.05}
        />
      </div>

      {/* Main content */}
      <main className="relative z-10 min-h-screen bg-black text-white">
        <div className="mx-auto max-w-7xl px-6 py-10">
          {/* Header */}
          <div className="mb-12 text-center">
            <div className="inline-block rounded-[28px] border border-white/10 bg-white/[0.02] px-8 py-6 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.03)] backdrop-blur-sm">
              <h1 className="text-4xl md:text-6xl font-bold tracking-tight bg-gradient-to-r from-white via-purple-200 to-purple-400 bg-clip-text text-transparent">
                Startseite
              </h1>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-8">
            {/* Sidebar */}
            <aside className="rounded-[24px] border border-white/10 bg-white/[0.02] p-6 backdrop-blur-sm">
              <nav className="space-y-4">
                {[
                  { name: "Startseite", icon: "🏠" },
                  { name: "Video-Section", icon: "🎥" },
                  { name: "Sitzungsaufnahmen", icon: "📝" },
                  { name: "Selbstcheck", icon: "✅" },
                  { name: "Feedback", icon: "💬" },
                  { name: "1:1 Therapie", icon: "👥" },
                  { name: "Einstellungen", icon: "⚙️" },
                  { name: "Ausloggen", icon: "🚪" },
                ].map((item, idx) => (
                  <a
                    key={idx}
                    href="#"
                    className={`flex items-center gap-3 rounded-full border border-white/10 px-5 py-3 text-lg transition-all hover:bg-white/[0.08] hover:border-purple-400/50 hover:shadow-[0_0_20px_rgba(164,69,255,0.3)] ${
                      idx === 0 
                        ? "bg-gradient-to-r from-purple-500/20 to-purple-600/20 border-purple-400/50 shadow-[0_0_20px_rgba(164,69,255,0.4)]" 
                        : ""
                    }`}
                  >
                    <span className="text-xl">{item.icon}</span>
                    {item.name}
                  </a>
                ))}
              </nav>
            </aside>

            {/* Dashboard */}
            <section className="rounded-[24px] border border-white/10 bg-white/[0.02] p-8 backdrop-blur-sm">
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {[
                  { title: "Insights", subtitle: "Analytics", icon: "📊", color: "from-blue-500 to-cyan-500" },
                  { title: "Overview", subtitle: "Dashboard", icon: "🎯", color: "from-purple-500 to-pink-500" },
                  { title: "Teamwork", subtitle: "Collaboration", icon: "🤝", color: "from-green-500 to-emerald-500" },
                  { title: "Efficiency", subtitle: "Automation", icon: "⚡", color: "from-yellow-500 to-orange-500" },
                  { title: "Connectivity", subtitle: "Integration", icon: "🔗", color: "from-indigo-500 to-purple-500" },
                  { title: "Protection", subtitle: "Security", icon: "🛡️", color: "from-red-500 to-pink-500" },
                ].map((card, i) => (
                  <div
                    key={i}
                    className="group relative rounded-[20px] border border-white/10 bg-black/60 p-6 min-h-48 transition-all hover:scale-105 hover:border-purple-400/50 hover:shadow-[0_0_30px_rgba(164,69,255,0.3)]"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="text-2xl">{card.icon}</div>
                      <div className="h-2 w-8 rounded-full bg-gradient-to-r from-purple-400 to-purple-600 opacity-60"></div>
                    </div>
                    <h3 className="text-xl font-semibold mb-2">{card.title}</h3>
                    <p className="text-white/60 text-sm">{card.subtitle}</p>
                    
                    {/* Hover effect */}
                    <div className="absolute inset-0 rounded-[20px] bg-gradient-to-br opacity-0 group-hover:opacity-10 transition-opacity duration-300 ${card.color}"></div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      </main>
    </>
  );
}
