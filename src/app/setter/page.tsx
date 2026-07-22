import Link from "next/link";
import { checkSetterAccess } from "@/lib/checkSetterAccess";

export const dynamic = "force-dynamic";

export default async function SetterHomePage() {
  await checkSetterAccess();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white">Setter & Closer</h1>
        <p className="mt-1 text-sm text-white/60">
          Leads anlegen, Erstgespräch dokumentieren und Therapeuten zuweisen.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Link
          href="/setter/users"
          className="rounded-[20px] border border-white/15 bg-white/[0.03] p-6 hover:border-[#63eca9]/30"
        >
          <h2 className="font-medium text-white">Alle Klient:innen</h2>
          <p className="mt-1 text-sm text-white/55">Nutzerliste und Klienten-Akten</p>
        </Link>
        <Link
          href="/setter/users/new"
          className="rounded-[20px] border border-white/15 bg-white/[0.03] p-6 hover:border-[#63eca9]/30"
        >
          <h2 className="font-medium text-white">Neuer Klient</h2>
          <p className="mt-1 text-sm text-white/55">Nach dem Erstgespräch anlegen</p>
        </Link>
      </div>
    </div>
  );
}
