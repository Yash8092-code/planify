import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { sendWelcomeEmail } from "@/lib/email";
import { Profile } from "@/lib/types";

// GET /api/profile — Fetch the single user profile
export async function GET() {
  try {
    const supabase = createServerClient();
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .limit(1)
      .single();

    if (error) {
      // PGRST116 = no rows found — means no profile yet
      if (error.code === "PGRST116") {
        return NextResponse.json({ data: null }, { status: 200 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (err) {
    console.error("Profile GET error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/profile — Create user profile (first-time onboarding)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, timezone } = body;

    // Validation
    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }
    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json({ error: "Valid email is required" }, { status: 400 });
    }

    const supabase = createServerClient();

    // Check if profile already exists
    const { data: existing } = await supabase
      .from("profiles")
      .select("id")
      .limit(1)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: "Profile already exists. Use PATCH to update." },
        { status: 409 }
      );
    }

    const { data, error } = await supabase
      .from("profiles")
      .insert({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        timezone: timezone || "UTC",
        email_notifications: true,
        theme: "system",
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Send welcome email in the background (non-blocking)
    sendWelcomeEmail(data as Profile).catch((err) =>
      console.error("Welcome email background error:", err)
    );

    return NextResponse.json({ data }, { status: 201 });
  } catch (err) {
    console.error("Profile POST error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PATCH /api/profile — Update user profile
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const supabase = createServerClient();

    // Get existing profile
    const { data: existing, error: fetchError } = await supabase
      .from("profiles")
      .select("id")
      .limit(1)
      .single();

    if (fetchError || !existing) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    // Build update object — only include provided fields
    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };

    if (body.name !== undefined) {
      if (typeof body.name !== "string" || body.name.trim().length === 0) {
        return NextResponse.json({ error: "Name cannot be empty" }, { status: 400 });
      }
      updates.name = body.name.trim();
    }
    if (body.email !== undefined) {
      if (typeof body.email !== "string" || !body.email.includes("@")) {
        return NextResponse.json({ error: "Valid email is required" }, { status: 400 });
      }
      updates.email = body.email.trim().toLowerCase();
    }
    if (body.timezone !== undefined) updates.timezone = body.timezone;
    if (body.email_notifications !== undefined) updates.email_notifications = body.email_notifications;
    if (body.theme !== undefined) updates.theme = body.theme;

    const { data, error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", existing.id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (err) {
    console.error("Profile PATCH error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/profile — Reset profile (with cascade deletes via DB)
export async function DELETE() {
  try {
    const supabase = createServerClient();

    const { data: existing, error: fetchError } = await supabase
      .from("profiles")
      .select("id")
      .limit(1)
      .single();

    if (fetchError || !existing) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    // Delete profile (cascade will remove tasks, notes, documents, etc.)
    const { error } = await supabase
      .from("profiles")
      .delete()
      .eq("id", existing.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data: { success: true } });
  } catch (err) {
    console.error("Profile DELETE error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
