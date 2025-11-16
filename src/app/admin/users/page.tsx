import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AdminUsers() {
  // Use the Service Role client so admin can see all users, bypassing RLS.
  const admin = getSupabaseAdminClient();

  const { data: profiles } = await admin
    .from("profiles")
    .select("user_id, role, created_at, updated_at")
    .order("created_at", { ascending: false });

  // Fetch auth users via Admin API to augment emails and last sign in times
  // We’ll load up to 1k and map by id. Adjust as needed later with filters/pagination.
  const { data: authUsersRes } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  const authUsers = authUsersRes?.users ?? [];
  const authById = new Map(authUsers.map((u) => [u.id, u]));

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Users & Progress</h1>
        <Link href="/admin" className="text-sm text-[#63eca9] hover:underline">
          Back to Dashboard
        </Link>
      </div>

      <div className="rounded-lg border border-white/10 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-white/5 text-left">
            <tr>
              <th className="px-3 py-2">Email</th>
              <th className="px-3 py-2">User ID</th>
              <th className="px-3 py-2">Role</th>
              <th className="px-3 py-2">Last Sign-In</th>
              <th className="px-3 py-2">Created</th>
              <th className="px-3 py-2">Updated</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {(profiles ?? []).map((p) => {
              const au = authById.get(p.user_id);
              return (
                <tr key={p.user_id}>
                  <td className="px-3 py-2">{au?.email ?? "—"}</td>
                  <td className="px-3 py-2">{p.user_id}</td>
                  <td className="px-3 py-2">{p.role}</td>
                  <td className="px-3 py-2">
                    {au?.last_sign_in_at ? new Date(au.last_sign_in_at).toLocaleString() : "—"}
                  </td>
                  <td className="px-3 py-2">{new Date(p.created_at).toLocaleString()}</td>
                  <td className="px-3 py-2">{new Date(p.updated_at).toLocaleString()}</td>
                </tr>
              );
            })}
            {(!profiles || profiles.length === 0) && (
              <tr>
                <td colSpan={6} className="px-3 py-6 text-center text-white/60">
                  No users found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}


