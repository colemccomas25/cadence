import Link from "next/link";
import { createStudent } from "@/actions/students";

export default function NewStudentPage() {
  return (
    <div className="p-8 max-w-lg">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/dashboard/students" className="text-slate-400 hover:text-slate-600 text-sm">
          ← Students
        </Link>
        <span className="text-slate-300">/</span>
        <h1 className="text-xl font-semibold text-slate-900">Add student</h1>
      </div>

      <form action={createStudent} className="bg-white rounded-xl border border-slate-200 p-6 space-y-5">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Name <span className="text-red-400">*</span>
          </label>
          <input
            name="name"
            required
            placeholder="Jamie Chen"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Instrument</label>
          <input
            name="instrument"
            placeholder="Piano"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Default duration
            </label>
            <select
              name="durationMinutes"
              defaultValue="30"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="30">30 min</option>
              <option value="45">45 min</option>
              <option value="60">60 min</option>
              <option value="90">90 min</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Rate per lesson ($)
            </label>
            <input
              name="rateDollars"
              type="number"
              min="0"
              step="0.01"
              defaultValue="40"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <Link
            href="/dashboard/students"
            className="rounded-md border border-slate-300 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            className="rounded-md bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 transition-colors"
          >
            Save student
          </button>
        </div>
      </form>
    </div>
  );
}
