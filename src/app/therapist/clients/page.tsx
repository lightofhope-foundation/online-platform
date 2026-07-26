import Link from "next/link";
import { TherapistClientsBoard } from "@/components/therapist/TherapistClientsBoard";
import { checkTherapistAccess } from "@/lib/authRoles";
import { loadTherapistClientBoard } from "@/lib/therapistClients";

export const dynamic = "force-dynamic";

export default async function TherapistClientsPage() {
  const { user, supabase } = await checkTherapistAccess();
  const { active, archived } = await loadTherapistClientBoard(supabase, user.id);

  return (
    <div className="space-y-6">
      <Link href="/therapist" className="text-sm text-[#63eca9] hover:underline">
        ← Überblick
      </Link>
      <TherapistClientsBoard active={active} archived={archived} />
    </div>
  );
}
