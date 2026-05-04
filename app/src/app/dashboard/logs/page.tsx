import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getOrCreateStudio } from "@/lib/studio";
import { db } from "@/db";
import { emailLogs } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

const TYPE_LABEL: Record<string, string> = {
  invoice: "Invoice",
  lesson_reminder: "Reminder",
  receipt: "Receipt",
};

export default async function LogsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const user = session.user as { id?: string; email?: string | null; name?: string | null };
  const studio = await getOrCreateStudio(user.id, user.email ?? undefined, user.name);

  const logs = await db
    .select()
    .from(emailLogs)
    .where(eq(emailLogs.studioId, studio.id))
    .orderBy(desc(emailLogs.createdAt))
    .limit(100);

  return (
    <div className="px-4 py-6 md:px-12 md:py-8">
      <h1 className="text-xl font-semibold text-slate-900 mb-6">Email logs</h1>

      {logs.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-slate-300 p-6 text-center">
          <p className="text-slate-500 text-sm">No emails sent yet.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left">
                <th className="px-4 py-3 font-medium text-slate-500">Type</th>
                <th className="px-4 py-3 font-medium text-slate-500">To</th>
                <th className="px-4 py-3 font-medium text-slate-500">Subject</th>
                <th className="px-4 py-3 font-medium text-slate-500">Status</th>
                <th className="px-4 py-3 font-medium text-slate-500">Sent</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-slate-600">
                    {TYPE_LABEL[log.type] ?? log.type}
                  </td>
                  <td className="px-4 py-3 text-slate-700">{log.toEmail}</td>
                  <td className="px-4 py-3 text-slate-500 max-w-xs truncate">{log.subject}</td>
                  <td className="px-4 py-3">
                    {log.status === "sent" ? (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-green-50 text-green-700">Sent</span>
                    ) : (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-red-50 text-red-600" title={log.error ?? ""}>
                        Failed
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-400 text-xs whitespace-nowrap">
                    {new Date(log.createdAt).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
