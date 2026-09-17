import { NextResponse } from "next/server";
import { createAdminClient, getAuthenticatedUser } from "@/lib/supabase/server";

// GET /api/documents — List documents with search and sorting for authenticated user
export async function GET(request: Request) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q")?.trim();
    const sort = searchParams.get("sort") || "recent"; // 'recent' | 'name' | 'size'

    const admin = createAdminClient();

    let dbQuery = admin
      .from("documents")
      .select("id, profile_id, file_name, file_url, file_path, file_type, file_size, created_at, updated_at")
      .or(`profile_id.eq.${user.id},profile_id.is.null`);

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

    let result = (docs || []).map((d) => ({
      ...d,
      file_url: `/api/documents/${d.id}/view`,
    }));

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

// POST /api/documents — Upload file to 'planify-documents' bucket and record in DB
export async function POST(request: Request) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // 10MB limit
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File size exceeds 10MB limit" },
        { status: 400 }
      );
    }

    const admin = createAdminClient();

    const fileBuffer = await file.arrayBuffer();
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const filePath = `${user.id}/${Date.now()}_${sanitizedName}`;

    // Upload to Supabase Storage 'planify-documents' private bucket
    const { error: uploadError } = await admin.storage
      .from("planify-documents")
      .upload(filePath, Buffer.from(fileBuffer), {
        contentType: file.type || "application/octet-stream",
        upsert: true,
      });

    if (uploadError) {
      console.error("Storage upload error:", uploadError);
      return NextResponse.json(
        { error: "Failed to upload file to storage: " + uploadError.message },
        { status: 500 }
      );
    }

    // Record in DB with permanent view endpoint
    const { data: doc, error: insertError } = await admin
      .from("documents")
      .insert({
        profile_id: user.id,
        file_name: file.name,
        file_url: "", // will be set below with document id
        file_path: filePath,
        file_type: file.type || "application/octet-stream",
        file_size: file.size,
      })
      .select()
      .single();

    if (insertError) {
      // Cleanup uploaded file on DB insert failure
      await admin.storage.from("planify-documents").remove([filePath]);
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    const viewUrl = `/api/documents/${doc.id}/view`;
    await admin
      .from("documents")
      .update({ file_url: viewUrl })
      .eq("id", doc.id);

    return NextResponse.json({ data: { ...doc, file_url: viewUrl } }, { status: 201 });
  } catch (err) {
    console.error("Documents POST error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PATCH /api/documents — Rename a document belonging to user
export async function PATCH(request: Request) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { id, file_name } = body;

    if (!id || !file_name || !file_name.trim()) {
      return NextResponse.json(
        { error: "Document ID and valid name are required" },
        { status: 400 }
      );
    }

    const admin = createAdminClient();

    const { data: doc, error } = await admin
      .from("documents")
      .update({
        file_name: file_name.trim(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("profile_id", user.id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data: { ...doc, file_url: `/api/documents/${doc.id}/view` } });
  } catch (err) {
    console.error("Documents PATCH error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/documents — Remove document from storage and DB
export async function DELETE(request: Request) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Document ID is required" }, { status: 400 });
    }

    const admin = createAdminClient();

    // Verify document ownership
    const { data: doc } = await admin
      .from("documents")
      .select("file_path")
      .eq("id", id)
      .eq("profile_id", user.id)
      .maybeSingle();

    if (!doc) {
      return NextResponse.json({ error: "Document not found or access denied" }, { status: 404 });
    }

    if (doc.file_path) {
      await admin.storage.from("planify-documents").remove([doc.file_path]);
    }

    const { error } = await admin
      .from("documents")
      .delete()
      .eq("id", id)
      .eq("profile_id", user.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Documents DELETE error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
