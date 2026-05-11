"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { sendCardSetupLink, toggleAutoCharge } from "@/actions/parent-cards";

export function ParentAutoChargeControls({
  parentId,
  hasCard,
  autoChargeEnabled: initialAutoCharge,
}: {
  parentId: string;
  hasCard: boolean;
  autoChargeEnabled: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const [autoCharge, setAutoCharge] = useState(initialAutoCharge);

  const handleSendLink = () => {
    startTransition(async () => {
      const result = await sendCardSetupLink(parentId);
      if (result.success) toast.success("Card setup email sent");
      else toast.error(result.error);
    });
  };

  const handleToggle = () => {
    const next = !autoCharge;
    setAutoCharge(next);
    startTransition(async () => {
      const result = await toggleAutoCharge(parentId, next);
      if (!result.success) {
        setAutoCharge(!next);
        toast.error(result.error);
      }
    });
  };

  return (
    <div className="flex items-center gap-3 flex-wrap mt-1.5">
      <button
        type="button"
        onClick={handleSendLink}
        disabled={isPending}
        className="text-xs text-accent hover:underline disabled:opacity-50"
      >
        {hasCard ? "Resend card link" : "Send card setup link"}
      </button>
      {hasCard && (
        <>
          <span className="text-xs text-emerald-600 font-medium">Card on file</span>
          <button
            type="button"
            onClick={handleToggle}
            disabled={isPending}
            aria-label={`Auto-charge ${autoCharge ? "on" : "off"}`}
            className={`relative inline-flex h-4 w-8 items-center rounded-full transition-colors disabled:opacity-50 ${
              autoCharge ? "bg-accent" : "bg-stone-300"
            }`}
          >
            <span
              className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                autoCharge ? "translate-x-4" : "translate-x-0.5"
              }`}
            />
          </button>
          <span className="text-xs text-inkSubtle">
            Auto-charge {autoCharge ? "on" : "off"}
          </span>
        </>
      )}
    </div>
  );
}
