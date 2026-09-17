import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { sendOtpEmail } from "@/lib/email";
import crypto from "crypto";

// POST /api/auth/send-otp — Send exact 4-digit verification code to user email
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json({ error: "Valid email address is required" }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();
    const admin = createAdminClient();

    // 1. Check if user already exists in profiles
    const { data: existingProfile } = await admin
      .from("profiles")
      .select("id, name, email")
      .eq("email", cleanEmail)
      .maybeSingle();

    // 2. Ensure user exists in auth.users
    let authUserId: string | null = existingProfile?.id || null;

    if (!authUserId) {
      const { data: createData, error: createError } = await admin.auth.admin.createUser({
        email: cleanEmail,
        email_confirm: true,
        user_metadata: { name: body.name ? String(body.name).trim() : "" },
      });

      if (createError && !createError.message.includes("already registered")) {
        console.error("Error ensuring auth user:", createError);
      } else if (createData?.user) {
        authUserId = createData.user.id;
      }
    }

    // Fallback: search auth users list if needed
    if (!authUserId) {
      const { data: usersData } = await admin.auth.admin.listUsers();
      const existingAuthUser = usersData?.users?.find((u) => u.email === cleanEmail);
      if (existingAuthUser) {
        authUserId = existingAuthUser.id;
      }
    }

    // 3. Generate exact 4-DIGIT verification code (1000 - 9999)
    const fourDigitCode = Math.floor(1000 + Math.random() * 9000).toString();

    // 4. Generate Supabase magiclink to obtain the auth token hash for session establishment
    const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
      type: "magiclink",
      email: cleanEmail,
    });

    if (linkError) {
      console.error("generateLink error:", linkError);
      return NextResponse.json(
        { error: "Failed to initialize verification code. Please try again." },
        { status: 500 }
      );
    }

    const tokenHash = linkData?.properties?.hashed_token;
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

    // 5. Store 4-digit code in user_metadata for reliable multi-instance persistence
    if (authUserId) {
      await admin.auth.admin.updateUserById(authUserId, {
        user_metadata: {
          planify_otp: fourDigitCode,
          planify_token_hash: tokenHash,
          planify_otp_expires: expiresAt,
        },
      });
    }

    // 6. Send the 4-digit verification code via Resend
    sendOtpEmail(cleanEmail, fourDigitCode).catch((err) =>
      console.error("Failed to dispatch OTP email via Resend:", err)
    );

    // 7. Create signed cookie for fast local client verification fallback
    const secret = process.env.SUPABASE_SERVICE_ROLE_KEY || "planify-secret";
    const payload = JSON.stringify({ email: cleanEmail, code: fourDigitCode, tokenHash, expiresAt });
    const hmac = crypto.createHmac("sha256", secret).update(payload).digest("hex");
    const cookieValue = Buffer.from(payload).toString("base64") + "." + hmac;

    const response = NextResponse.json({
      success: true,
      exists: !!existingProfile,
      message: existingProfile
        ? "Welcome back! Enter the 4-digit code sent to your email to sync this device."
        : "We sent a 4-digit verification code to your email to verify your workspace.",
    });

    response.cookies.set("planify_otp_token", cookieValue, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 600, // 10 minutes
      path: "/",
    });

    return response;
  } catch (err) {
    console.error("send-otp route error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
