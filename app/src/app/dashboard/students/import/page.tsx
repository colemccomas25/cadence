import { importStudentsCsv } from "@/actions/students";

export default function ImportPage() {
  return (
    <div className="p-8 max-w-xl">
      <h1 className="text-xl font-semibold text-slate-900 mb-2">Import students from CSV</h1>
      <p className="text-sm text-slate-500 mb-6">
        Upload a CSV file to bulk-add students. One student per row.
      </p>

      <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-700 mb-6">
        <strong>Required columns:</strong> <code>name</code><br />
        <strong>Optional columns:</strong>{" "}
        <code>instrument</code>, <code>duration_minutes</code>, <code>rate</code>,{" "}
        <code>parent_name</code>, <code>parent_email</code>
      </div>

      <form action={importStudentsCsv} encType="multipart/form-data" className="space-y-4">
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <label className="block text-xs font-medium text-slate-600 mb-2">CSV file</label>
          <input
            name="file"
            type="file"
            accept=".csv,text/csv"
            required
            className="block w-full text-sm text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-medium file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200"
          />
        </div>
        <button
          type="submit"
          className="w-full rounded-md bg-brand-500 py-2 text-sm font-medium text-white hover:bg-brand-600 transition-colors"
        >
          Import
        </button>
      </form>

      <div className="mt-8">
        <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Example CSV</h2>
        <pre className="bg-slate-50 rounded-lg border border-slate-200 p-4 text-xs text-slate-600 overflow-x-auto">{`name,instrument,duration_minutes,rate,parent_name,parent_email
Alice Chen,Piano,60,65,Sarah Chen,sarah@example.com
Ben Kim,Guitar,30,45,Jin Kim,jin@example.com
Maya Patel,Violin,45,55,,`}</pre>
      </div>
    </div>
  );
}
