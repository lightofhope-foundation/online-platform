import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminUserTiles } from "@/components/admin/AdminUserTiles";
import { UserAccessLevelSelect } from "@/components/admin/UserAccessLevelSelect";
import { ClientTherapistAssignment } from "@/components/admin/ClientTherapistAssignment";
import { fetchAccessLevelOptions } from "@/lib/accessLevels";
import { DisplayAliasEditor } from "@/components/admin/DisplayAliasEditor";
import {
  fetchClientTherapistMap,
  fetchTherapistOptions,
} from "@/lib/adminTherapistData";
import { formatGermanDateTime, isValidClientIdFormat, normalizeClientIdForUrl } from "@/lib/clientId";
import { formatProfileRole } from "@/lib/profileRole";
import { resolvePersonLabel } from "@/lib/formatDisplayName";

export const dynamic = "force-dynamic";

export default async function UserDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const clientId = normalizeClientIdForUrl(slug);

  if (!isValidClientIdFormat(clientId)) {
    notFound();
  }

  let admin;
  let profile: {
    user_id: string;
    role: string;
    created_at: string;
    first_name: string | null;
    last_name: string | null;
    client_id: string;
    access_level: number;
    display_alias: string | null;
  } | null = null;
  let authUser: { email?: string; last_sign_in_at?: string } | null = null;

  try {
    admin = getSupabaseAdminClient();

    const { data, error } = await admin
      .from("profiles")
      .select("user_id, role, created_at, first_name, last_name, client_id, access_level, display_alias")
      .eq("client_id", clientId)
      .maybeSingle();

    if (error || !data || !data.client_id) {
      notFound();
    }

    profile = {
      user_id: data.user_id,
      role: data.role,
      created_at: data.created_at,
      first_name: data.first_name,
      last_name: data.last_name,
      client_id: data.client_id,
      access_level: data.access_level ?? 0,
      display_alias: data.display_alias ?? null,
    };

    const { data: authUserRes } = await admin.auth.admin.getUserById(profile.user_id);
    authUser = authUserRes?.user ?? null;
  } catch (error) {
    console.error("Error loading user:", error);
    notFound();
  }

  if (!profile || !authUser) {
    notFound();
  }

  const accessLevels = await fetchAccessLevelOptions();
  const [therapists, therapistByClient] = await Promise.all([
    fetchTherapistOptions(admin),
    fetchClientTherapistMap(admin),
  ]);
  const assignment = therapistByClient.get(profile.user_id);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link href="/admin/users" className="text-sm text-[#63eca9] hover:underline">
            ← Zurück zu Nutzern
          </Link>
          <h1 className="mt-2 text-2xl font-semibold">
            {resolvePersonLabel(
              profile.first_name,
              profile.last_name,
              authUser.email,
              profile.display_alias
            )}
          </h1>
          <p className="mt-1 text-sm text-white/60">
            Nutzer-ID: <span className="font-mono text-white/80">{profile.client_id}</span>
          </p>
        </div>
      </div>

      <AdminUserTiles clientId={profile.client_id} role={profile.role} />

      {profile.role === "client" && (
        <div className="rounded-[20px] border border-white/10 bg-white/[0.02] p-6">
          <h2 className="mb-4 text-sm font-medium text-white/70">Therapeut</h2>
          <ClientTherapistAssignment
            clientUserId={profile.user_id}
            clientId={profile.client_id}
            currentTherapistUserId={assignment?.therapist_user_id ?? null}
            currentTherapistLabel={assignment?.label ?? null}
            therapists={therapists}
          />
        </div>
      )}

      {profile.role === "client" && (
        <div className="rounded-[20px] border border-white/10 bg-white/[0.02] p-6">
          <h2 className="mb-4 text-sm font-medium text-white/70">Zugangsstufe</h2>
          <UserAccessLevelSelect
            userId={profile.user_id}
            clientId={profile.client_id}
            currentLevel={profile.access_level}
            accessLevels={accessLevels}
          />
        </div>
      )}

      <div className="rounded-[20px] border border-white/10 bg-white/[0.02] p-6">
        <h2 className="mb-4 text-sm font-medium text-white/70">Anzeigename</h2>
        <DisplayAliasEditor
          userId={profile.user_id}
          firstName={profile.first_name}
          lastName={profile.last_name}
          email={authUser.email ?? null}
          currentAlias={profile.display_alias}
          revalidatePaths={[`/admin/users/${profile.client_id.toLowerCase()}`]}
        />
      </div>

      <div className="rounded-[20px] border border-white/10 bg-white/[0.02] p-6">
        <h2 className="mb-4 text-sm font-medium text-white/70">Kurzübersicht</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <p className="text-xs text-white/50">E-Mail</p>
            <p className="text-white">{authUser.email ?? "—"}</p>
          </div>
          <div>
            <p className="text-xs text-white/50">Rolle</p>
            <p className="text-white">{formatProfileRole(profile.role)}</p>
          </div>
          <div>
            <p className="text-xs text-white/50">Registriert</p>
            <p className="text-white">{formatGermanDateTime(profile.created_at)}</p>
          </div>
          <div>
            <p className="text-xs text-white/50">Letzter Login</p>
            <p className="text-white">{formatGermanDateTime(authUser.last_sign_in_at)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
