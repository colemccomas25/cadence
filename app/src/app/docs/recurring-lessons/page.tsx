export default function RecurringLessons() {
  return (
    <>
      <h1>Recurring lessons</h1>
      <p>
        Recurring lessons are the core of Cadence. Once you set up a weekly or biweekly slot, Cadence
        generates lessons automatically for the next 90 days and invoices only the ones you mark as held.
      </p>

      <h2>Creating a recurring lesson</h2>
      <ol>
        <li>Go to the <strong>Calendar</strong> tab and click an empty time slot.</li>
        <li>Select a student from the dropdown.</li>
        <li>Set the <strong>day of the week</strong> and <strong>start time</strong>.</li>
        <li>Choose <strong>Weekly</strong> or <strong>Biweekly</strong> as the recurrence.</li>
        <li>Click <strong>Schedule lesson</strong>.</li>
      </ol>
      <p>
        Cadence creates individual lesson entries for the next 90 days. As each day passes, new lessons
        are added automatically to keep a rolling 90-day window.
      </p>

      <h2>Marking lessons as held, cancelled, or make-up</h2>
      <p>Each lesson has three possible states:</p>
      <ul>
        <li><strong>Held</strong> — lesson happened. Included in the monthly invoice.</li>
        <li><strong>Cancelled</strong> — lesson did not happen. Not invoiced.</li>
        <li><strong>Make-up</strong> — a replacement lesson for a cancelled one. Handled according to your cancellation policy.</li>
      </ul>
      <p>
        Click any lesson in the calendar to update its status. Only lessons marked <strong>Held</strong>
        count toward the invoice total.
      </p>

      <h2>Handling school breaks and exceptions</h2>
      <p>
        For a week off (spring break, holiday, etc.), open each affected lesson in the calendar and mark
        it <strong>Cancelled</strong>. You can do this in bulk by clicking each lesson in the week view.
      </p>
      <p>
        If you want to skip a single occurrence without cancelling the whole series, just cancel that
        individual lesson — the rest of the series is unaffected.
      </p>

      <h2>Editing or ending a recurring series</h2>
      <p>
        To change the time or day of a recurring slot, cancel the remaining lessons and create a new
        series with the updated schedule. This gives you a clean history and accurate invoicing.
      </p>
      <p>
        At the end of the school year, cancel all future lessons in the series. You can start a fresh
        series in September.
      </p>

      <h2>One-off lessons</h2>
      <p>
        For a one-time lesson (trial, intensive, summer workshop), create a lesson without selecting
        a recurrence. It will appear in the calendar and be invoiced like any held lesson, but won't
        generate future occurrences.
      </p>
    </>
  );
}
