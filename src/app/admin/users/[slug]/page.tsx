import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";
import Link from "next/link";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

// Helper to extract user ID from slug (last 3 characters)
function extractUserIdFromSlug(slug: string): string | null {
  // Slug format: firstname-lastname-abc (last 3 chars are user ID suffix)
  // We need to find the user by matching the last 3 chars
  const parts = slug.split("-");
  if (parts.length < 1) return null;
  const lastThree = parts[parts.length - 1];
  if (lastThree.length !== 3) return null;
  
  // We'll search for users whose ID ends with these 3 chars
  return lastThree;
}

export default async function UserDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const userIdSuffix = extractUserIdFromSlug(slug);
  
  if (!userIdSuffix) {
    notFound();
  }

  let admin;
  let profile = null;
  let authUser = null;
  
  try {
    admin = getSupabaseAdminClient();

    // Find profile by matching user_id suffix
    const { data: profiles } = await admin
      .from("profiles")
      .select("user_id, role, created_at, first_name, last_name")
      .ilike("user_id", `%${userIdSuffix}`);
    
    if (!profiles || profiles.length === 0) {
      notFound();
    }
    
    // If multiple matches, prefer exact match or first one
    profile = profiles.find(p => p.user_id.endsWith(userIdSuffix)) || profiles[0];
    
    // Get auth user details
    const { data: authUserRes } = await admin.auth.admin.getUserById(profile.user_id);
    authUser = authUserRes?.user ?? null;
  } catch (error) {
    console.error("Error loading user:", error);
    notFound();
  }

  if (!profile || !authUser) {
    notFound();
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/admin/users" className="text-sm text-[#63eca9] hover:underline mb-2 inline-block">
            ← Zurück zu Nutzern
          </Link>
          <h1 className="text-2xl font-semibold mt-2">
            {profile.first_name || profile.last_name 
              ? `${profile.first_name ?? ""} ${profile.last_name ?? ""}`.trim()
              : authUser.email}
          </h1>
        </div>
      </div>

      <div className="rounded-lg border border-white/10 p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-sm text-white/60 mb-1">Email</h3>
            <p className="text-white">{authUser.email ?? "—"}</p>
          </div>
          <div>
            <h3 className="text-sm text-white/60 mb-1">Rolle</h3>
            <p className="text-white">{profile.role}</p>
          </div>
          <div>
            <h3 className="text-sm text-white/60 mb-1">Vorname</h3>
            <p className="text-white">{profile.first_name ?? "—"}</p>
          </div>
          <div>
            <h3 className="text-sm text-white/60 mb-1">Nachname</h3>
            <p className="text-white">{profile.last_name ?? "—"}</p>
          </div>
          <div>
            <h3 className="text-sm text-white/60 mb-1">Erstellt</h3>
            <p className="text-white">{new Date(profile.created_at).toLocaleString()}</p>
          </div>
          <div>
            <h3 className="text-sm text-white/60 mb-1">Letzter Login</h3>
            <p className="text-white">
              {authUser.last_sign_in_at ? new Date(authUser.last_sign_in_at).toLocaleString() : "—"}
            </p>
          </div>
        </div>
      </div>

      {/* TODO: Add user progress, video completions, etc. here */}
    </div>
  );
}







