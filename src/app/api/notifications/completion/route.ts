import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { sendCompletionEmail } from "@/lib/email";

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

// POST /api/notifications/completion — Trigger completion celebration email
export async function POST() {
  try {
    const supabase = createServerClient();

    const { data: profile, error: pError } = await supabase
      .from("profiles")
      .select("*")
      .limit(1)
      .single();

    if (pError || !profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    if (!profile.email_notifications) {
      return NextResponse.json({ message: "Email notifications disabled" });
    }

    const today = getTodayDateString(profile.timezone);

    // 1. Check if completion email was already sent today
    const { data: existingLog } = await supabase
      .from("notification_logs")
      .select("id")
      .eq("profile_id", profile.id)
      .eq("notification_type", "completion_email")
      .eq("notification_date", today)
      .single();

    if (existingLog) {
      return NextResponse.json({ message: "Completion email already sent today" });
    }

    // 2. Fetch today's tasks to verify completion
    const { data: tasks, error: tError } = await supabase
      .from("tasks")
      .select("*")
      .eq("profile_id", profile.id)
      .eq("task_date", today);

    if (tError || !tasks || tasks.length === 0) {
      return NextResponse.json({ message: "No tasks to celebrate" });
    }

    const allCompleted = tasks.every((t) => t.completed);
    if (!allCompleted) {
      return NextResponse.json({ message: "Not all tasks completed yet" });
    }

    // 3. Send celebration email
    const sent = await sendCompletionEmail(profile, tasks);

    if (sent) {
      await supabase.from("notification_logs").insert({
        profile_id: profile.id,
        notification_type: "completion_email",
        notification_date: today,
      });
    }

    return NextResponse.json({ success: true, sent });
  } catch (err) {
    console.error("Completion notification error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
