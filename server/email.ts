/**
 * Resend email client — transactional emails (welcome, billing receipts, etc.)
 * Env vars required:
 *   RESEND_API_KEY  — from resend.com dashboard
 *   FROM_EMAIL      — e.g. "Outleadrr <noreply@outleadrr.com>"
 *
 * Usage:
 *   import { sendEmail } from "./email";
 *   await sendEmail({ to: "user@example.com", subject: "Welcome!", html: "<p>Hi</p>" });
 */
import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const FROM = process.env.FROM_EMAIL || "Outleadrr <noreply@outleadrr.com>";

interface SendOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
}

export async function sendEmail(opts: SendOptions): Promise<boolean> {
  if (!resend) {
    console.warn("[Resend] RESEND_API_KEY not set — email not sent:", opts.subject);
    return false;
  }
  try {
    const { error } = await resend.emails.send({
      from: FROM,
      to: Array.isArray(opts.to) ? opts.to : [opts.to],
      subject: opts.subject,
      html: opts.html,
      text: opts.text,
      reply_to: opts.replyTo,
    });
    if (error) { console.error("[Resend] Send error:", error); return false; }
    return true;
  } catch (err) {
    console.error("[Resend] Exception:", err);
    return false;
  }
}

/** Welcome email sent on signup */
export async function sendWelcomeEmail(userEmail: string): Promise<void> {
  await sendEmail({
    to: userEmail,
    subject: "Welcome to Outleadrr 🚀",
    html: `
      <div style="font-family:'Helvetica Neue',Arial,sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#07070a;color:#ededed;border-radius:16px;">
        <h1 style="font-size:24px;font-weight:800;margin-bottom:8px;color:#ffffff;">Welcome to Outleadrr</h1>
        <p style="font-size:15px;color:#a1a1aa;margin-bottom:24px;line-height:1.6;">Your AI-powered lead generation engine is ready. Generate hyper-targeted leads and personalised outreach emails in minutes.</p>
        <a href="https://outleadrr.com/app" style="display:inline-block;padding:12px 24px;background:linear-gradient(135deg,#7c3aed,#8b5cf6);color:#ffffff;text-decoration:none;border-radius:10px;font-weight:700;font-size:14px;">Start your first campaign →</a>
        <p style="margin-top:32px;font-size:12px;color:#52525b;">You received this because you signed up at outleadrr.com.</p>
      </div>
    `,
  });
}
