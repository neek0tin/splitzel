import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Bypasses RLS entirely — the service-role key is never exposed to the client.
 * Only use this from trusted server contexts with no user session to act as,
 * like the PayMongo webhook route, which PayMongo's servers call directly.
 */
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
