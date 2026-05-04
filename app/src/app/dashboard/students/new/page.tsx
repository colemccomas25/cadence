import Link from "next/link";
import { StudentCreateForm } from "@/components/student-form";

export default function NewStudentPage() {
  return (
    <div className="px-4 py-6 md:px-8 md:py-8 max-w-lg">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/dashboard/students" className="text-slate-400 hover:text-slate-600 text-sm">
          ← Students
        </Link>
        <span className="text-slate-300">/</span>
        <h1 className="text-xl font-semibold text-slate-900">Add student</h1>
      </div>

      <StudentCreateForm />
    </div>
  );
}
