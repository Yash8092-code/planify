import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

// POST /api/auth/signout — Sign out current user and clear cookies
export async function POST() {
  try {
    const supabase = await createServerClient();
    await supabase.auth.signOut();
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Signout error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
