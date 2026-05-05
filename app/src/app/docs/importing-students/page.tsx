import Link from "next/link";

export default function ImportingStudents() {
  return (
    <>
      <h1>Importing students</h1>
      <p>
        If you already have a student list in a spreadsheet, you can import the whole roster at once
        instead of adding students one by one.
      </p>

      <h2>Prepare your CSV file</h2>
      <p>Your file needs at least a <strong>name</strong> column. All other columns are optional:</p>
      <table>
        <thead>
          <tr>
            <th>Column</th>
            <th>Required</th>
            <th>Example</th>
          </tr>
        </thead>
        <tbody>
          <tr><td><code>name</code></td><td>Yes</td><td>Alice Chen</td></tr>
          <tr><td><code>instrument</code></td><td>No</td><td>Piano</td></tr>
          <tr><td><code>duration_minutes</code></td><td>No</td><td>60</td></tr>
          <tr><td><code>rate</code></td><td>No</td><td>65</td></tr>
          <tr><td><code>parent_name</code></td><td>No</td><td>Sarah Chen</td></tr>
          <tr><td><code>parent_email</code></td><td>No</td><td>sarah@example.com</td></tr>
        </tbody>
      </table>
      <p>
        The <code>rate</code> column should be a number in dollars (e.g. <code>65</code>, not <code>$65</code>).
        Duration should be a number in minutes.
      </p>

      <h2>Export from Google Sheets</h2>
      <ol>
        <li>Open your roster spreadsheet in Google Sheets.</li>
        <li>Rename your column headers to match the names above.</li>
        <li>Go to <strong>File → Download → Comma-separated values (.csv)</strong>.</li>
      </ol>

      <h2>Export from Excel</h2>
      <ol>
        <li>Open your file in Excel.</li>
        <li>Go to <strong>File → Save As</strong> and choose <strong>CSV UTF-8</strong> as the format.</li>
      </ol>

      <h2>Run the import</h2>
      <ol>
        <li>Go to <strong>Students → Import from CSV</strong> in the sidebar.</li>
        <li>Upload your file and click <strong>Import</strong>.</li>
        <li>Cadence will add each row as a new student. Existing students are not duplicated.</li>
      </ol>

      <h2>After importing</h2>
      <p>
        Review your imported students in the <strong>Students</strong> tab. You can edit any student
        individually to fill in missing details — parent email is required for invoicing and reminders,
        so make sure it's set before the 1st of the month.
      </p>
      <p>
        Once your roster is in, go to the <Link href="/docs/recurring-lessons">Calendar</Link> to
        schedule recurring lessons.
      </p>
    </>
  );
}
