"use client";

import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";

export function SubmitButton({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={`inline-flex items-center justify-center gap-2 disabled:opacity-60 ${className ?? ""}`}
    >
      {pending && <Loader2 className="h-4 w-4 animate-spin shrink-0" />}
      {children}
    </button>
  );
}
