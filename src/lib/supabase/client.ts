import { createBrowserClient } from "@supabase/ssr";

// ============================================================
// Planify — Supabase Client Configuration
// ============================================================

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
