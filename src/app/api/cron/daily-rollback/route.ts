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

// GET or POST /api/cron/daily-rollback — Scheduled daily task regeneration
export async function GET(request: Request) {
  return handleRollbackCron(request);
}

export async function POST(request: Request) {
  return handleRollbackCron(request);
}

async function handleRollbackCron(request: Request) {
  try {
    // Check authorization if CRON_SECRET is configured
    const authHeader = request.headers.get("authorization");
    if (
      process.env.CRON_SECRET &&
      authHeader !== `Bearer ${process.env.CRON_SECRET}`
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createServerClient();

    // Fetch all profiles
    const { data: profiles, error: pError } = await supabase
      .from("profiles")
      .select("id, timezone");

    if (pError || !profiles) {
      return NextResponse.json({ error: "Failed to fetch profiles" }, { status: 500 });
    }

    let totalCreated = 0;

    for (const profile of profiles) {
      const today = getTodayDateString(profile.timezone);

      // Get active recurring tasks
      const { data: recurring } = await supabase
        .from("recurring_tasks")
        .select("*")
        .eq("profile_id", profile.id)
        .eq("active", true);

      if (!recurring || recurring.length === 0) continue;

      // Get existing tasks for today
      const { data: existing } = await supabase
        .from("tasks")
        .select("recurring_task_id")
        .eq("profile_id", profile.id)
        .eq("task_date", today);

      const existingIds = new Set(
        (existing || []).map((t) => t.recurring_task_id).filter(Boolean)
      );

      const toInsert = recurring
        .filter((r) => !existingIds.has(r.id))
        .map((r, i) => ({
          profile_id: profile.id,
          title: r.title,
          description: r.description,
          priority: r.priority,
          due_time: r.due_time,
          completed: false,
          rollback_daily: true,
          recurring_task_id: r.id,
          task_date: today,
          sort_order: i,
        }));

      if (toInsert.length > 0) {
        await supabase.from("tasks").insert(toInsert);
        totalCreated += toInsert.length;
      }
    }

    return NextResponse.json({
      success: true,
      totalCreated,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error("Cron daily-rollback error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
