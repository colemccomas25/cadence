import Link from "next/link";

export default function Invoicing() {
  return (
    <>
      <h1>Invoicing</h1>
      <p>
        Cadence invoices automatically on the 1st of each month. Parents pay via Stripe — no merchant
        account required on your end, and Cadence takes nothing on top of Stripe&apos;s standard rate.
      </p>

      <h2>How automatic invoicing works</h2>
      <ol>
        <li>At 9am UTC on the 1st of each month, Cadence tallies all <strong>held</strong> lessons from the previous month.</li>
        <li>Lessons are grouped by parent email. Siblings sharing a parent get one combined invoice.</li>
        <li>Each parent receives an email with a Stripe payment link for the total owed.</li>
        <li>When the parent pays, you see the invoice update to <strong>Paid</strong> in your dashboard in real time.</li>
        <li>The parent receives a receipt automatically.</li>
      </ol>
      <p>
        Only lessons marked <strong>Held</strong> are included. Cancelled lessons and unpaid make-ups
        are excluded. See <Link href="/docs/cancellations">Cancellations</Link> for how make-ups affect billing.
      </p>

      <h2>Sending a one-off invoice</h2>
      <p>
        You don&apos;t have to wait for the 1st. From the <strong>Invoices</strong> tab, click{" "}
        <strong>Generate invoice</strong> and select the month you want to invoice. Cadence creates the
        invoice and emails the payment link immediately.
      </p>
      <p>
        This is useful if you&apos;re starting mid-month, want to settle up before a break, or need to
        correct a prior invoice.
      </p>

      <h2>Family billing</h2>
      <p>
        If two students share the same parent email, they are automatically combined into a single invoice.
        The line items show each student and their lesson total separately, with one payment link for the total.
      </p>
      <p>
        To set this up, make sure both students have the same <strong>parent email</strong> on their
        student profiles.
      </p>

      <h2>Fees</h2>
      <p>
        Cadence charges nothing on top of payments. Parents pay Stripe&apos;s standard processing fee
        (2.9% + 30¢ per transaction in the US). That fee is deducted from the amount deposited to your
        connected bank account.
      </p>
      <p>
        Your Cadence subscription (Solo or Studio plan) is billed separately and does not affect invoice payouts.
      </p>

      <h2>Invoice statuses</h2>
      <ul>
        <li><strong>Draft</strong> — generated but not yet sent.</li>
        <li><strong>Sent</strong> — parent has received the payment email.</li>
        <li><strong>Paid</strong> — payment confirmed by Stripe.</li>
        <li><strong>Overdue</strong> — sent more than 30 days ago with no payment.</li>
      </ul>
    </>
  );
}
