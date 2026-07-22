"use client";

import { useState, useTransition } from "react";
import {
  setterSaveIntake,
  type ClientIntakeData,
} from "@/app/setter/actions";

const VALUE_TAGS = [
  "Trennung",
  "Angst",
  "Depression",
  "Trauma",
  "Burnout",
  "ADHS",
];

type ClientIntakeFormProps = {
  clientUserId: string;
  initial: ClientIntakeData;
};

function field(
  label: string,
  value: string,
  onChange: (v: string) => void,
  rows = 3
) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-white/55">{label}</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        className="w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-sm text-white"
      />
    </div>
  );
}

export function ClientIntakeForm({ clientUserId, initial }: ClientIntakeFormProps) {
  const [data, setData] = useState<ClientIntakeData>(initial);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const set = <K extends keyof ClientIntakeData>(key: K, value: ClientIntakeData[K]) => {
    setData((prev) => ({ ...prev, [key]: value }));
  };

  const toggleTag = (tag: string) => {
    const tags = data.value_tags ?? [];
    set(
      "value_tags",
      tags.includes(tag) ? tags.filter((t) => t !== tag) : [...tags, tag]
    );
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    startTransition(async () => {
      const result = await setterSaveIntake(clientUserId, data);
      setMessage(result.ok ? "Akte gespeichert." : result.error);
    });
  };

  return (
    <form onSubmit={onSubmit} className="space-y-8">
      <section className="space-y-4 rounded-[20px] border border-white/12 bg-white/[0.03] p-5">
        <h2 className="text-lg font-medium text-white">Daten</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <input
            placeholder="Setter"
            value={data.setter_name ?? ""}
            onChange={(e) => set("setter_name", e.target.value)}
            className="rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-sm text-white"
          />
          <input
            placeholder="Closer / EG"
            value={data.closer_name ?? ""}
            onChange={(e) => set("closer_name", e.target.value)}
            className="rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-sm text-white"
          />
          <input
            placeholder="Zahlungsplan"
            value={data.payment_plan ?? ""}
            onChange={(e) => set("payment_plan", e.target.value)}
            className="rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-sm text-white"
          />
          <input
            placeholder="€ / Sitzung"
            value={data.price_per_session ?? ""}
            onChange={(e) => set("price_per_session", e.target.value)}
            className="rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-sm text-white"
          />
          <input
            placeholder="Telefon"
            value={data.phone ?? ""}
            onChange={(e) => set("phone", e.target.value)}
            className="rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-sm text-white"
          />
          <input
            placeholder="E-Mail"
            value={data.email ?? ""}
            onChange={(e) => set("email", e.target.value)}
            className="rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-sm text-white"
          />
        </div>
        <input
          placeholder="Adresse"
          value={data.address ?? ""}
          onChange={(e) => set("address", e.target.value)}
          className="w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-sm text-white"
        />
        <input
          placeholder="Therapeut"
          value={data.therapist_name ?? ""}
          onChange={(e) => set("therapist_name", e.target.value)}
          className="w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-sm text-white"
        />
        <input
          placeholder="Start (Datum / Uhrzeit)"
          value={data.session_start ?? ""}
          onChange={(e) => set("session_start", e.target.value)}
          className="w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-sm text-white"
        />
        <div className="flex flex-wrap gap-4 text-sm text-white/80">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={Boolean(data.agreement_signed)}
              onChange={(e) => set("agreement_signed", e.target.checked)}
            />
            Vereinbarung unterschrieben
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={Boolean(data.platform_added)}
              onChange={(e) => set("platform_added", e.target.checked)}
            />
            Onlineplattform hinzugefügt
          </label>
        </div>
      </section>

      {field("Probleme / Seit wann akut", data.problems ?? "", (v) => set("problems", v), 8)}
      {field("Lösungen / Ziele", data.goals ?? "", (v) => set("goals", v), 6)}
      {field(
        "Erwartungen an die Therapie & Therapeuten",
        data.expectations ?? "",
        (v) => set("expectations", v),
        5
      )}
      {field("Side Note", data.side_note ?? "", (v) => set("side_note", v), 3)}
      {field("Konsequenzen (ohne Veränderung)", data.consequences ?? "", (v) => set("consequences", v), 5)}

      <section className="space-y-3">
        <h3 className="text-sm font-medium text-white/70">Online-Plattform — Schwerpunkte</h3>
        <div className="flex flex-wrap gap-2">
          {VALUE_TAGS.map((tag) => {
            const active = (data.value_tags ?? []).includes(tag);
            return (
              <button
                key={tag}
                type="button"
                onClick={() => toggleTag(tag)}
                className={[
                  "rounded-full border px-3 py-1 text-xs",
                  active
                    ? "border-[#63eca9]/60 bg-[#63eca9]/15 text-[#63eca9]"
                    : "border-white/20 text-white/55",
                ].join(" ")}
              >
                {tag}
              </button>
            );
          })}
        </div>
      </section>

      {field("Freie Notizen", data.free_notes ?? "", (v) => set("free_notes", v), 4)}

      {message ? (
        <p
          className={`text-sm ${
            message.includes("fehlgeschlagen") || message.includes("Ungültig")
              ? "text-red-300"
              : "text-[#63eca9]"
          }`}
        >
          {message}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-[#63eca9] px-6 py-2.5 text-sm font-medium text-black disabled:opacity-50"
      >
        {pending ? "Speichern…" : "Klienten-Akte speichern"}
      </button>
    </form>
  );
}
