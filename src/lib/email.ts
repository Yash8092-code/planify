import { Resend } from "resend";
import { Profile, Task } from "@/lib/types";
import { getDailyQuote } from "@/lib/utils";

// Initialize Resend client
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

// The sender address — in dev mode Resend allows onboarding@resend.dev
const FROM_EMAIL = process.env.EMAIL_FROM || process.env.RESEND_FROM_EMAIL || "Planify <onboarding@resend.dev>";

/** Generate HTML email template for Morning Daily Checklist */
export function generateMorningEmailHtml(profile: Profile, tasks: Task[]): string {
  const quote = getDailyQuote();
  const dateStr = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  const taskListHtml =
    tasks.length > 0
      ? tasks
          .map(
            (t) => `
          <tr style="border-bottom: 1px solid #e5e7eb;">
            <td style="padding: 12px 8px; font-size: 14px; color: #1f2937;">
              <strong>${t.title}</strong>
              ${t.description ? `<br/><span style="font-size: 12px; color: #6b7280;">${t.description}</span>` : ""}
            </td>
            <td style="padding: 12px 8px; font-size: 12px; text-align: right;">
              <span style="display: inline-block; padding: 2px 8px; border-radius: 9999px; font-weight: 600; text-transform: capitalize; ${
                t.priority === "high"
                  ? "background: #fee2e2; color: #dc2626;"
                  : t.priority === "medium"
                  ? "background: #fef3c7; color: #d97706;"
                  : "background: #dbeafe; color: #2563eb;"
              }">
                ${t.priority}
              </span>
            </td>
          </tr>`
          )
          .join("")
      : `<tr><td colspan="2" style="padding: 24px; text-align: center; color: #6b7280; font-size: 14px;">No tasks scheduled yet. Open Planify to plan your day!</td></tr>`;

  return `
  <!DOCTYPE html>
  <html>
    <head>
      <meta charset="utf-8">
      <title>Good Morning from Planify</title>
    </head>
    <body style="margin: 0; padding: 24px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f9fafb;">
      <div style="max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e5e7eb; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%); padding: 32px 24px; color: #ffffff; text-align: center;">
          <h1 style="margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.025em;">Planify</h1>
          <p style="margin: 8px 0 0 0; font-size: 14px; opacity: 0.9;">Your Daily Productivity Brief</p>
        </div>

        <!-- Greeting & Quote -->
        <div style="padding: 24px;">
          <h2 style="margin: 0 0 4px 0; font-size: 18px; color: #111827;">Good Morning, ${profile.name.split(" ")[0]} ☀️</h2>
          <p style="margin: 0 0 16px 0; font-size: 13px; color: #6b7280;">${dateStr}</p>
          
          <div style="background: #f3f4f6; border-left: 4px solid #7c3aed; padding: 12px 16px; border-radius: 4px; margin-bottom: 24px;">
            <p style="margin: 0; font-size: 13px; font-style: italic; color: #4b5563;">&ldquo;${quote}&rdquo;</p>
          </div>

          <h3 style="margin: 0 0 12px 0; font-size: 15px; color: #111827; font-weight: 600;">Today's Priorities (${tasks.length})</h3>
          
          <!-- Tasks Table -->
          <table style="width: 100%; border-collapse: collapse;">
            <tbody>
              ${taskListHtml}
            </tbody>
          </table>

          <!-- Button -->
          <div style="text-align: center; margin-top: 32px;">
            <a href="http://localhost:3000/dashboard" style="display: inline-block; background: #7c3aed; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-size: 14px; font-weight: 600;">
              Open Planify Dashboard &rarr;
            </a>
          </div>
        </div>

        <!-- Footer -->
        <div style="background: #f9fafb; padding: 16px 24px; text-align: center; font-size: 12px; color: #9ca3af; border-top: 1px solid #e5e7eb;">
          You received this email because daily notifications are enabled in Planify.
        </div>
      </div>
    </body>
  </html>
  `;
}

/** Generate HTML email template for 100% Task Completion */
export function generateCompletionEmailHtml(profile: Profile, tasks: Task[]): string {
  return `
  <!DOCTYPE html>
  <html>
    <head>
      <meta charset="utf-8">
      <title>All Tasks Completed! 🎉</title>
    </head>
    <body style="margin: 0; padding: 24px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f9fafb;">
      <div style="max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e5e7eb; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 36px 24px; color: #ffffff; text-align: center;">
          <div style="font-size: 40px; margin-bottom: 8px;">🎉</div>
          <h1 style="margin: 0; font-size: 24px; font-weight: 800;">Incredible Job, ${profile.name.split(" ")[0]}!</h1>
          <p style="margin: 8px 0 0 0; font-size: 14px; opacity: 0.95;">You've completed 100% of your daily checklist!</p>
        </div>

        <!-- Body -->
        <div style="padding: 28px 24px; text-align: center;">
          <h2 style="font-size: 18px; color: #111827; margin: 0 0 8px 0;">Productivity Goal Smashed 🚀</h2>
          <p style="font-size: 14px; color: #4b5563; line-height: 1.5; margin: 0 0 24px 0;">
            All <strong>${tasks.length} tasks</strong> scheduled for today have been checked off. Take a moment to celebrate your discipline and consistency today.
          </p>

          <div style="display: inline-block; background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 12px; padding: 16px 24px; margin-bottom: 24px;">
            <span style="font-size: 28px; font-weight: 800; color: #059669;">100%</span>
            <span style="display: block; font-size: 12px; color: #065f46; margin-top: 2px;">Daily Completion Rate</span>
          </div>

          <div>
            <a href="http://localhost:3000/statistics" style="display: inline-block; background: #10b981; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-size: 14px; font-weight: 600;">
              View Your Productivity Stats &rarr;
            </a>
          </div>
        </div>

        <!-- Footer -->
        <div style="background: #f9fafb; padding: 16px 24px; text-align: center; font-size: 12px; color: #9ca3af; border-top: 1px solid #e5e7eb;">
          Keep the streak going tomorrow with Planify!
        </div>
      </div>
    </body>
  </html>
  `;
}

/** Send morning checklist email via Resend */
export async function sendMorningEmail(profile: Profile, tasks: Task[]): Promise<boolean> {
  if (!resend || !process.env.RESEND_API_KEY || process.env.RESEND_API_KEY.includes("placeholder")) {
    console.warn("Resend API key not configured. Skipping email dispatch.");
    return false;
  }

  try {
    const html = generateMorningEmailHtml(profile, tasks);
    await resend.emails.send({
      from: FROM_EMAIL,
      to: profile.email,
      subject: `☀️ Planify Daily Brief — ${tasks.length} tasks for today`,
      html,
    });
    return true;
  } catch (err) {
    console.error("Failed to send morning email:", err);
    return false;
  }
}

/** Send completion celebration email via Resend */
export async function sendCompletionEmail(profile: Profile, tasks: Task[]): Promise<boolean> {
  if (!resend || !process.env.RESEND_API_KEY || process.env.RESEND_API_KEY.includes("placeholder")) {
    console.warn("Resend API key not configured. Skipping celebration email.");
    return false;
  }

  try {
    const html = generateCompletionEmailHtml(profile, tasks);
    await resend.emails.send({
      from: FROM_EMAIL,
      to: profile.email,
      subject: `🎉 Congratulations ${profile.name.split(" ")[0]}! All tasks completed today!`,
      html,
    });
    return true;
  } catch (err) {
    console.error("Failed to send completion email:", err);
    return false;
  }
}

/** Generate HTML email template for Welcome / Signup */
export function generateWelcomeEmailHtml(profile: Profile): string {
  return `
  <!DOCTYPE html>
  <html>
    <head>
      <meta charset="utf-8">
      <title>Welcome to Planify!</title>
    </head>
    <body style="margin: 0; padding: 24px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f9fafb;">
      <div style="max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e5e7eb; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #7c3aed 0%, #a855f7 50%, #6366f1 100%); padding: 40px 24px; color: #ffffff; text-align: center;">
          <div style="font-size: 48px; margin-bottom: 12px;">✨</div>
          <h1 style="margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -0.025em;">Welcome to Planify!</h1>
          <p style="margin: 8px 0 0 0; font-size: 15px; opacity: 0.9;">Your personal productivity companion is ready.</p>
        </div>

        <!-- Body -->
        <div style="padding: 32px 24px;">
          <h2 style="margin: 0 0 8px 0; font-size: 20px; color: #111827;">Hey ${profile.name.split(" ")[0]}! 👋</h2>
          <p style="margin: 0 0 24px 0; font-size: 14px; color: #4b5563; line-height: 1.6;">
            Thanks for signing up! Planify is designed to help you stay organized, build productive habits, and achieve your goals — all in one beautiful workspace.
          </p>

          <!-- Feature Cards -->
          <div style="margin-bottom: 28px;">
            <div style="background: #f5f3ff; border-radius: 12px; padding: 16px; margin-bottom: 12px;">
              <div style="font-size: 14px; font-weight: 600; color: #7c3aed; margin-bottom: 4px;">📋 Daily Checklist</div>
              <div style="font-size: 13px; color: #4b5563;">Plan your day with priorities. Tasks roll over automatically so nothing slips through.</div>
            </div>
            <div style="background: #fefce8; border-radius: 12px; padding: 16px; margin-bottom: 12px;">
              <div style="font-size: 14px; font-weight: 600; color: #ca8a04; margin-bottom: 4px;">📝 Notes</div>
              <div style="font-size: 13px; color: #4b5563;">Capture ideas, meeting notes, and thoughts — pinned and searchable.</div>
            </div>
            <div style="background: #ecfdf5; border-radius: 12px; padding: 16px; margin-bottom: 12px;">
              <div style="font-size: 14px; font-weight: 600; color: #059669; margin-bottom: 4px;">📊 Statistics</div>
              <div style="font-size: 13px; color: #4b5563;">Track your productivity trends and completion streaks over time.</div>
            </div>
            <div style="background: #eff6ff; border-radius: 12px; padding: 16px;">
              <div style="font-size: 14px; font-weight: 600; color: #2563eb; margin-bottom: 4px;">📄 Documents</div>
              <div style="font-size: 13px; color: #4b5563;">Upload and organize your important files in one secure place.</div>
            </div>
          </div>

          <!-- CTA Button -->
          <div style="text-align: center; margin-top: 32px;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/dashboard" style="display: inline-block; background: linear-gradient(135deg, #7c3aed 0%, #6366f1 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 10px; font-size: 15px; font-weight: 700; box-shadow: 0 4px 14px rgba(124, 58, 237, 0.35);">
              Open Your Dashboard &rarr;
            </a>
          </div>
        </div>

        <!-- Footer -->
        <div style="background: #f9fafb; padding: 20px 24px; text-align: center; font-size: 12px; color: #9ca3af; border-top: 1px solid #e5e7eb;">
          You're receiving this because you just signed up for Planify.<br/>
          Your data is stored securely on your own database.
        </div>
      </div>
    </body>
  </html>
  `;
}

/** Send welcome email via Resend after signup */
export async function sendWelcomeEmail(profile: Profile): Promise<boolean> {
  if (!resend || !process.env.RESEND_API_KEY || process.env.RESEND_API_KEY.includes("placeholder")) {
    console.warn("Resend API key not configured. Skipping welcome email.");
    return false;
  }

  try {
    const html = generateWelcomeEmailHtml(profile);
    await resend.emails.send({
      from: FROM_EMAIL,
      to: profile.email,
      subject: `Welcome to Planify, ${profile.name.split(" ")[0]}! ✨`,
      html,
    });
    console.log(`Welcome email sent to ${profile.email}`);
    return true;
  } catch (err) {
    console.error("Failed to send welcome email:", err);
    return false;
  }
}
