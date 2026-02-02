"use server";

import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";

/**
 * One-time password reset for admin account.
 * This should be removed after use for security.
 */
export async function resetAdminPassword() {
  const admin = getSupabaseAdminClient();
  
  const { data, error } = await admin.auth.admin.updateUserById(
    "ebc7744d-041d-459f-8b31-a5144a3e8aca",
    { password: "Hallo123!" }
  );
  
  if (error) {
    console.error("Password reset error:", error);
    return { success: false, error: error.message };
  }
  
  return { success: true, data };
}
