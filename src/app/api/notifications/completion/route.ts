import { NextResponse } from "next/server";
import { createAdminClient, getAuthenticatedUser } from "@/lib/supabase/server";
import { sendCompletionEmail } from "@/lib/email";

function getTodayDateString(timezone = "Asia/Kolkata"): string {
  try {
    const formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: timezone || "Asia/Kolkata",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    return formatter.format(new Date());
  } catch {
    return new Date().toISOString().split("T")[0];
  }
}

// POST /api/notifications/completion — Trigger completion celebration email for authenticated user
export async function POST() {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = createAdminClient();

    const { data: profile, error: pError } = await admin
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    if (pError || !profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    if (!profile.email_notifications) {
      return NextResponse.json({ message: "Email notifications disabled" });
    }

    const today = getTodayDateString(profile.timezone || "Asia/Kolkata");

    // 1. Check if completion email was already sent today
    const { data: existingLog } = await admin
      .from("notification_logs")
      .select("id")
      .eq("profile_id", user.id)
      .eq("notification_type", "completion_email")
      .eq("notification_date", today)
      .maybeSingle();

    if (existingLog) {
      return NextResponse.json({ message: "Completion email already sent today" });
    }

    // 2. Fetch today's tasks to verify completion
    const { data: tasks, error: tError } = await admin
      .from("tasks")
      .select("*")
      .eq("profile_id", user.id)
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
      await admin.from("notification_logs").insert({
        profile_id: user.id,
        notification_type: "completion_email",
        notification_date: today,
        sent_at: new Date().toISOString(),
      });
      console.log(`Completion celebration email dispatched to ${profile.email}`);
    }

    return NextResponse.json({ success: true, sent });
  } catch (err) {
    console.error("Completion notification error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
