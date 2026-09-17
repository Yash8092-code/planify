import { NextResponse } from "next/server";
import { createServerClient, createAdminClient } from "@/lib/supabase/server";
import { sendWelcomeEmail } from "@/lib/email";
import { Profile } from "@/lib/types";
import { cookies } from "next/headers";
import crypto from "crypto";

// POST /api/auth/verify-otp — Verify exact 4-digit code and establish Supabase Auth session
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, token, name, timezone } = body;

    if (!email || !token) {
      return NextResponse.json(
        { error: "Email and 4-digit verification code are required" },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanToken = token.trim();

    if (!/^\d{4}$/.test(cleanToken)) {
      return NextResponse.json(
        { error: "Verification code must be exactly 4 digits" },
        { status: 400 }
      );
    }

    const admin = createAdminClient();
    let tokenHash: string | null = null;
    let isValidCode = false;

    // A. Check user_metadata on auth.users for persistent multi-instance verification
    const { data: usersData } = await admin.auth.admin.listUsers();
    const authUser = usersData?.users?.find((u) => u.email === cleanEmail);

    if (authUser && authUser.user_metadata) {
      const { planify_otp, planify_token_hash, planify_otp_expires } = authUser.user_metadata;
      if (
        planify_otp === cleanToken &&
        planify_otp_expires &&
        Number(planify_otp_expires) > Date.now()
      ) {
        isValidCode = true;
        tokenHash = planify_token_hash;
      }
    }

    // B. Check HMAC-signed cookie fallback if metadata match wasn't found
    if (!isValidCode) {
      const cookieStore = await cookies();
      const otpCookie = cookieStore.get("planify_otp_token")?.value;
      if (otpCookie) {
        const [b64, signature] = otpCookie.split(".");
        if (b64 && signature) {
          const secret = process.env.SUPABASE_SERVICE_ROLE_KEY || "planify-secret";
          const expectedSig = crypto
            .createHmac("sha256", secret)
            .update(Buffer.from(b64, "base64").toString("utf8"))
            .digest("hex");

          if (expectedSig === signature) {
            try {
              const data = JSON.parse(Buffer.from(b64, "base64").toString("utf8"));
              if (
                data.email === cleanEmail &&
                data.code === cleanToken &&
                data.expiresAt > Date.now()
              ) {
                isValidCode = true;
                tokenHash = data.tokenHash;
              }
            } catch (e) {
              console.error("Failed to parse OTP cookie payload:", e);
            }
          }
        }
      }
    }

    if (!isValidCode) {
      return NextResponse.json(
        { error: "Invalid or expired 4-digit code. Please request a new code." },
        { status: 400 }
      );
    }

    const supabase = await createServerClient();
    let verifiedUser = authUser;
    let authSession = null;

    // Establish official Supabase Auth session using magiclink tokenHash
    if (tokenHash) {
      const { data: verifyData, error: verifyError } = await supabase.auth.verifyOtp({
        token_hash: tokenHash,
        type: "email",
      });

      if (!verifyError && verifyData.user) {
        verifiedUser = verifyData.user;
        authSession = verifyData.session;
      } else {
        console.warn("Supabase verifyOtp tokenHash attempt note:", verifyError?.message);
      }
    }

    const userId = verifiedUser?.id;
    if (!userId) {
      return NextResponse.json({ error: "Failed to authenticate workspace identity" }, { status: 500 });
    }

    // Clear the one-time OTP from user_metadata
    await admin.auth.admin.updateUserById(userId, {
      user_metadata: {
        ...verifiedUser?.user_metadata,
        planify_otp: null,
        planify_token_hash: null,
        planify_otp_expires: null,
      },
    });

    // Fetch or create profile
    const { data: existingProfile } = await admin
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    let profile: Profile;

    if (!existingProfile) {
      // Check if profile exists by email to link
      const { data: profileByEmail } = await admin
        .from("profiles")
        .select("*")
        .eq("email", cleanEmail)
        .maybeSingle();

      if (profileByEmail) {
        profile = profileByEmail as Profile;
      } else {
        const fallbackName =
          (name && String(name).trim()) ||
          verifiedUser?.user_metadata?.name ||
          cleanEmail.split("@")[0];

        const { data: createdProfile, error: profileCreateError } = await admin
          .from("profiles")
          .insert({
            id: userId,
            name: fallbackName,
            email: cleanEmail,
            timezone: timezone || "Asia/Kolkata",
            email_notifications: true,
            theme: "system",
          })
          .select()
          .single();

        if (profileCreateError) {
          console.error("Profile creation error in verify-otp:", profileCreateError);
          return NextResponse.json(
            { error: "Failed to initialize profile: " + profileCreateError.message },
            { status: 500 }
          );
        }

        profile = createdProfile as Profile;

        // Send welcome email in background
        sendWelcomeEmail(profile).catch((err) =>
          console.error("Welcome email error:", err)
        );
      }
    } else {
      profile = existingProfile as Profile;
    }

    const response = NextResponse.json({
      success: true,
      user: verifiedUser,
      profile,
      session: authSession,
    });

    // Clear the temporary OTP cookie
    response.cookies.delete("planify_otp_token");

    return response;
  } catch (err) {
    console.error("verify-otp route error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
