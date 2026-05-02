import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const FROM = process.env.EMAIL_FROM ?? "Cadence <hello@cadence.app>";

type EmailArgs = {
  to: string;
  subject: string;
  html: string;
  text?: string;
};

export async function sendEmail({ to, subject, html, text }: EmailArgs) {
  if (!resend) {
    console.warn("[email] RESEND_API_KEY not set — would have sent:", { to, subject });
    return { skipped: true as const };
  }
  return resend.emails.send({ from: FROM, to, subject, html, text });
}

// --- typed templates ---

export function lessonReminderEmail(opts: {
  parentName?: string | null;
  studentName: string;
  whenLocal: string; // already formatted in studio TZ
}) {
  return {
    subject: `Reminder: ${opts.studentName}'s lesson tomorrow`,
    html: `<p>Hi${opts.parentName ? ` ${opts.parentName}` : ""},</p>
<p>Just a heads-up — ${opts.studentName} has a lesson tomorrow at <strong>${opts.whenLocal}</strong>.</p>
<p>If you need to cancel or reschedule, please reply to this email at least 24 hours in advance.</p>
<p>Thanks!</p>`,
  };
}

export function invoiceEmail(opts: {
  parentName?: string | null;
  studioName: string;
  amountFormatted: string;
  periodLabel: string;
  payUrl: string;
}) {
  return {
    subject: `${opts.studioName} — invoice for ${opts.periodLabel} (${opts.amountFormatted})`,
    html: `<p>Hi${opts.parentName ? ` ${opts.parentName}` : ""},</p>
<p>Your invoice for <strong>${opts.periodLabel}</strong> is ready: <strong>${opts.amountFormatted}</strong>.</p>
<p><a href="${opts.payUrl}" style="display:inline-block;padding:10px 18px;background:#5b6cff;color:#fff;text-decoration:none;border-radius:6px">Pay invoice</a></p>
<p>Thanks for being part of ${opts.studioName}.</p>`,
  };
}
