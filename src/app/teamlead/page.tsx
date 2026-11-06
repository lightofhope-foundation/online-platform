import Link from "next/link";
import { getAuthUserFromCookie } from "@/lib/supabaseServer";
import { getUserPortalRoles } from "@/lib/userRoles";

export const dynamic = "force-dynamic";

export default async function TeamleadHomePage() {
  const user = await getAuthUserFromCookie();
  const roles = user ? await getUserPortalRoles(user.id) : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="typo-section font-normal text-white">Teamleitung</h1>
        <p className="mt-1 max-w-2xl text-sm text-white/60">
          Soft-Release: gleicher Arbeitsfluss wie Setter/EG — Klienten und Leads ohne
          Notion-Pull. Kennzahlen-Funnel folgt später.
        </p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-4 text-sm text-white/70">
        <div className="text-white/45">Aktive Rollen dieses Kontos</div>
        <div className="mt-1">{roles.join(", ") || "—"}</div>
      </div>

      <div className="flex flex-wrap gap-3">
        <Link
          href="/teamlead/clients"
          className="rounded-xl border border-white/15 bg-white/[0.04] px-4 py-3 text-sm text-[#63eca9] hover:bg-white/[0.07]"
        >
          Klienten
        </Link>
        <Link
          href="/teamlead/leads"
          className="rounded-xl border border-white/15 bg-white/[0.04] px-4 py-3 text-sm text-[#63eca9] hover:bg-white/[0.07]"
        >
          Leads
        </Link>
        <Link
          href="/teamlead/my-clients"
          className="rounded-xl border border-white/15 bg-white/[0.04] px-4 py-3 text-sm text-white/80 hover:bg-white/[0.07]"
        >
          Meine Klienten
        </Link>
      </div>
    </div>
  );
}
