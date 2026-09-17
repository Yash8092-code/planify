import { NextResponse } from "next/server";
import { createAdminClient, getAuthenticatedUser } from "@/lib/supabase/server";

// PATCH /api/tasks/reorder — Batch update sort order for tasks belonging to user
export async function PATCH(request: Request) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { taskIds } = body;

    if (!Array.isArray(taskIds) || taskIds.length === 0) {
      return NextResponse.json(
        { error: "taskIds must be a non-empty array of task IDs" },
        { status: 400 }
      );
    }

    const admin = createAdminClient();

    // Update each task's sort_order sequentially or in parallel promises, verifying ownership
    const updatePromises = taskIds.map((id, index) =>
      admin
        .from("tasks")
        .update({ sort_order: index, updated_at: new Date().toISOString() })
        .eq("id", id)
        .eq("profile_id", user.id)
    );

    const results = await Promise.all(updatePromises);
    const hasError = results.some((r) => r.error);

    if (hasError) {
      return NextResponse.json(
        { error: "Failed to update some task orders" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Tasks reorder error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
