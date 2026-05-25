"use client";

import { useState, useTransition } from "react";
import {
  saveGlobalUnlockDefaults,
  saveLevelUnlockDefaults,
  type UnlockDefaultsInput,
} from "@/app/admin/einstellungen/videos/actions";
import type { AccessLevelOption } from "@/lib/accessLevels";

export type UnlockDefaultsState = UnlockDefaultsInput & {
  configured?: boolean;
};

type UnlockDefaultsEditorProps = {
  globalDefaults: UnlockDefaultsState;
  levelDefaults: Record<number, UnlockDefaultsState | null>;
  accessLevels: AccessLevelOption[];
};

const GLOBAL_TAB = "global";

export function UnlockDefaultsEditor({
  globalDefaults,
  levelDefaults,
  accessLevels,
}: UnlockDefaultsEditorProps) {
  const [activeTab, setActiveTab] = useState<string>(GLOBAL_TAB);
  const [globalForm, setGlobalForm] = useState(globalDefaults);
  const [levelForms, setLevelForms] = useState(() => {
    const map: Record<number, UnlockDefaultsInput> = {};
    accessLevels.forEach((l) => {
      const row = levelDefaults[l.access_level];
      map[l.access_level] = row ?? { ...globalDefaults };
    });
    return map;
  });
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const activeLevel =
    activeTab !== GLOBAL_TAB ? Number(activeTab) : null;
  const isGlobal = activeTab === GLOBAL_TAB;
  const currentForm = isGlobal
    ? globalForm
    : levelForms[activeLevel!] ?? globalForm;

  const setCurrentForm = (patch: Partial<UnlockDefaultsInput>) => {
    if (isGlobal) {
      setGlobalForm((f) => ({ ...f, ...patch }));
    } else if (activeLevel != null && !Number.isNaN(activeLevel)) {
      setLevelForms((prev) => ({
        ...prev,
        [activeLevel]: { ...(prev[activeLevel] ?? globalForm), ...patch },
      }));
    }
  };

  const save = () => {
    startTransition(async () => {
      setMessage(null);
      const payload: UnlockDefaultsInput = {
        first_gated_video_position: currentForm.first_gated_video_position,
        first_unlock_offset_days: currentForm.first_unlock_offset_days,
        subsequent_unlock_interval_days: currentForm.subsequent_unlock_interval_days,
      };

      const result = isGlobal
        ? await saveGlobalUnlockDefaults(payload)
        : await saveLevelUnlockDefaults(activeLevel!, payload);

      if (result.ok) {
        setMessage("Einstellungen gespeichert.");
      } else {
        setMessage(result.error);
      }
    });
  };

  const levelConfigured =
    activeLevel != null && levelDefaults[activeLevel]?.configured;

  return (
    <div className="space-y-6">
      <p className="text-sm text-white/55">
        Gilt für <strong className="font-normal text-white/80">neue Registrierungen</strong>{" "}
        (und beim erneuten Anwenden des Standard-Zeitplans pro Nutzer). Videos vor der
        gewählten Position sind nur sequenziell freigeschaltet — ohne zusätzliche
        Datumssperre. Freischaltung jeweils um <strong className="font-normal text-white/80">10:00 Uhr</strong> (Berlin).
      </p>

      <div className="flex flex-wrap gap-2 border-b border-white/10 pb-2">
        <TabButton
          active={isGlobal}
          onClick={() => setActiveTab(GLOBAL_TAB)}
          label="Alle Klienten"
        />
        {accessLevels.map((l) => (
          <TabButton
            key={l.access_level}
            active={activeTab === String(l.access_level)}
            onClick={() => setActiveTab(String(l.access_level))}
            label={l.label}
          />
        ))}
      </div>

      {!isGlobal && !levelConfigured && (
        <p className="rounded-lg border border-amber-500/25 bg-amber-500/10 px-4 py-2 text-sm text-amber-200/90">
          Für diese Stufe sind noch keine eigenen Werte gespeichert. Vorschau zeigt die
          globalen Standardwerte — beim Speichern wird ein eigener Zeitplan für diese Stufe
          angelegt.
        </p>
      )}

      <div className="grid max-w-xl gap-5 rounded-[20px] border border-white/10 bg-white/[0.02] p-6">
        <Field
          label="Erstes Video mit Zeitplan (Position)"
          hint={`Videos 1 bis ${Math.max(1, currentForm.first_gated_video_position - 1)}: nur sequenziell, kein Datum.`}
          type="number"
          min={1}
          value={currentForm.first_gated_video_position}
          onChange={(v) => setCurrentForm({ first_gated_video_position: v })}
        />
        <Field
          label="Tage nach Registrierung bis Freischaltung (erstes geplantes Video)"
          type="number"
          min={0}
          value={currentForm.first_unlock_offset_days}
          onChange={(v) => setCurrentForm({ first_unlock_offset_days: v })}
        />
        <Field
          label="Tage zwischen weiteren Video-Freischaltungen"
          type="number"
          min={0}
          value={currentForm.subsequent_unlock_interval_days}
          onChange={(v) => setCurrentForm({ subsequent_unlock_interval_days: v })}
        />

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            type="button"
            onClick={save}
            disabled={pending}
            className="rounded-full bg-[#63eca9] px-5 py-2 text-sm font-medium text-black disabled:opacity-50"
          >
            {pending ? "Speichern …" : "Speichern"}
          </button>
          {message && (
            <p
              className={`text-sm ${
                message.includes("fehlgeschlagen") || message.includes("Ungültig") || message.includes("nicht")
                  ? "text-red-400"
                  : "text-[#63eca9]"
              }`}
            >
              {message}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-4 py-1.5 text-sm transition-colors ${
        active
          ? "border-[#63eca9]/50 bg-[#63eca9]/15 text-[#63eca9]"
          : "border-white/10 text-white/70 hover:border-white/20 hover:text-white"
      }`}
    >
      {label}
    </button>
  );
}

function Field({
  label,
  hint,
  type,
  min,
  value,
  onChange,
}: {
  label: string;
  hint?: string;
  type: "number";
  min: number;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="block space-y-1.5 text-sm">
      <span className="text-white/80">{label}</span>
      {hint && <span className="block text-xs text-white/45">{hint}</span>}
      <input
        type={type}
        min={min}
        value={value}
        onChange={(e) => onChange(Number(e.target.value) || min)}
        className="w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-white focus:border-[#63eca9]/50 focus:outline-none"
      />
    </label>
  );
}
