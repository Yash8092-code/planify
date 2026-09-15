import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

function getTodayDateString(timezone = "UTC"): string {
  try {
    const formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    return formatter.format(new Date());
  } catch {
    return new Date().toISOString().split("T")[0];
  }
}

// GET /api/rollback — List all recurring tasks
export async function GET() {
  try {
    const supabase = createServerClient();

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id")
      .limit(1)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const { data, error } = await supabase
      .from("recurring_tasks")
      .select("*")
      .eq("profile_id", profile.id)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (err) {
    console.error("Rollback GET error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/rollback — Manually trigger rollback for today
export async function POST() {
  try {
    const supabase = createServerClient();

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, timezone")
      .limit(1)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const today = getTodayDateString(profile.timezone);

    // 1. Get active recurring tasks
    const { data: activeRecurring, error: recError } = await supabase
      .from("recurring_tasks")
      .select("*")
      .eq("profile_id", profile.id)
      .eq("active", true);

    if (recError) {
      return NextResponse.json({ error: recError.message }, { status: 500 });
    }

    if (!activeRecurring || activeRecurring.length === 0) {
      return NextResponse.json({
        message: "No active recurring tasks found.",
        createdCount: 0,
      });
    }

    // 2. Check which ones already exist for today
    const { data: existingTasks } = await supabase
      .from("tasks")
      .select("recurring_task_id")
      .eq("profile_id", profile.id)
      .eq("task_date", today);

    const existingIds = new Set(
      (existingTasks || []).map((t) => t.recurring_task_id).filter(Boolean)
    );

    const toInsert = activeRecurring
      .filter((rec) => !existingIds.has(rec.id))
      .map((rec, index) => ({
        profile_id: profile.id,
        title: rec.title,
        description: rec.description,
        priority: rec.priority,
        due_time: rec.due_time,
        completed: false,
        rollback_daily: true,
        recurring_task_id: rec.id,
        task_date: today,
        sort_order: index,
      }));

    if (toInsert.length > 0) {
      const { error: insertError } = await supabase
        .from("tasks")
        .insert(toInsert);

      if (insertError) {
        return NextResponse.json({ error: insertError.message }, { status: 500 });
      }
    }

    return NextResponse.json({
      success: true,
      createdCount: toInsert.length,
      message: `Restored ${toInsert.length} recurring tasks for today.`,
    });
  } catch (err) {
    console.error("Rollback POST error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PATCH /api/rollback — Update a recurring task (toggle active, change details)
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, active, title, description, priority, due_time } = body;

    if (!id) {
      return NextResponse.json({ error: "Recurring task ID is required" }, { status: 400 });
    }

    const supabase = createServerClient();

    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (active !== undefined) updates.active = Boolean(active);
    if (title !== undefined) updates.title = title.trim();
    if (description !== undefined) updates.description = description ? description.trim() : null;
    if (priority !== undefined) updates.priority = priority;
    if (due_time !== undefined) updates.due_time = due_time || null;

    const { data, error } = await supabase
      .from("recurring_tasks")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (err) {
    console.error("Rollback PATCH error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/rollback — Delete a recurring task template
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Recurring task ID is required" }, { status: 400 });
    }

    const supabase = createServerClient();

    const { error } = await supabase
      .from("recurring_tasks")
      .delete()
      .eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Rollback DELETE error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
