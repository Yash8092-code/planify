import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { sendMorningEmail } from "@/lib/email";

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

export async function GET(request: Request) {
  return handleDailyEmailCron(request);
}

export async function POST(request: Request) {
  return handleDailyEmailCron(request);
}

async function handleDailyEmailCron(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");
    if (
      process.env.CRON_SECRET &&
      authHeader !== `Bearer ${process.env.CRON_SECRET}`
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createServerClient();

    // Fetch profiles with email_notifications enabled
    const { data: profiles, error: pError } = await supabase
      .from("profiles")
      .select("*")
      .eq("email_notifications", true);

    if (pError || !profiles) {
      return NextResponse.json({ error: "Failed to fetch profiles" }, { status: 500 });
    }

    let emailsSent = 0;

    for (const profile of profiles) {
      const today = getTodayDateString(profile.timezone);

      // Check if morning email already logged for today
      const { data: existingLog } = await supabase
        .from("notification_logs")
        .select("id")
        .eq("profile_id", profile.id)
        .eq("notification_type", "morning_email")
        .eq("notification_date", today)
        .single();

      if (existingLog) continue; // Already sent today

      // Fetch today's tasks
      const { data: tasks } = await supabase
        .from("tasks")
        .select("*")
        .eq("profile_id", profile.id)
        .eq("task_date", today);

      const success = await sendMorningEmail(profile, tasks || []);

      if (success) {
        await supabase.from("notification_logs").insert({
          profile_id: profile.id,
          notification_type: "morning_email",
          notification_date: today,
        });
        emailsSent++;
      }
    }

    return NextResponse.json({
      success: true,
      emailsSent,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error("Cron daily-email error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
