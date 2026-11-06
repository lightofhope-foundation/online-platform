import Link from "next/link";
import { SetterCreateClientForm } from "@/components/setter/SetterCreateClientForm";
import { checkSetterAccess } from "@/lib/checkSetterAccess";

export const dynamic = "force-dynamic";

export default async function SetterNewLeadPage() {
  await checkSetterAccess();

  return (
    <div className="space-y-6">
      <div>
        <Link href="/setter/leads" className="text-sm text-[#63eca9] hover:underline">
          ← Zurück zu Leads
        </Link>
        <h1 className="mt-2 text-2xl font-semibold">Neuen Lead anlegen</h1>
        <p className="mt-1 text-sm text-white/60">
          Noch kein Klient — Therapeut-Zuweisung erst nach Umwandlung durch den
          Erstgesprächler.
        </p>
      </div>
      <SetterCreateClientForm />
    </div>
  );
}
