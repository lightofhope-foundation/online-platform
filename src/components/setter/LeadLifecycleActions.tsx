"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  convertLeadToClient,
  markLeadLost,
} from "@/app/setter/actions";

type LeadLifecycleActionsProps = {
  clientUserId: string;
};

export function LeadLifecycleActions({ clientUserId }: LeadLifecycleActionsProps) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const run = (action: "convert" | "lost") => {
    setMessage(null);
    startTransition(async () => {
      const result =
        action === "convert"
          ? await convertLeadToClient(clientUserId)
          : await markLeadLost(clientUserId);
      if (!result.ok) {
        setMessage(result.error);
        return;
      }
      setMessage(
        action === "convert"
          ? "Lead ist jetzt ein Klient — Therapeut kann zugewiesen werden."
          : "Lead als verloren markiert."
      );
      router.refresh();
    });
  };

  return (
    <section className="rounded-[20px] border border-white/12 bg-white/[0.03] p-5">
      <h2 className="mb-1 text-lg font-medium text-white">Lead-Status</h2>
      <p className="mb-4 text-sm text-white/50">
        Setter: Lead zum Klienten machen oder als verloren markieren. Therapeut-Zuweisung
        erst danach.
      </p>
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          disabled={pending}
          onClick={() => run("convert")}
          className="rounded-full bg-[#63eca9] px-5 py-2 text-sm font-medium text-black disabled:opacity-50"
        >
          Zum Klienten machen
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => run("lost")}
          className="rounded-full border border-red-400/40 bg-red-400/10 px-5 py-2 text-sm text-red-100 disabled:opacity-50"
        >
          Als verloren markieren
        </button>
      </div>
      {message ? (
        <p
          className={`mt-3 text-sm ${
            message.toLowerCase().includes("fehl") ||
            message.toLowerCase().includes("nur")
              ? "text-red-300"
              : "text-[#63eca9]"
          }`}
        >
          {message}
        </p>
      ) : null}
    </section>
  );
}
