import { AdminSettingsTiles } from "@/components/admin/AdminSettingsTiles";
import { RegistrationInvitePanel } from "@/components/admin/RegistrationInvitePanel";
import { checkAdminAccess } from "@/lib/checkAdminAccess";

export const dynamic = "force-dynamic";

export default async function AdminEinstellungenPage() {
  const { supabase } = await checkAdminAccess();
  await supabase.rpc("ensure_registration_invite_row");

  const { data: row } = await supabase
    .from("platform_registration_invite")
    .select("current_code, updated_at")
    .eq("id", 1)
    .maybeSingle();

  const code = row?.current_code ?? "—";
  const updatedAt = row?.updated_at ?? null;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-white">Einstellungen</h1>
        <p className="mt-1 text-sm text-white/60">
          Plattform-Richtlinien für Videos, Registrierung und Klienten-Stufen.
        </p>
      </div>
      <AdminSettingsTiles />
      <RegistrationInvitePanel initialCode={code} initialUpdatedAt={updatedAt} />
    </div>
  );
}
