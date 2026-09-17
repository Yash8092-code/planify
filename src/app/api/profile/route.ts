import { NextResponse } from "next/server";
import { createServerClient, createAdminClient, getAuthenticatedUser } from "@/lib/supabase/server";
import { sendWelcomeEmail } from "@/lib/email";
import { Profile } from "@/lib/types";

// GET /api/profile — Fetch current authenticated user profile
export async function GET() {
  try {
    const user = await getAuthenticatedUser();

    if (!user) {
      return NextResponse.json({ data: null }, { status: 200 });
    }

    const admin = createAdminClient();
    const { data: profile, error } = await admin
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data: profile });
  } catch (err) {
    console.error("Profile GET error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/profile — Create user profile
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

    const cleanEmail = email.trim().toLowerCase();
    const user = await getAuthenticatedUser();
    const admin = createAdminClient();

    let targetUserId = user?.id;

    // If no session exists yet, create auth user
    if (!targetUserId) {
      const { data: authUser, error: authError } = await admin.auth.admin.createUser({
        email: cleanEmail,
        email_confirm: true,
        user_metadata: { name: name.trim() },
      });

      if (authError && !authError.message.includes("already registered")) {
        return NextResponse.json({ error: authError.message }, { status: 400 });
      }

      targetUserId = authUser?.user?.id;

      if (!targetUserId) {
        // Look up by email
        const { data: existingProf } = await admin
          .from("profiles")
          .select("id")
          .eq("email", cleanEmail)
          .maybeSingle();
        targetUserId = existingProf?.id;
      }
    }

    if (!targetUserId) {
      return NextResponse.json({ error: "Unable to establish user identity" }, { status: 500 });
    }

    // Check if profile already exists for this ID
    const { data: existing } = await admin
      .from("profiles")
      .select("id")
      .eq("id", targetUserId)
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { error: "Profile already exists. Use PATCH to update." },
        { status: 409 }
      );
    }

    const { data, error } = await admin
      .from("profiles")
      .insert({
        id: targetUserId,
        name: name.trim(),
        email: cleanEmail,
        timezone: timezone || "Asia/Kolkata",
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

// PATCH /api/profile — Update current authenticated user profile
export async function PATCH(request: Request) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const admin = createAdminClient();

    // Verify profile belongs to authenticated user
    const { data: existing, error: fetchError } = await admin
      .from("profiles")
      .select("id")
      .eq("id", user.id)
      .maybeSingle();

    if (fetchError || !existing) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

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
    if (body.timezone !== undefined) updates.timezone = body.timezone || "Asia/Kolkata";
    if (body.email_notifications !== undefined) updates.email_notifications = body.email_notifications;
    if (body.theme !== undefined) updates.theme = body.theme;

    const { data, error } = await admin
      .from("profiles")
      .update(updates)
      .eq("id", user.id)
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

// DELETE /api/profile — Delete current user profile & data
export async function DELETE() {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = createAdminClient();

    // Delete profile (cascades to tasks, notes, documents, etc. in DB)
    const { error } = await admin
      .from("profiles")
      .delete()
      .eq("id", user.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Sign out user session
    const supabase = await createServerClient();
    await supabase.auth.signOut();

    return NextResponse.json({ data: { success: true } });
  } catch (err) {
    console.error("Profile DELETE error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
