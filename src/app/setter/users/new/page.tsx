import Link from "next/link";
import { SetterCreateClientForm } from "@/components/setter/SetterCreateClientForm";
import { checkSetterAccess } from "@/lib/checkSetterAccess";
import { fetchTherapistOptions } from "@/lib/adminTherapistData";

export const dynamic = "force-dynamic";

export default async function SetterNewClientPage() {
  const { supabase } = await checkSetterAccess();
  const therapists = await fetchTherapistOptions(supabase);

  return (
    <div className="space-y-6">
      <div>
        <Link href="/setter/users" className="text-sm text-[#63eca9] hover:underline">
          ← Zurück zur Liste
        </Link>
        <h1 className="mt-2 text-2xl font-semibold">Neuen Klienten anlegen</h1>
        <p className="mt-1 text-sm text-white/60">
          Lead für die Setter-Pipeline — ohne Therapeut bleibt er unter „Offene Leads“.
        </p>
      </div>
      <SetterCreateClientForm therapists={therapists} />
    </div>
  );
}
