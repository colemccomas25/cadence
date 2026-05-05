export default function Cancellations() {
  return (
    <>
      <h1>Cancellations &amp; make-ups</h1>
      <p>
        Cadence tracks cancellations and make-up lessons per student so your invoicing stays accurate
        without extra math on your end.
      </p>

      <h2>Cancelling a lesson</h2>
      <ol>
        <li>Open the lesson in the Calendar.</li>
        <li>Click <strong>Cancel</strong>.</li>
        <li>The lesson status changes to Cancelled and is excluded from that month&apos;s invoice.</li>
      </ol>
      <p>
        Cancelling a lesson does not affect the rest of the recurring series — only that single occurrence
        is cancelled.
      </p>

      <h2>Make-up lessons</h2>
      <p>
        A make-up is a replacement lesson scheduled after a cancellation. To record one:
      </p>
      <ol>
        <li>Schedule the make-up as a one-off lesson on the new date and time.</li>
        <li>Mark the lesson type as <strong>Make-up</strong> when creating it.</li>
        <li>Mark it <strong>Held</strong> after it happens.</li>
      </ol>
      <p>
        Whether make-up lessons are invoiced depends on your cancellation policy (see below).
      </p>

      <h2>Cancellation policies</h2>
      <p>
        You can set a cancellation policy per student from their profile page. The supported policies are:
      </p>
      <ul>
        <li>
          <strong>Free cancel (24h+ notice)</strong> — cancellations with more than 24 hours notice
          are not charged. Make-up lessons are free. Late cancellations are charged at the full rate.
        </li>
        <li>
          <strong>Charge for all cancellations</strong> — every cancelled lesson is invoiced at the
          full rate regardless of notice. Make-ups are additional lessons and also invoiced.
        </li>
        <li>
          <strong>No charge, no make-ups</strong> — cancellations are simply removed from the invoice.
          No make-up is offered.
        </li>
      </ul>
      <p>
        The policy you set determines how Cadence handles the lesson status when generating invoices.
        You can override it on a per-lesson basis if needed.
      </p>

      <h2>Late cancellations</h2>
      <p>
        If a student cancels with less than 24 hours notice and your policy is <strong>Free cancel (24h+ notice)</strong>,
        mark the lesson as <strong>Held</strong> rather than Cancelled. It will be included in the invoice
        at the full rate, which is the standard way to enforce a late-cancel charge.
      </p>

      <h2>Tracking make-ups owed</h2>
      <p>
        The student profile page shows a running count of make-up lessons owed. This updates automatically
        when you cancel a lesson under a free-cancel policy. Use it to keep track of which students have
        outstanding make-ups at the end of the school year.
      </p>
    </>
  );
}
