"use client";

import { useState, useTransition } from "react";
import type { RegistrationFieldDefinition } from "@/lib/registrationFields";
import {
  createRegistrationField,
  deleteRegistrationField,
  updateRegistrationField,
} from "@/app/admin/einstellungen/registrierung/actions";

type RegistrationFieldsEditorProps = {
  initialFields: RegistrationFieldDefinition[];
};

export function RegistrationFieldsEditor({
  initialFields,
}: RegistrationFieldsEditorProps) {
  const [fields, setFields] = useState(initialFields);
  const [newLabel, setNewLabel] = useState("");
  const [newRequired, setNewRequired] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const reloadFromServer = async () => {
    const { listRegistrationFields } = await import(
      "@/app/admin/einstellungen/registrierung/actions"
    );
    const next = await listRegistrationFields();
    setFields(next);
  };

  const handleCreate = () => {
    startTransition(async () => {
      setMessage(null);
      const result = await createRegistrationField(newLabel, newRequired);
      if (result.ok) {
        setNewLabel("");
        setNewRequired(false);
        await reloadFromServer();
        setMessage("Feld hinzugefügt.");
      } else {
        setMessage(result.error);
      }
    });
  };

  const toggleRequired = (field: RegistrationFieldDefinition) => {
    startTransition(async () => {
      setMessage(null);
      const result = await updateRegistrationField(field.id, {
        required: !field.required,
      });
      if (result.ok) {
        setFields((prev) =>
          prev.map((f) =>
            f.id === field.id ? { ...f, required: !f.required } : f
          )
        );
      } else {
        setMessage(result.error);
      }
    });
  };

  const saveLabel = (field: RegistrationFieldDefinition, label: string) => {
    if (label.trim() === field.label) return;
    startTransition(async () => {
      setMessage(null);
      const result = await updateRegistrationField(field.id, { label });
      if (result.ok) {
        setFields((prev) =>
          prev.map((f) => (f.id === field.id ? { ...f, label: label.trim() } : f))
        );
      } else {
        setMessage(result.error);
      }
    });
  };

  const handleDelete = (field: RegistrationFieldDefinition) => {
    if (field.is_system) return;
    if (!confirm(`Feld „${field.label}“ wirklich entfernen?`)) return;
    startTransition(async () => {
      setMessage(null);
      const result = await deleteRegistrationField(field.id);
      if (result.ok) {
        setFields((prev) => prev.filter((f) => f.id !== field.id));
        setMessage("Feld entfernt.");
      } else {
        setMessage(result.error);
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="rounded-[20px] border border-white/10 bg-white/[0.02] overflow-hidden">
        <table className="w-full border-collapse text-sm">
          <thead className="bg-white/[0.04] text-left text-white/60">
            <tr>
              <th className="border-b border-white/10 px-4 py-3 font-medium">
                Bezeichnung
              </th>
              <th className="border-b border-white/10 px-4 py-3 font-medium">
                Schlüssel
              </th>
              <th className="border-b border-white/10 px-4 py-3 font-medium">
                Pflicht
              </th>
              <th className="border-b border-white/10 px-4 py-3 font-medium w-24" />
            </tr>
          </thead>
          <tbody>
            {fields.map((field) => (
              <tr key={field.id} className="border-b border-white/[0.06]">
                <td className="px-4 py-3">
                  <input
                    className="w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-white outline-none focus:border-[#63eca9]/50"
                    defaultValue={field.label}
                    onBlur={(e) => saveLabel(field, e.target.value)}
                    disabled={pending}
                  />
                </td>
                <td className="px-4 py-3 font-mono text-xs text-white/45">
                  {field.field_key}
                  {field.is_system && (
                    <span className="ml-2 text-white/30">(System)</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <button
                    type="button"
                    onClick={() => toggleRequired(field)}
                    disabled={pending}
                    className={`rounded-full px-3 py-1 text-xs border transition ${
                      field.required
                        ? "border-[#63eca9]/50 bg-[#63eca9]/15 text-[#63eca9]"
                        : "border-white/15 text-white/50 hover:text-white/80"
                    }`}
                  >
                    {field.required ? "Pflicht" : "Optional"}
                  </button>
                </td>
                <td className="px-4 py-3 text-right">
                  {!field.is_system && (
                    <button
                      type="button"
                      onClick={() => handleDelete(field)}
                      disabled={pending}
                      className="text-sm text-red-400/80 hover:text-red-300"
                    >
                      Löschen
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="rounded-[20px] border border-white/10 bg-white/[0.02] p-6">
        <h3 className="font-medium text-white">Neues Feld</h3>
        <div className="mt-4 flex flex-wrap items-end gap-4">
          <div className="min-w-[200px] flex-1">
            <label className="mb-1 block text-xs text-white/50">Bezeichnung</label>
            <input
              className="w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-white outline-none focus:border-[#63eca9]/50"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              placeholder="z. B. Telefon"
              disabled={pending}
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-white/70">
            <input
              type="checkbox"
              checked={newRequired}
              onChange={(e) => setNewRequired(e.target.checked)}
              className="rounded border-white/20"
            />
            Pflichtfeld
          </label>
          <button
            type="button"
            onClick={handleCreate}
            disabled={pending || !newLabel.trim()}
            className="rounded-full bg-[#63eca9] px-5 py-2 text-sm font-medium text-black hover:bg-[#53e0b6] disabled:opacity-50"
          >
            + Feld hinzufügen
          </button>
        </div>
      </div>

      {message && <p className="text-sm text-[#63eca9]">{message}</p>}
    </div>
  );
}
