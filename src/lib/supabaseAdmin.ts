import { createClient } from "@supabase/supabase-js";

// Server-only Service Role client.
// DO NOT import this in any client components.
export function getSupabaseAdminClient() {
	const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
	const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
	return createClient(url, serviceKey, {
		auth: { persistSession: false, autoRefreshToken: false },
	});
}


