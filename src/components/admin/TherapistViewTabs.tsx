"use client";

type TherapistViewTabsProps = {
  active: "list" | "tree" | "board";
};

export function TherapistViewTabs({ active }: TherapistViewTabsProps) {
  const tabs = [
    { id: "list" as const, label: "Liste", href: "/admin/therapists", enabled: true },
    { id: "tree" as const, label: "Strukturbaum", href: "#", enabled: false },
    { id: "board" as const, label: "Übersicht (3)", href: "#", enabled: false },
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {tabs.map((tab) =>
        tab.enabled ? (
          <a
            key={tab.id}
            href={tab.href}
            className={`rounded-full border px-4 py-2 text-sm transition ${
              active === tab.id
                ? "border-[#63eca9]/50 bg-[#63eca9]/15 text-[#63eca9]"
                : "border-white/15 text-white/70 hover:border-white/25"
            }`}
          >
            {tab.label}
          </a>
        ) : (
          <span
            key={tab.id}
            className="cursor-not-allowed rounded-full border border-white/10 px-4 py-2 text-sm text-white/35"
            title="Phase T1 — demnächst"
          >
            {tab.label}
          </span>
        )
      )}
    </div>
  );
}
