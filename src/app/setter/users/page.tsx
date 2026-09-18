import Link from "next/link";
import { AdminUsersTable, type AdminUserRow } from "@/components/admin/AdminUsersTable";
import { NotionOpenLeadsList } from "@/components/setter/NotionOpenLeadsList";
import { checkSetterAccess } from "@/lib/checkSetterAccess";
import { fetchAccessLevelOptions } from "@/lib/accessLevels";
import { formatGermanDateTime } from "@/lib/clientId";
import {
  fetchMetaLeads,
  isUntouchedMetaLead,
} from "@/lib/notion/metaLeads";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function formatFullName(firstName: string | null, lastName: string | null): string {
  const first = firstName?.trim() ?? "";
  const last = lastName?.trim() ?? "";
  if (!first && !last) return "—";
  return `${first} ${last}`.trim();
}

/**
 * Offene Leads = (1) unberührte Notion Meta-Leads + (2) LOH-Klienten ohne Therapeut.
 * Notion-Kontakte werden nicht als Auth-User angelegt — nur gelesen.
 */
export default async function SetterUsersPage() {
  const { supabase } = await checkSetterAccess();
  const accessLevels = await fetchAccessLevelOptions();

  const { leads: notionLeads, error: notionError } = await fetchMetaLeads("all");
  const untouchedNotion = notionLeads.filter(isUntouchedMetaLead);

  const { data: profiles } = await supabase
    .from("profiles")
    .select("user_id, role, created_at, first_name, last_name, client_id, access_level")
    .eq("role", "client")
    .order("created_at", { ascending: false });

  const clientProfiles = profiles ?? [];
  const userIds = clientProfiles.map((p) => p.user_id);

  const assignedIds = new Set<string>();
  if (userIds.length > 0) {
    const { data: clients } = await supabase
      .from("clients")
      .select("user_id, therapist_user_id")
      .in("user_id", userIds)
      .is("deleted_at", null);

    for (const c of clients ?? []) {
      if (c.therapist_user_id) assignedIds.add(c.user_id);
    }
  }

  const unassigned = clientProfiles.filter((p) => !assignedIds.has(p.user_id));

  const { data: authUsersRes } = await supabase.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });
  const authById = new Map((authUsersRes?.users ?? []).map((u) => [u.id, u]));

  const rows: AdminUserRow[] = unassigned.map((p) => {
    const au = authById.get(p.user_id);
    const detailHref = p.client_id
      ? `/setter/users/${p.client_id.toLowerCase()}`
      : null;
    return {
      user_id: p.user_id,
      client_id: p.client_id,
      email: au?.email ?? "—",
      name: formatFullName(p.first_name, p.last_name),
      role: p.role,
      access_level: p.access_level ?? 0,
      video_progress: null,
      therapist_label: "— noch nicht zugeordnet —",
      therapist_href: null,
      created_at: formatGermanDateTime(p.created_at),
      last_login: formatGermanDateTime(au?.last_sign_in_at),
      detail_href: detailHref,
    };
  });

  return (
    <div className="space-y-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href="/setter" className="text-sm text-[#63eca9] hover:underline">
            ← Überblick
          </Link>
          <h1 className="mt-2 typo-page-title font-semibold">Offene Leads</h1>
          <p className="mt-1 max-w-2xl text-sm text-white/55">
            Unberührte Notion-Kontakte (kein Setter/EG, Status „Neuer Kontakt“) plus
            LOH-Klienten ohne Therapeut. Klick auf Notion-Zeile → Kundenkarte.
          </p>
        </div>
        <Link
          href="/setter/users/new"
          className="rounded-full bg-[#63eca9] px-5 py-2 text-sm font-medium text-black"
        >
          Neuer Klient
        </Link>
      </div>

      <section className="space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="text-lg font-medium text-white">
              Notion · unberührt
            </h2>
            <p className="text-sm text-white/45">
              Pipeline Pro / Meta — nur Lesen
            </p>
          </div>
          <Link
            href="/setter/leadboard"
            className="text-sm text-[#63eca9] hover:underline"
          >
            Zum Leadboard →
          </Link>
        </div>
        {notionError ? (
          <div className="rounded-2xl border border-amber-400/30 bg-amber-400/10 px-5 py-4 text-sm text-amber-100">
            {notionError}
          </div>
        ) : untouchedNotion.length === 0 ? (
          <p className="rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-8 text-center text-sm text-white/50">
            Keine unberührten Notion-Leads (alle haben Setter/EG oder sind weiter im Funnel).
          </p>
        ) : (
          <NotionOpenLeadsList leads={untouchedNotion} />
        )}
      </section>

      <section className="space-y-3">
        <div>
          <h2 className="text-lg font-medium text-white">LOH · ohne Therapeut</h2>
          <p className="text-sm text-white/45">
            Plattform-Accounts — Akte pflegen und Therapeut zuweisen
          </p>
        </div>
        {rows.length === 0 ? (
          <div className="space-y-3 rounded-2xl border border-white/10 bg-white/[0.03] p-8 text-center">
            <p className="text-sm text-white/60">
              Keine offenen LOH-Leads — alle Plattform-Klienten haben bereits einen
              Therapeuten.
            </p>
            <Link
              href="/setter/users/new"
              className="inline-flex rounded-full bg-[#63eca9] px-5 py-2 text-sm font-medium text-black"
            >
              Neuen Klienten anlegen
            </Link>
          </div>
        ) : (
          <AdminUsersTable rows={rows} accessLevels={accessLevels} />
        )}
      </section>
    </div>
  );
}
