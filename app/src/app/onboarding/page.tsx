import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getOrCreateStudio } from "@/lib/studio";
import { OnboardingForm } from "./onboarding-form";

export default async function OnboardingPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const user = session.user as { id?: string; email?: string | null; name?: string | null };
  const studio = await getOrCreateStudio(user.id, user.email ?? undefined, user.name);

  if (studio.onboardingCompletedAt) redirect("/dashboard");

  return (
    <div className="min-h-screen bg-paper flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8">
          <div className="text-2xl font-display tracking-tight text-ink mb-1">
            Cadence<span className="text-accent">.</span>
          </div>
          <h1 className="text-xl font-semibold text-ink mt-4">Welcome to Cadence.</h1>
          <p className="text-sm text-inkSubtle mt-1">
            Tell us a bit about your studio. You can change any of this later in settings.
          </p>
        </div>
        <OnboardingForm defaultName={studio.name} />
      </div>
    </div>
  );
}
