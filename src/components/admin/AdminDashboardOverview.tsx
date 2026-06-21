import Link from "next/link";
import { DashboardQuickTile } from "@/components/dashboard/DashboardQuickTile";
import {
  CoursesManageIcon,
  FeedbackIcon,
  SettingsIcon,
  TherapyIcon,
  UsersIcon,
} from "@/components/icons/Icons";
import { resolvePersonLabel } from "@/lib/formatDisplayName";

export type AdminDashboardStats = {
  adminLabel: string;
  courseCount: number;
  userCount: number;
  clientCount: number;
  therapistCount: number;
  progressCount: number;
  courses: { id: string; title: string; slug: string }[];
};

export function AdminDashboardOverview({ stats }: { stats: AdminDashboardStats }) {
  return (
    <div className="space-y-10">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold text-[#63eca9] md:text-3xl">
          Willkommen zurück, {stats.adminLabel}
        </h1>
        <p className="max-w-3xl text-sm text-white/60">
          Dein Überblick über Kurse, Nutzer, Therapeuten und Plattform-Einstellungen —
          alle Bereiche erreichst du direkt von hier.
        </p>
      </header>

      <section className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
        <StatCard label="Kurse" value={stats.courseCount} />
        <StatCard label="Nutzer gesamt" value={stats.userCount} />
        <StatCard label="Klient:innen" value={stats.clientCount} />
        <StatCard label="Therapeuten" value={stats.therapistCount} />
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-medium text-white">Bereiche</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <DashboardQuickTile
            title="Kurse verwalten"
            subtitle="CMS & Videos"
            description="Kurse, Kapitel und Videos bearbeiten, veröffentlichen und sortieren."
            href="/admin/videos"
            stat={stats.courseCount}
            icon={<CoursesManageIcon size={20} />}
          />
          <DashboardQuickTile
            title="Nutzer"
            subtitle="Klient:innen & Fortschritt"
            description="Nutzerliste, Zugangsstufen, Video-Fortschritt und Klienten-Akten."
            href="/admin/users"
            stat={stats.clientCount}
            icon={<UsersIcon size={20} />}
          />
          <DashboardQuickTile
            title="Therapeuten"
            subtitle="Zuweisungen & Struktur"
            description="Therapeuten verwalten, Klient:innen zuweisen, Strukturbaum und Übersicht."
            href="/admin/therapists"
            stat={stats.therapistCount}
            icon={<TherapyIcon size={20} />}
          />
          <DashboardQuickTile
            title="Feedback"
            subtitle="Demnächst"
            description="Feedback und Kommunikation mit Klient:innen — wird ausgebaut."
            href="/admin/userfeedback"
            icon={<FeedbackIcon size={20} />}
          />
          <DashboardQuickTile
            title="Einstellungen"
            subtitle="Plattform-Richtlinien"
            description="Video-Freischaltung, Registrierung, Klienten-Stufen und Invite-Codes."
            href="/admin/einstellungen"
            icon={<SettingsIcon size={20} />}
          />
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-medium text-white">Schnellzugriff</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <QuickLink
            href="/admin/therapists/tree"
            title="Therapeuten — Strukturbaum"
          />
          <QuickLink
            href="/admin/therapists/board"
            title="Therapeuten — Übersicht"
          />
          <QuickLink
            href="/admin/einstellungen/videos"
            title="Videokurseinstellungen"
          />
          <QuickLink
            href="/admin/einstellungen/registrierung"
            title="Registrierung & Pflichtfelder"
          />
          <QuickLink href="/admin/einstellungen/levels" title="Klienten-Stufen" />
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-medium text-white">Aktuelle Kurse</h2>
          <span className="text-xs text-white/45">
            {stats.progressCount} Fortschritt-Einträge
          </span>
        </div>
        <div className="rounded-[16px] border border-white/10 divide-y divide-white/10 bg-black/30">
          {stats.courses.length === 0 ? (
            <div className="px-4 py-6 text-sm text-white/50">Noch keine Kurse.</div>
          ) : (
            stats.courses.map((c) => (
              <div
                key={c.id}
                className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
              >
                <div>
                  <div className="font-medium text-white">{c.title}</div>
                  <div className="text-xs text-white/50">{c.slug}</div>
                </div>
                <Link
                  href={`/admin/videos?${new URLSearchParams({ course: c.id }).toString()}`}
                  className="text-sm text-[#63eca9] hover:underline"
                >
                  Verwalten →
                </Link>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-[16px] border border-white/10 bg-black/40 px-4 py-3">
      <div className="text-xs text-white/50">{label}</div>
      <div className="mt-1 text-2xl font-semibold text-white">{value}</div>
    </div>
  );
}

function QuickLink({ href, title }: { href: string; title: string }) {
  return (
    <Link
      href={href}
      className="group flex items-center justify-between rounded-[14px] border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white/85 transition hover:border-[#63eca9]/40 hover:bg-white/[0.05]"
    >
      <span>{title}</span>
      <span className="text-[#63eca9]/70 transition group-hover:text-[#63eca9]">→</span>
    </Link>
  );
}

export function buildAdminDashboardLabel(
  firstName: string | null,
  lastName: string | null,
  email: string | null | undefined
) {
  const label = resolvePersonLabel(firstName, lastName, email ?? null, null);
  if (label !== "—") return label.split(" ")[0] ?? label;
  return email?.split("@")[0] ?? "Admin";
}
