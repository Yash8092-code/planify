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

export async function GET() {
  try {
    const supabase = createServerClient();

    const { data: profile, error: pError } = await supabase
      .from("profiles")
      .select("id, timezone")
      .limit(1)
      .single();

    if (pError || !profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const todayStr = getTodayDateString(profile.timezone);

    // 1. Fetch all tasks for profile to compute all-time and historical stats
    const { data: allTasks, error: tError } = await supabase
      .from("tasks")
      .select("id, completed, task_date, created_at, priority")
      .eq("profile_id", profile.id);

    if (tError) {
      return NextResponse.json({ error: tError.message }, { status: 500 });
    }

    const tasks = allTasks || [];

    // 2. Active recurring tasks count
    const { data: recurringTasks } = await supabase
      .from("recurring_tasks")
      .select("id")
      .eq("profile_id", profile.id)
      .eq("active", true);

    const activeRecurringCount = recurringTasks?.length || 0;

    // 3. Today's stats
    const todayTasks = tasks.filter((t) => t.task_date === todayStr);
    const todayTotal = todayTasks.length;
    const todayCompleted = todayTasks.filter((t) => t.completed).length;
    const todayRemaining = todayTotal - todayCompleted;
    const todayPercentage = todayTotal > 0 ? Math.round((todayCompleted / todayTotal) * 100) : 0;

    // 4. All-time completed tasks
    const totalCompleted = tasks.filter((t) => t.completed).length;

    // 5. Last 7 days breakdown
    const last7Days: {
      day: string;
      date: string;
      total: number;
      completed: number;
      rate: number;
    }[] = [];

    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateKey = d.toISOString().split("T")[0];
      const dayName = d.toLocaleDateString("en-US", { weekday: "short" });

      const dayTasks = tasks.filter((t) => t.task_date === dateKey);
      const total = dayTasks.length;
      const completed = dayTasks.filter((t) => t.completed).length;
      const rate = total > 0 ? Math.round((completed / total) * 100) : 0;

      last7Days.push({
        day: dayName,
        date: dateKey,
        total,
        completed,
        rate,
      });
    }

    // Weekly completion rate
    const weekTotal = last7Days.reduce((acc, d) => acc + d.total, 0);
    const weekCompleted = last7Days.reduce((acc, d) => acc + d.completed, 0);
    const weeklyRate = weekTotal > 0 ? Math.round((weekCompleted / weekTotal) * 100) : 0;

    // 6. Last 30 days monthly rate
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const thirtyDaysKey = thirtyDaysAgo.toISOString().split("T")[0];

    const monthTasks = tasks.filter((t) => t.task_date >= thirtyDaysKey);
    const monthTotal = monthTasks.length;
    const monthCompleted = monthTasks.filter((t) => t.completed).length;
    const monthlyRate = monthTotal > 0 ? Math.round((monthCompleted / monthTotal) * 100) : 0;

    // 7. Calculate Streak (consecutive days leading up to today/yesterday with >= 1 task completed)
    const datesWithCompletion = new Set(
      tasks.filter((t) => t.completed).map((t) => t.task_date)
    );

    let streak = 0;
    let checkDate = new Date();

    // If today has completions, count today; otherwise start from yesterday
    const todayHasCompletion = datesWithCompletion.has(todayStr);
    if (!todayHasCompletion) {
      checkDate.setDate(checkDate.getDate() - 1);
    }

    while (true) {
      const key = checkDate.toISOString().split("T")[0];
      if (datesWithCompletion.has(key)) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    return NextResponse.json({
      today: {
        total: todayTotal,
        completed: todayCompleted,
        remaining: todayRemaining,
        percentage: todayPercentage,
      },
      weeklyRate,
      monthlyRate,
      streak,
      totalCompleted,
      activeRecurring: activeRecurringCount,
      weeklyChart: last7Days,
    });
  } catch (err) {
    console.error("Statistics GET error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
