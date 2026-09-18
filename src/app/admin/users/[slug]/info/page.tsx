import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { LeadDetailCards } from "@/components/lead-vault/LeadDetailCards";
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";
import {
  isValidClientIdFormat,
  normalizeClientIdForUrl,
} from "@/lib/clientId";
import { parseIntake } from "@/lib/leadVault";
import { resolvePersonLabel } from "@/lib/formatDisplayName";

export const dynamic = "force-dynamic";

export default async function AdminUserInfoPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const clientId = normalizeClientIdForUrl(slug);
  if (!isValidClientIdFormat(clientId)) notFound();

  const admin = getSupabaseAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("user_id, role, first_name, last_name, client_id, display_alias")
    .eq("client_id", clientId)
    .maybeSingle();

  if (!profile?.client_id) notFound();
  if (profile.role !== "client") redirect(`/admin/users/${clientId}`);

  const { data: authUserRes } = await admin.auth.admin.getUserById(profile.user_id);
  const { data: clientRow } = await admin
    .from("clients")
    .select("intake_data, access_revoked")
    .eq("user_id", profile.user_id)
    .maybeSingle();

  const intake = parseIntake(clientRow?.intake_data);
  if (!intake.email && authUserRes?.user?.email) {
    intake.email = authUserRes.user.email;
  }

  const label = resolvePersonLabel(
    profile.first_name,
    profile.last_name,
    authUserRes?.user?.email,
    profile.display_alias
  );

  return (
    <div className="space-y-6">
      <Link
        href={`/admin/users/${profile.client_id.toLowerCase()}`}
        className="text-sm text-[#63eca9] hover:underline"
      >
        ← Zurück zu {label}
      </Link>

      <LeadDetailCards
        name={label}
        clientId={profile.client_id}
        accessRevoked={clientRow?.access_revoked ?? false}
        intake={intake}
        eyebrow="Informationen"
        editable
        saveVia="admin"
      />
    </div>
  );
}
