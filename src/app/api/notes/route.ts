import { NextResponse } from "next/server";
import { createAdminClient, getAuthenticatedUser } from "@/lib/supabase/server";

// GET /api/notes — Fetch notes with search, sort, and pinned priority for authenticated user
export async function GET(request: Request) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q")?.trim();
    const tag = searchParams.get("tag")?.trim();
    const sort = searchParams.get("sort") || "recent"; // 'recent' | 'alphabetical'

    const admin = createAdminClient();

    // Query notes strictly for this user
    let dbQuery = admin
      .from("notes")
      .select("id, profile_id, title, content, tags, is_pinned, created_at, updated_at")
      .eq("profile_id", user.id);

    if (sort === "alphabetical") {
      dbQuery = dbQuery
        .order("is_pinned", { ascending: false })
        .order("title", { ascending: true });
    } else {
      dbQuery = dbQuery
        .order("is_pinned", { ascending: false })
        .order("updated_at", { ascending: false });
    }

    const { data: notes, error } = await dbQuery;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    let result = notes || [];

    // Filter by search query if provided
    if (query) {
      const q = query.toLowerCase();
      result = result.filter(
        (n) =>
          n.title.toLowerCase().includes(q) ||
          n.content.toLowerCase().includes(q) ||
          (n.tags && n.tags.some((t: string) => t.toLowerCase().includes(q)))
      );
    }

    // Filter by tag if provided
    if (tag && tag !== "all") {
      result = result.filter(
        (n) => n.tags && n.tags.some((t: string) => t.toLowerCase() === tag.toLowerCase())
      );
    }

    return NextResponse.json({ data: result });
  } catch (err) {
    console.error("Notes GET error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/notes — Create a note for authenticated user
export async function POST(request: Request) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { title, content = "", tags = [] } = body;

    if (!title || typeof title !== "string" || title.trim().length === 0) {
      return NextResponse.json({ error: "Note title is required" }, { status: 400 });
    }

    const admin = createAdminClient();

    const cleanTags = Array.isArray(tags)
      ? tags.map((t: string) => t.trim().toLowerCase()).filter(Boolean)
      : [];

    const { data: note, error } = await admin
      .from("notes")
      .insert({
        profile_id: user.id,
        title: title.trim(),
        content: content || "",
        tags: cleanTags,
        is_pinned: false,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data: note }, { status: 201 });
  } catch (err) {
    console.error("Notes POST error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PATCH /api/notes — Update note belonging to authenticated user
export async function PATCH(request: Request) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { id, title, content, tags, is_pinned } = body;

    if (!id) {
      return NextResponse.json({ error: "Note ID is required" }, { status: 400 });
    }

    const admin = createAdminClient();

    // Verify ownership
    const { data: existing } = await admin
      .from("notes")
      .select("id")
      .eq("id", id)
      .eq("profile_id", user.id)
      .maybeSingle();

    if (!existing) {
      return NextResponse.json({ error: "Note not found or access denied" }, { status: 404 });
    }

    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (title !== undefined) {
      if (typeof title !== "string" || title.trim().length === 0) {
        return NextResponse.json({ error: "Title cannot be empty" }, { status: 400 });
      }
      updates.title = title.trim();
    }

    if (content !== undefined) {
      updates.content = content;
    }

    if (tags !== undefined) {
      updates.tags = Array.isArray(tags)
        ? tags.map((t: string) => t.trim().toLowerCase()).filter(Boolean)
        : [];
    }

    if (is_pinned !== undefined) {
      updates.is_pinned = Boolean(is_pinned);
    }

    const { data: note, error } = await admin
      .from("notes")
      .update(updates)
      .eq("id", id)
      .eq("profile_id", user.id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data: note });
  } catch (err) {
    console.error("Notes PATCH error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/notes — Delete note belonging to authenticated user
export async function DELETE(request: Request) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Note ID is required" }, { status: 400 });
    }

    const admin = createAdminClient();

    const { error } = await admin
      .from("notes")
      .delete()
      .eq("id", id)
      .eq("profile_id", user.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Notes DELETE error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
