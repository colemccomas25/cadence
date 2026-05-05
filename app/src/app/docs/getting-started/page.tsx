import Link from "next/link";

export default function GettingStarted() {
  return (
    <>
      <h1>Getting started</h1>
      <p>Set up your studio in under 10 minutes — no credit card required for the free plan.</p>

      <h2>Step 1 — Create your account</h2>
      <p>
        Go to <Link href="/login">cadence.app/login</Link> and sign in with Google or your email address.
        Your studio is created automatically on first login.
      </p>

      <h2>Step 2 — Add your first student</h2>
      <p>From the dashboard, click <strong>Add a student</strong>. Fill in:</p>
      <ul>
        <li><strong>Name</strong> — the student's name</li>
        <li><strong>Instrument</strong> — optional but useful for filtering</li>
        <li><strong>Lesson duration</strong> — 30, 45, or 60 minutes</li>
        <li><strong>Rate</strong> — your per-lesson rate in dollars</li>
        <li><strong>Parent name &amp; email</strong> — required for invoicing and reminders</li>
      </ul>
      <p>
        Have more than 5 students? Use <Link href="/docs/importing-students">CSV import</Link> to bring
        your whole roster over at once.
      </p>

      <h2>Step 3 — Schedule a recurring lesson</h2>
      <p>
        Go to the <strong>Calendar</strong> tab and click any empty time slot. Pick the student, set the
        day and time, and choose <strong>Weekly</strong> or <strong>Biweekly</strong>. Cadence creates
        lessons for the next 90 days automatically.
      </p>
      <p>
        See <Link href="/docs/recurring-lessons">Recurring lessons</Link> for how to handle school-year
        gaps, spring break, and other exceptions.
      </p>

      <h2>Step 4 — Mark a lesson as held</h2>
      <p>
        After each lesson, open the calendar entry and click <strong>Mark held</strong>. Only held lessons
        are included in the monthly invoice — cancelled and make-up lessons are handled separately.
      </p>

      <h2>Step 5 — Send your first invoice</h2>
      <p>
        On the 1st of each month, Cadence automatically emails parents a Stripe payment link for the
        previous month's held lessons. You can also trigger a one-off invoice any time from the
        <strong> Invoices</strong> tab.
      </p>
      <p>
        See <Link href="/docs/invoicing">Invoicing</Link> for full details on how billing works.
      </p>

      <h2>Need help?</h2>
      <p>
        Reply to any email from Cadence — that goes directly to Cole, the founder. Or email{" "}
        <a href="mailto:cole@cadence.app">cole@cadence.app</a>.
      </p>
    </>
  );
}
