import { Resend } from "resend";
import { db } from "@/db";
import { emailLogs } from "@/db/schema";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const FROM = process.env.EMAIL_FROM ?? "Cadence <onboarding@resend.dev>";

type EmailArgs = {
  to: string;
  subject: string;
  html: string;
  text?: string;
  studioId?: string | null;
  type: string;
};

export async function sendEmail({ to, subject, html, text, studioId, type }: EmailArgs) {
  let status = "sent";
  let error: string | undefined;

  if (!resend) {
    console.warn("[email] RESEND_API_KEY not set — would have sent:", { to, subject });
    status = "failed";
    error = "RESEND_API_KEY not configured";
  } else {
    try {
      await resend.emails.send({ from: FROM, to, subject, html, text });
    } catch (err) {
      status = "failed";
      error = String(err);
    }
  }

  await db.insert(emailLogs).values({
    studioId: studioId ?? null,
    type,
    toEmail: to,
    subject,
    status,
    error: error ?? null,
  });

  return status === "sent";
}

// --- typed templates ---

export function lessonReminderHtml(opts: {
  parentName?: string | null;
  studentName: string;
  whenLocal: string;
}) {
  return `
    <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;color:#1e293b">
      <h2 style="margin:0 0 16px;font-size:18px">Lesson reminder</h2>
      <p style="margin:0 0 12px;color:#475569">Hi${opts.parentName ? ` ${opts.parentName}` : ""},</p>
      <p style="margin:0 0 20px;color:#475569">
        Just a reminder that <strong>${opts.studentName}</strong> has a lesson tomorrow at
        <strong>${opts.whenLocal}</strong>.
      </p>
      <p style="margin:0;font-size:12px;color:#94a3b8">
        Need to cancel? Reply to this email at least 24 hours in advance.
      </p>
    </div>`;
}

export function cardSetupEmailHtml(opts: {
  studioName: string;
  parentName?: string | null;
  url: string;
}) {
  return `
    <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;color:#1e293b">
      <h2 style="margin:0 0 16px;font-size:18px">Save a card with ${opts.studioName}</h2>
      <p style="margin:0 0 12px;color:#475569">Hi${opts.parentName ? ` ${opts.parentName}` : ""},</p>
      <p style="margin:0 0 20px;color:#475569">
        Your teacher has invited you to save a card on file for automatic monthly billing.
      </p>
      <a href="${opts.url}" style="display:inline-block;background:#6366f1;color:#fff;text-decoration:none;padding:12px 28px;border-radius:6px;font-weight:600;font-size:15px;margin-bottom:24px">
        Save card securely
      </a>
      <p style="margin:0 0 12px;font-size:13px;color:#475569">
        By saving a card, you authorize <strong>${opts.studioName}</strong> to charge it for
        monthly lesson invoices going forward. You can remove the card at any time by replying
        to this email.
      </p>
      <p style="margin:0;font-size:12px;color:#94a3b8">This link expires in 24 hours and can only be used once.</p>
    </div>`;
}

export function parentMagicLinkHtml(opts: { url: string }) {
  return `
    <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;color:#1e293b">
      <h2 style="margin:0 0 16px;font-size:18px">Sign in to your Cadence parent portal</h2>
      <p style="margin:0 0 20px;color:#475569">Click the button below to sign in. This link expires in 20 minutes.</p>
      <a href="${opts.url}" style="display:inline-block;background:#6366f1;color:#fff;text-decoration:none;padding:12px 28px;border-radius:6px;font-weight:600;font-size:15px;margin-bottom:24px">
        Sign in to portal
      </a>
      <p style="margin:0;font-size:12px;color:#94a3b8">If you didn't request this, you can safely ignore this email.</p>
    </div>`;
}

export function receiptHtml(opts: {
  parentName?: string | null;
  studioName: string;
  amountFormatted: string;
  periodLabel: string;
}) {
  return `
    <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;color:#1e293b">
      <h2 style="margin:0 0 16px;font-size:18px">Payment received — thank you!</h2>
      <p style="margin:0 0 12px;color:#475569">Hi${opts.parentName ? ` ${opts.parentName}` : ""},</p>
      <p style="margin:0 0 20px;color:#475569">
        We received your payment of <strong>${opts.amountFormatted}</strong> for
        <strong>${opts.studioName}</strong> lessons in ${opts.periodLabel}. You're all set!
      </p>
      <p style="margin:0;font-size:12px;color:#94a3b8">Keep this email as your receipt.</p>
    </div>`;
}
