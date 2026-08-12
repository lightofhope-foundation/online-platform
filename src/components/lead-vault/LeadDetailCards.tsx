"use client";

import { useState, useTransition, type ReactNode } from "react";
import type { LeadIntakeView } from "@/lib/leadVault";
import { PencilIcon } from "@/components/icons/Icons";
import { therapistSaveClientIntake } from "@/app/therapist/clients/[slug]/actions";
import { setterSaveClientIntake } from "@/app/setter/actions";
import type { ClientIntakeData } from "@/app/setter/actions";

type CardKey =
  | "daten"
  | "therapeut"
  | "probleme"
  | "side_note"
  | "goals"
  | "expectations"
  | "value_set"
  | "consequences";

function FloppyIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden>
      <path
        d="M2.5 1.5h9.2L14 4.8V13.5a1 1 0 0 1-1 1h-10a1 1 0 0 1-1-1v-11a1 1 0 0 1 1-1Z"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      <path d="M5 1.5v4h6v-4" stroke="currentColor" strokeWidth="1.2" />
      <path d="M4.5 10.5h7V14.5h-7z" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}

function CardShell({
  title,
  subtitle,
  accent,
  headerRight,
  children,
}: {
  title: string;
  subtitle?: string;
  accent: string;
  headerRight?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-xl border border-white/12 bg-white/[0.04] shadow-sm">
      <div className={`h-1.5 w-full ${accent}`} />
      <div className="flex items-start justify-between gap-2 border-b border-white/8 px-4 py-3">
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-white">{title}</h2>
          {subtitle ? (
            <p className="mt-0.5 text-xs text-white/45">{subtitle}</p>
          ) : null}
        </div>
        {headerRight ? <div className="shrink-0">{headerRight}</div> : null}
      </div>
      <div className="space-y-2 px-4 py-3 text-sm text-white/80">{children}</div>
    </section>
  );
}

function BulletList({ text }: { text?: string }) {
  if (!text?.trim()) {
    return <p className="text-white/35 italic">Noch leer …</p>;
  }
  const lines = text
    .split(/\n|•/)
    .map((l) => l.trim())
    .filter(Boolean);
  return (
    <ul className="list-disc space-y-1 pl-4">
      {lines.map((line) => (
        <li key={line}>{line}</li>
      ))}
    </ul>
  );
}

function fieldClass() {
  return "w-full rounded-lg border border-white/15 bg-black/35 px-3 py-2 text-sm text-white placeholder:text-white/30";
}

type Props = {
  name: string;
  clientId: string | null;
  accessRevoked: boolean;
  intake: LeadIntakeView;
  eyebrow?: string;
  statusHint?: string | null;
  showTitle?: boolean;
  /** Therapist (and Setter) can edit intake cards */
  editable?: boolean;
  /** Who persists the intake */
  saveVia?: "therapist" | "setter";
};

export function LeadDetailCards({
  name,
  clientId,
  accessRevoked,
  intake: initial,
  eyebrow = "Lead",
  statusHint,
  showTitle = true,
  editable = false,
  saveVia = "therapist",
}: Props) {
  const [data, setData] = useState<LeadIntakeView>(initial);
  const [editing, setEditing] = useState<CardKey | null>(null);
  const [draft, setDraft] = useState<LeadIntakeView>(initial);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const startEdit = (key: CardKey) => {
    setDraft(data);
    setEditing(key);
    setMessage(null);
  };

  const cancelEdit = () => {
    setEditing(null);
    setDraft(data);
  };

  const save = () => {
    if (!clientId || !editable) return;
    startTransition(async () => {
      const payload = draft as ClientIntakeData;
      const result =
        saveVia === "setter"
          ? await setterSaveClientIntake(clientId, payload)
          : await therapistSaveClientIntake(clientId, draft);
      if (result.ok) {
        setData(draft);
        setEditing(null);
        setMessage("Gespeichert.");
      } else {
        setMessage(result.error);
      }
    });
  };

  const editBtn = (key: CardKey) => {
    if (!editable) return null;
    if (editing === key) {
      return (
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={cancelEdit}
            disabled={pending}
            className="rounded-lg px-2 py-1 text-xs text-white/45 hover:bg-white/5 hover:text-white/80"
          >
            Abbrechen
          </button>
          <button
            type="button"
            onClick={save}
            disabled={pending}
            title="Speichern"
            aria-label="Speichern"
            className="rounded-lg border border-[#63eca9]/35 bg-[#63eca9]/15 p-1.5 text-[#63eca9] hover:bg-[#63eca9]/25 disabled:opacity-50"
          >
            <FloppyIcon size={15} />
          </button>
        </div>
      );
    }
    return (
      <button
        type="button"
        onClick={() => startEdit(key)}
        title="Bearbeiten"
        aria-label={`${key} bearbeiten`}
        className="rounded-lg border border-white/10 bg-white/[0.04] p-1.5 text-white/45 hover:border-white/20 hover:text-white/85"
      >
        <PencilIcon size={14} />
      </button>
    );
  };

  const datenLines = [
    data.setter_name || data.closer_name
      ? `Setter/EG: ${[data.setter_name, data.closer_name].filter(Boolean).join(" / ")}`
      : null,
    data.email ? `E-Mail: ${data.email}` : null,
    data.phone ? `Tel: ${data.phone}` : null,
    data.address ? `Adresse: ${data.address}` : null,
    data.therapist_name ? `Therapeut: ${data.therapist_name}` : "Therapeut:",
    data.price_per_session ? `€/Sitzung: ${data.price_per_session}` : "€/Sitzung:",
    data.session_start ? `Start: ${data.session_start}` : "Start:",
  ].filter(Boolean) as string[];

  return (
    <div className="space-y-4">
      {showTitle ? (
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-white/45">{eyebrow}</p>
          <h1 className="mt-1 typo-person-name text-white">{name}</h1>
          <p className="mt-1 text-sm text-white/45">
            {clientId ? `ID ${clientId}` : "ohne Client-ID"}
            {accessRevoked ? " · kein Plattform-Zugang" : ""}
            {statusHint ? ` · ${statusHint}` : ""}
          </p>
          {message ? (
            <p className="mt-2 text-xs text-[#63eca9]/90">{message}</p>
          ) : null}
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-3 xl:grid-cols-4">
        <div className="space-y-4">
          <CardShell
            title="Daten"
            subtitle="Setter · Erstkontakt"
            accent="bg-[#5cb87a]"
            headerRight={editBtn("daten")}
          >
            {editing === "daten" ? (
              <div className="grid gap-2 sm:grid-cols-2">
                <input
                  className={fieldClass()}
                  placeholder="Setter"
                  value={draft.setter_name ?? ""}
                  onChange={(e) => setDraft({ ...draft, setter_name: e.target.value })}
                />
                <input
                  className={fieldClass()}
                  placeholder="Closer / EG"
                  value={draft.closer_name ?? ""}
                  onChange={(e) => setDraft({ ...draft, closer_name: e.target.value })}
                />
                <input
                  className={fieldClass()}
                  placeholder="E-Mail"
                  value={draft.email ?? ""}
                  onChange={(e) => setDraft({ ...draft, email: e.target.value })}
                />
                <input
                  className={fieldClass()}
                  placeholder="Telefon"
                  value={draft.phone ?? ""}
                  onChange={(e) => setDraft({ ...draft, phone: e.target.value })}
                />
                <input
                  className={`${fieldClass()} sm:col-span-2`}
                  placeholder="Adresse"
                  value={draft.address ?? ""}
                  onChange={(e) => setDraft({ ...draft, address: e.target.value })}
                />
                <input
                  className={fieldClass()}
                  placeholder="Therapeut"
                  value={draft.therapist_name ?? ""}
                  onChange={(e) => setDraft({ ...draft, therapist_name: e.target.value })}
                />
                <input
                  className={fieldClass()}
                  placeholder="€ / Sitzung"
                  value={draft.price_per_session ?? ""}
                  onChange={(e) =>
                    setDraft({ ...draft, price_per_session: e.target.value })
                  }
                />
                <input
                  className={`${fieldClass()} sm:col-span-2`}
                  placeholder="Start"
                  value={draft.session_start ?? ""}
                  onChange={(e) => setDraft({ ...draft, session_start: e.target.value })}
                />
                <label className="flex items-center gap-2 text-xs text-white/60 sm:col-span-2">
                  <input
                    type="checkbox"
                    checked={!!draft.agreement_signed}
                    onChange={(e) =>
                      setDraft({ ...draft, agreement_signed: e.target.checked })
                    }
                  />
                  Vereinbarung unterschrieben?
                </label>
                <label className="flex items-center gap-2 text-xs text-white/60 sm:col-span-2">
                  <input
                    type="checkbox"
                    checked={!!draft.platform_added}
                    onChange={(e) =>
                      setDraft({ ...draft, platform_added: e.target.checked })
                    }
                  />
                  Onlineplattform hinzugefügt
                </label>
              </div>
            ) : (
              <>
                <ul className="list-disc space-y-1 pl-4">
                  {datenLines.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
                <div className="mt-3 space-y-1.5 border-t border-white/10 pt-3 text-xs text-white/60">
                  <label className="flex items-center gap-2">
                    <input type="checkbox" checked={!!data.agreement_signed} readOnly />
                    Vereinbarung unterschrieben?
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" checked={!!data.platform_added} readOnly />
                    Onlineplattform hinzugefügt
                  </label>
                </div>
              </>
            )}
          </CardShell>

          <CardShell
            title="Therapeut"
            subtitle="Unterlagen / Notiz"
            accent="bg-[#5b8fd9]"
            headerRight={editBtn("therapeut")}
          >
            {editing === "therapeut" ? (
              <textarea
                className={fieldClass()}
                rows={4}
                placeholder="Notizen zu Unterlagen, Aufnahmen …"
                value={draft.free_notes ?? ""}
                onChange={(e) => setDraft({ ...draft, free_notes: e.target.value })}
              />
            ) : data.free_notes?.trim() ? (
              <BulletList text={data.free_notes} />
            ) : (
              <p className="text-white/35 italic">Noch leer …</p>
            )}
          </CardShell>
        </div>

        <div className="space-y-4">
          <CardShell
            title="Probleme"
            subtitle="Seit wann akut"
            accent="bg-[#4aabb8]"
            headerRight={editBtn("probleme")}
          >
            {editing === "probleme" ? (
              <textarea
                className={fieldClass()}
                rows={6}
                placeholder="Probleme …"
                value={draft.problems ?? ""}
                onChange={(e) => setDraft({ ...draft, problems: e.target.value })}
              />
            ) : (
              <BulletList text={data.problems} />
            )}
          </CardShell>
          <CardShell
            title="Side Note"
            accent="bg-white/25"
            headerRight={editBtn("side_note")}
          >
            {editing === "side_note" ? (
              <textarea
                className={fieldClass()}
                rows={5}
                placeholder="Side notes …"
                value={draft.side_note ?? ""}
                onChange={(e) => setDraft({ ...draft, side_note: e.target.value })}
              />
            ) : (
              <BulletList text={data.side_note} />
            )}
          </CardShell>
        </div>

        <div className="space-y-4 lg:col-span-1 xl:col-span-2">
          <CardShell
            title="Lösungen / Ziele"
            subtitle="Therapeut · Erstgespräch"
            accent="bg-[#e8a04a]"
            headerRight={editBtn("goals")}
          >
            {editing === "goals" ? (
              <textarea
                className={fieldClass()}
                rows={4}
                placeholder="Ziele …"
                value={draft.goals ?? ""}
                onChange={(e) => setDraft({ ...draft, goals: e.target.value })}
              />
            ) : (
              <BulletList text={data.goals} />
            )}
          </CardShell>
          <CardShell
            title="Erwartungen an die Therapie & Therapeuten"
            accent="bg-[#e8a04a]"
            headerRight={editBtn("expectations")}
          >
            {editing === "expectations" ? (
              <textarea
                className={fieldClass()}
                rows={4}
                placeholder="Erwartungen …"
                value={draft.expectations ?? ""}
                onChange={(e) => setDraft({ ...draft, expectations: e.target.value })}
              />
            ) : (
              <BulletList text={data.expectations} />
            )}
          </CardShell>
          <CardShell
            title="Value Set"
            accent="bg-[#e8a04a]"
            headerRight={editBtn("value_set")}
          >
            {editing === "value_set" ? (
              <div className="space-y-2">
                <textarea
                  className={fieldClass()}
                  rows={3}
                  placeholder="Value Set (Freitext)"
                  value={draft.value_set ?? ""}
                  onChange={(e) => setDraft({ ...draft, value_set: e.target.value })}
                />
                <input
                  className={fieldClass()}
                  placeholder="Tags, kommagetrennt (z. B. Trennung, Angst)"
                  value={(draft.value_tags ?? []).join(", ")}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      value_tags: e.target.value
                        .split(",")
                        .map((t) => t.trim())
                        .filter(Boolean),
                    })
                  }
                />
              </div>
            ) : data.value_tags?.length ? (
              <ul className="list-disc space-y-1 pl-4">
                {data.value_tags.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
            ) : (
              <BulletList text={data.value_set} />
            )}
          </CardShell>
          <CardShell
            title="Konsequenzen"
            accent="bg-[#e8a04a]"
            headerRight={editBtn("consequences")}
          >
            {editing === "consequences" ? (
              <textarea
                className={fieldClass()}
                rows={4}
                placeholder="Konsequenzen …"
                value={draft.consequences ?? ""}
                onChange={(e) => setDraft({ ...draft, consequences: e.target.value })}
              />
            ) : (
              <BulletList text={data.consequences} />
            )}
          </CardShell>
        </div>
      </div>
    </div>
  );
}
