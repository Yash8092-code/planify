import { createServerClient as createSsrClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createClient as createSupabaseClient, User } from "@supabase/supabase-js";

// ============================================================
// Planify — Supabase Server Client & Auth Helpers
// ============================================================

/**
 * Creates an authenticated Supabase client for Server Components,
 * Server Actions, and Route Handlers using cookie-based auth tokens.
 */
export async function createServerClient() {
  const cookieStore = await cookies();

  return createSsrClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Can be ignored if called from a read-only Server Component
          }
        },
      },
    }
  );
}

/**
 * Creates an admin Supabase client using SUPABASE_SERVICE_ROLE_KEY.
 * Bypasses Row Level Security (RLS).
 * USE ONLY FOR CRON JOBS, BACKGROUND WORKERS, AND SECURE ADMIN OPERATIONS.
 * NEVER EXPOSE TO FRONTEND.
 */
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}

/**
 * Retrieves and validates the currently authenticated Supabase user from the request.
 * Returns the User object or null if unauthenticated.
 */
export async function getAuthenticatedUser(): Promise<User | null> {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return null;
    }

    return user;
  } catch (err) {
    console.error("getAuthenticatedUser error:", err);
    return null;
  }
}
