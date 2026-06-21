"use client";

import Link from "next/link";

type TherapistViewTabsProps = {
  active: "list" | "tree" | "board";
};

export function TherapistViewTabs({ active }: TherapistViewTabsProps) {
  const tabs = [
    { id: "list" as const, label: "Liste", href: "/admin/therapists" },
    { id: "tree" as const, label: "Strukturbaum", href: "/admin/therapists/tree" },
    { id: "board" as const, label: "Übersicht (3)", href: "/admin/therapists/board" },
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {tabs.map((tab) => (
        <Link
          key={tab.id}
          href={tab.href}
          className={`rounded-full border px-4 py-2 text-sm transition ${
            active === tab.id
              ? "border-[#63eca9]/50 bg-[#63eca9]/15 text-[#63eca9]"
              : "border-white/15 text-white/70 hover:border-white/25"
          }`}
        >
          {tab.label}
        </Link>
      ))}
    </div>
  );
}
