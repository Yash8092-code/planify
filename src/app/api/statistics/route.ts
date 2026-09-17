import { NextResponse } from "next/server";
import { createAdminClient, getAuthenticatedUser } from "@/lib/supabase/server";

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

export async function GET() {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = createAdminClient();

    const { data: profile, error: pError } = await admin
      .from("profiles")
      .select("id, timezone")
      .eq("id", user.id)
      .maybeSingle();

    if (pError || !profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const timezone = profile.timezone || "Asia/Kolkata";
    const todayStr = getTodayDateString(timezone);

    // Calculate dates
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const thirtyDaysKey = thirtyDaysAgo.toISOString().split("T")[0];

    // Parallel optimized queries:
    // 1. Recent 30 days tasks (for charts, monthly rate, and recent streak)
    // 2. All-time completed tasks count
    // 3. Active recurring tasks count
    const [recentTasksRes, allTimeCountRes, recurringRes] = await Promise.all([
      admin
        .from("tasks")
        .select("id, completed, task_date, priority")
        .eq("profile_id", user.id)
        .gte("task_date", thirtyDaysKey)
        .order("task_date", { ascending: false }),
      admin
        .from("tasks")
        .select("id", { count: "exact", head: true })
        .eq("profile_id", user.id)
        .eq("completed", true),
      admin
        .from("recurring_tasks")
        .select("id", { count: "exact", head: true })
        .eq("profile_id", user.id)
        .eq("active", true),
    ]);

    const recentTasks = recentTasksRes.data || [];
    const totalCompleted = allTimeCountRes.count ?? 0;
    const activeRecurringCount = recurringRes.count ?? 0;

    // 1. Today's stats
    const todayTasks = recentTasks.filter((t) => t.task_date === todayStr);
    const todayTotal = todayTasks.length;
    const todayCompleted = todayTasks.filter((t) => t.completed).length;
    const todayRemaining = todayTotal - todayCompleted;
    const todayPercentage = todayTotal > 0 ? Math.round((todayCompleted / todayTotal) * 100) : 0;

    // 2. Last 7 days breakdown
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

      const dayTasks = recentTasks.filter((t) => t.task_date === dateKey);
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

    // 3. Last 30 days monthly rate
    const monthTotal = recentTasks.length;
    const monthCompleted = recentTasks.filter((t) => t.completed).length;
    const monthlyRate = monthTotal > 0 ? Math.round((monthCompleted / monthTotal) * 100) : 0;

    // 4. Calculate Streak
    const datesWithCompletion = new Set(
      recentTasks.filter((t) => t.completed).map((t) => t.task_date)
    );

    let streak = 0;
    const checkDate = new Date();

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
