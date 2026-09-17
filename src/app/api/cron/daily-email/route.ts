import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { sendMorningEmail } from "@/lib/email";
import { Profile, Task } from "@/lib/types";

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

function getHourInTimezone(timezone = "Asia/Kolkata"): number {
  try {
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone || "Asia/Kolkata",
      hour: "numeric",
      hour12: false,
    });
    return parseInt(formatter.format(new Date()), 10);
  } catch {
    return new Date().getUTCHours();
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

    const { searchParams } = new URL(request.url);
    const force = searchParams.get("force") === "true";

    const admin = createAdminClient();

    // Fetch profiles with email_notifications enabled
    const { data: profiles, error: pError } = await admin
      .from("profiles")
      .select("*")
      .eq("email_notifications", true);

    if (pError || !profiles) {
      return NextResponse.json({ error: "Failed to fetch profiles" }, { status: 500 });
    }

    let emailsSent = 0;
    let skippedAlreadySent = 0;
    let skippedWrongHour = 0;
    const errors: { profileId: string; error: string }[] = [];

    for (const profile of profiles as Profile[]) {
      try {
        const timezone = profile.timezone || "Asia/Kolkata";
        const userLocalHour = getHourInTimezone(timezone);

        // Check timezone hour: ensure it's around 5:00 AM (hour 5), unless forced
        if (!force && userLocalHour !== 5) {
          skippedWrongHour++;
          continue;
        }

        const today = getTodayDateString(timezone);

        // 1. Check if morning email already logged for today
        const { data: existingLog } = await admin
          .from("notification_logs")
          .select("id")
          .eq("profile_id", profile.id)
          .eq("notification_type", "morning_email")
          .eq("notification_date", today)
          .maybeSingle();

        if (existingLog) {
          skippedAlreadySent++;
          continue;
        }

        // 2. Ensure today's recurring tasks are populated
        const { data: recurring } = await admin
          .from("recurring_tasks")
          .select("*")
          .eq("profile_id", profile.id)
          .eq("active", true);

        if (recurring && recurring.length > 0) {
          const { data: existingTasks } = await admin
            .from("tasks")
            .select("recurring_task_id")
            .eq("profile_id", profile.id)
            .eq("task_date", today);

          const existingIds = new Set(
            (existingTasks || []).map((t) => t.recurring_task_id).filter(Boolean)
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
            await admin.from("tasks").insert(toInsert);
          }
        }

        // 3. Fetch today's tasks
        const { data: tasks } = await admin
          .from("tasks")
          .select("*")
          .eq("profile_id", profile.id)
          .eq("task_date", today)
          .order("sort_order", { ascending: true });

        // 4. Send morning email via Resend
        const success = await sendMorningEmail(profile, (tasks || []) as Task[]);

        if (success) {
          await admin.from("notification_logs").insert({
            profile_id: profile.id,
            notification_type: "morning_email",
            notification_date: today,
            sent_at: new Date().toISOString(),
          });
          emailsSent++;
          console.log(`Morning reminder email sent to ${profile.email} (${timezone})`);
        } else {
          errors.push({ profileId: profile.id, error: "Resend email dispatch returned false" });
        }
      } catch (userErr: unknown) {
        const errorMsg = userErr instanceof Error ? userErr.message : "Unknown error";
        console.error(`Error processing morning email for profile ${profile.id}:`, errorMsg);
        errors.push({ profileId: profile.id, error: errorMsg });
      }
    }

    return NextResponse.json({
      success: true,
      emailsSent,
      skippedAlreadySent,
      skippedWrongHour,
      totalProfiles: profiles.length,
      errors: errors.length > 0 ? errors : undefined,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error("Cron daily-email error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
