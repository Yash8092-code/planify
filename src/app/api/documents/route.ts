import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

// GET /api/documents — List documents with search and sorting
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q")?.trim();
    const sort = searchParams.get("sort") || "recent"; // 'recent' | 'name' | 'size'

    const supabase = createServerClient();

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id")
      .limit(1)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    let dbQuery = supabase
      .from("documents")
      .select("*")
      .eq("profile_id", profile.id);

    if (sort === "name") {
      dbQuery = dbQuery.order("file_name", { ascending: true });
    } else if (sort === "size") {
      dbQuery = dbQuery.order("file_size", { ascending: false });
    } else {
      dbQuery = dbQuery.order("created_at", { ascending: false });
    }

    const { data: docs, error } = await dbQuery;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    let result = docs || [];

    if (query) {
      const q = query.toLowerCase();
      result = result.filter((d) => d.file_name.toLowerCase().includes(q));
    }

    return NextResponse.json({ data: result });
  } catch (err) {
    console.error("Documents GET error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/documents — Upload file to storage and record in DB
export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const supabase = createServerClient();

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id")
      .limit(1)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    // 10MB limit
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File size exceeds 10MB limit" },
        { status: 400 }
      );
    }

    const fileBuffer = await file.arrayBuffer();
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const filePath = `${profile.id}/${Date.now()}_${sanitizedName}`;

    // Upload to Supabase Storage 'documents' bucket
    const { error: uploadError } = await supabase.storage
      .from("documents")
      .upload(filePath, fileBuffer, {
        contentType: file.type || "application/octet-stream",
        upsert: true,
      });

    let fileUrl = "";

    if (!uploadError) {
      const { data: urlData } = supabase.storage
        .from("documents")
        .getPublicUrl(filePath);
      fileUrl = urlData.publicUrl;
    } else {
      console.warn("Storage upload warning (will record with fallback URL):", uploadError.message);
      fileUrl = `/uploads/${sanitizedName}`;
    }

    // Record in DB
    const { data: doc, error: insertError } = await supabase
      .from("documents")
      .insert({
        profile_id: profile.id,
        file_name: file.name,
        file_url: fileUrl,
        file_path: filePath,
        file_type: file.type || "application/octet-stream",
        file_size: file.size,
      })
      .select()
      .single();

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({ data: doc }, { status: 201 });
  } catch (err) {
    console.error("Documents POST error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PATCH /api/documents — Rename a document
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, file_name } = body;

    if (!id || !file_name || !file_name.trim()) {
      return NextResponse.json({ error: "Document ID and valid name are required" }, { status: 400 });
    }

    const supabase = createServerClient();

    const { data: doc, error } = await supabase
      .from("documents")
      .update({
        file_name: file_name.trim(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data: doc });
  } catch (err) {
    console.error("Documents PATCH error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/documents — Remove document from storage and DB
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Document ID is required" }, { status: 400 });
    }

    const supabase = createServerClient();

    // Get file path first
    const { data: doc } = await supabase
      .from("documents")
      .select("file_path")
      .eq("id", id)
      .single();

    if (doc?.file_path) {
      await supabase.storage.from("documents").remove([doc.file_path]);
    }

    const { error } = await supabase.from("documents").delete().eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Documents DELETE error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
