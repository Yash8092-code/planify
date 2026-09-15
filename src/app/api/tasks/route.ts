import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

// Helper to get today's date formatted as YYYY-MM-DD
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

// GET /api/tasks — Fetch tasks with filtering & stats
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get("date");
    const filter = searchParams.get("filter") || "all"; // 'all' | 'active' | 'completed'
    const priority = searchParams.get("priority"); // 'low' | 'medium' | 'high'

    const supabase = createServerClient();

    // 1. Get user profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, timezone")
      .limit(1)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const taskDate = dateParam || getTodayDateString(profile.timezone);

    // 2. Daily rollback auto-check: If querying today's tasks, ensure active recurring tasks exist
    if (taskDate === getTodayDateString(profile.timezone)) {
      const { data: activeRecurring } = await supabase
        .from("recurring_tasks")
        .select("*")
        .eq("profile_id", profile.id)
        .eq("active", true);

      if (activeRecurring && activeRecurring.length > 0) {
        // Fetch tasks already created for today
        const { data: existingToday } = await supabase
          .from("tasks")
          .select("recurring_task_id")
          .eq("profile_id", profile.id)
          .eq("task_date", taskDate);

        const existingRecurringIds = new Set(
          (existingToday || [])
            .map((t) => t.recurring_task_id)
            .filter(Boolean)
        );

        const toInsert = activeRecurring
          .filter((rec) => !existingRecurringIds.has(rec.id))
          .map((rec, index) => ({
            profile_id: profile.id,
            title: rec.title,
            description: rec.description,
            priority: rec.priority,
            due_time: rec.due_time,
            completed: false,
            rollback_daily: true,
            recurring_task_id: rec.id,
            task_date: taskDate,
            sort_order: index,
          }));

        if (toInsert.length > 0) {
          await supabase.from("tasks").insert(toInsert);
        }
      }
    }

    // 3. Query all tasks for this date to compute accurate stats
    const { data: allDayTasks, error: dayError } = await supabase
      .from("tasks")
      .select("*")
      .eq("profile_id", profile.id)
      .eq("task_date", taskDate)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });

    if (dayError) {
      return NextResponse.json({ error: dayError.message }, { status: 500 });
    }

    const tasksList = allDayTasks || [];
    const total = tasksList.length;
    const completed = tasksList.filter((t) => t.completed).length;
    const remaining = total - completed;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

    const stats = { total, completed, remaining, percentage };

    // 4. Apply client-requested filters to returned data
    let filteredTasks = tasksList;
    if (filter === "active") {
      filteredTasks = filteredTasks.filter((t) => !t.completed);
    } else if (filter === "completed") {
      filteredTasks = filteredTasks.filter((t) => t.completed);
    }

    if (priority && ["low", "medium", "high"].includes(priority)) {
      filteredTasks = filteredTasks.filter((t) => t.priority === priority);
    }

    return NextResponse.json({
      data: filteredTasks,
      stats,
      date: taskDate,
    });
  } catch (err) {
    console.error("Tasks GET error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/tasks — Create a new task
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      title,
      description = null,
      priority = "medium",
      due_time = null,
      rollback_daily = false,
      task_date,
    } = body;

    if (!title || typeof title !== "string" || title.trim().length === 0) {
      return NextResponse.json({ error: "Task title is required" }, { status: 400 });
    }

    const supabase = createServerClient();

    // 1. Get user profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, timezone")
      .limit(1)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const dateToUse = task_date || getTodayDateString(profile.timezone);

    // 2. Get current max sort_order
    const { data: maxSortData } = await supabase
      .from("tasks")
      .select("sort_order")
      .eq("profile_id", profile.id)
      .eq("task_date", dateToUse)
      .order("sort_order", { ascending: false })
      .limit(1);

    const nextSortOrder =
      maxSortData && maxSortData.length > 0 && maxSortData[0].sort_order != null
        ? maxSortData[0].sort_order + 1
        : 0;

    let recurringTaskId: string | null = null;

    // 3. If rollback_daily is true, create or get a recurring_task entry
    if (rollback_daily) {
      const { data: recTask, error: recError } = await supabase
        .from("recurring_tasks")
        .insert({
          profile_id: profile.id,
          title: title.trim(),
          description: description ? description.trim() : null,
          priority,
          due_time: due_time || null,
          active: true,
        })
        .select("id")
        .single();

      if (!recError && recTask) {
        recurringTaskId = recTask.id;
      }
    }

    // 4. Insert task
    const { data: newTask, error: insertError } = await supabase
      .from("tasks")
      .insert({
        profile_id: profile.id,
        title: title.trim(),
        description: description ? description.trim() : null,
        priority,
        due_time: due_time || null,
        completed: false,
        rollback_daily,
        recurring_task_id: recurringTaskId,
        task_date: dateToUse,
        sort_order: nextSortOrder,
      })
      .select()
      .single();

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({ data: newTask }, { status: 201 });
  } catch (err) {
    console.error("Tasks POST error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PATCH /api/tasks — Update a task
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, completed, title, description, priority, due_time, rollback_daily } = body;

    if (!id) {
      return NextResponse.json({ error: "Task ID is required" }, { status: 400 });
    }

    const supabase = createServerClient();

    // Fetch existing task
    const { data: existing, error: fetchError } = await supabase
      .from("tasks")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError || !existing) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (completed !== undefined) {
      updates.completed = Boolean(completed);
      updates.completed_at = completed ? new Date().toISOString() : null;
    }

    if (title !== undefined) {
      if (typeof title !== "string" || title.trim().length === 0) {
        return NextResponse.json({ error: "Title cannot be empty" }, { status: 400 });
      }
      updates.title = title.trim();
    }

    if (description !== undefined) {
      updates.description = description ? description.trim() : null;
    }

    if (priority !== undefined) {
      if (["low", "medium", "high"].includes(priority)) {
        updates.priority = priority;
      }
    }

    if (due_time !== undefined) {
      updates.due_time = due_time || null;
    }

    // Handle rollback_daily toggle
    if (rollback_daily !== undefined && rollback_daily !== existing.rollback_daily) {
      updates.rollback_daily = Boolean(rollback_daily);

      if (rollback_daily) {
        // Create recurring task if not linked
        if (!existing.recurring_task_id) {
          const { data: newRec } = await supabase
            .from("recurring_tasks")
            .insert({
              profile_id: existing.profile_id,
              title: updates.title || existing.title,
              description: updates.description !== undefined ? updates.description : existing.description,
              priority: updates.priority || existing.priority,
              due_time: updates.due_time !== undefined ? updates.due_time : existing.due_time,
              active: true,
            })
            .select("id")
            .single();

          if (newRec) {
            updates.recurring_task_id = newRec.id;
          }
        } else {
          // Reactivate existing recurring task
          await supabase
            .from("recurring_tasks")
            .update({ active: true })
            .eq("id", existing.recurring_task_id);
        }
      } else if (existing.recurring_task_id) {
        // Deactivate recurring task
        await supabase
          .from("recurring_tasks")
          .update({ active: false })
          .eq("id", existing.recurring_task_id);
      }
    }

    const { data: updatedTask, error: updateError } = await supabase
      .from("tasks")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ data: updatedTask });
  } catch (err) {
    console.error("Tasks PATCH error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/tasks — Delete a task
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const deleteRecurring = searchParams.get("delete_recurring") === "true";

    if (!id) {
      return NextResponse.json({ error: "Task ID is required" }, { status: 400 });
    }

    const supabase = createServerClient();

    // Get task before deleting to check recurring_task_id
    const { data: task } = await supabase
      .from("tasks")
      .select("recurring_task_id")
      .eq("id", id)
      .single();

    if (task && deleteRecurring && task.recurring_task_id) {
      await supabase
        .from("recurring_tasks")
        .delete()
        .eq("id", task.recurring_task_id);
    }

    const { error } = await supabase.from("tasks").delete().eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data: { success: true } });
  } catch (err) {
    console.error("Tasks DELETE error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
