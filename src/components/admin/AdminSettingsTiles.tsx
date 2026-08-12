"use client";

import { MagicBentoTileGrid } from "@/components/dashboard/MagicBentoTileGrid";
import { TherapyIcon, VideosIcon, UsersIcon, SettingsIcon } from "@/components/icons/Icons";

export function AdminSettingsTiles() {
  const base = "/admin/einstellungen";
  const tiles = [
    {
      key: "profil",
      title: "Mein Profil",
      description: "Anzeigename, Handynummer, E-Mail und Passwort für Ihr Admin-Konto.",
      href: `${base}/profil`,
      icon: <UsersIcon size={24} />,
    },
    {
      key: "videos",
      title: "Videokurseinstellungen",
      description:
        "Standard-Freischaltung für alle Klienten, Stufe 0–5 und Einzelpersonen.",
      href: `${base}/videos`,
      icon: <VideosIcon size={24} />,
    },
    {
      key: "registrierung",
      title: "Nutzereinstellungen",
      description: "Pflichtfelder und zusätzliche Angaben bei der Registrierung.",
      href: `${base}/registrierung`,
      icon: <UsersIcon size={24} />,
    },
    {
      key: "therapie",
      title: "Therapie & Sitzungsakte",
      description: "Anzahl Standard-Sitzungen pro Klient (z. B. 18).",
      href: `${base}/therapie`,
      icon: <TherapyIcon size={24} />,
    },
    {
      key: "schriftarten",
      title: "Schriftarten",
      description:
        "Große Überschriften, Abschnitte, Fließtext und Menü — LoH-Website-Fonts oder Default.",
      href: `${base}/schriftarten`,
      icon: <SettingsIcon size={24} />,
    },
    {
      key: "levels",
      title: "Klienten-Stufen",
      description: "Bedeutung der Zugangsstufen 0–5 (Stufe 0 = Standard).",
      href: `${base}/levels`,
      icon: <SettingsIcon size={24} />,
    },
  ];

  return <MagicBentoTileGrid columns={3} tiles={tiles} />;
}
