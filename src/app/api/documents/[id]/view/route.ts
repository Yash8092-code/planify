import { NextResponse } from "next/server";
import { createAdminClient, getAuthenticatedUser } from "@/lib/supabase/server";

// GET /api/documents/[id]/view — Generate fresh signed URL for secure viewing/download
export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    if (!id) {
      return NextResponse.json({ error: "Document ID is required" }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const isDownload = searchParams.get("download") === "1" || searchParams.get("download") === "true";

    const admin = createAdminClient();

    // 1. Verify document ownership
    const { data: doc, error: docError } = await admin
      .from("documents")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (docError || !doc) {
      return NextResponse.json(
        { error: "Document not found." },
        { status: 404 }
      );
    }

    if (doc.profile_id && doc.profile_id !== user.id) {
      return NextResponse.json(
        { error: "Access denied." },
        { status: 403 }
      );
    }

    // 2. Generate signed URL from 'planify-documents' bucket (valid for 1 hour)
    const { data: signedData, error: signError } = await admin.storage
      .from("planify-documents")
      .createSignedUrl(doc.file_path, 3600, {
        download: isDownload ? doc.file_name : undefined,
      });

    if (signError || !signedData?.signedUrl) {
      console.error("Storage signed URL error:", signError);
      return NextResponse.json(
        { error: "This file is no longer available in storage." },
        { status: 404 }
      );
    }

    // 3. If client requested JSON (e.g. from an API call), return the URL
    const acceptHeader = request.headers.get("accept") || "";
    if (acceptHeader.includes("application/json")) {
      return NextResponse.json({ url: signedData.signedUrl, document: doc });
    }

    // 4. Redirect browser to the secure signed URL
    return NextResponse.redirect(signedData.signedUrl, { status: 307 });
  } catch (err) {
    console.error("Document view error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
