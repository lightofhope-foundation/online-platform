"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import {
  adminAddSessionNote,
  adminDeleteSpecialSession,
  adminInsertSpecialSession,
  adminSetSessionReleased,
  adminUpdateSessionMeta,
  adminUpdateSessionNote,
  clientAddSessionNote,
  therapistAddSessionNote,
  therapistDeleteSpecialSession,
  therapistInsertSpecialSession,
  therapistSetSessionReleased,
  therapistUpdateSessionMeta,
  therapistUpdateSessionNote,
} from "@/app/actions/therapySessions";
import type { TherapySessionWithNotes } from "@/lib/therapySessions";
import { formatTherapySessionLabel } from "@/lib/therapySessions";
import { sortSessionsOnPath } from "@/lib/therapyPathLayout";
import { isoToBerlinDatetimeLocal } from "@/lib/berlinDatetime";
import { formatGermanDateTime } from "@/lib/clientId";
import { CalendarIcon } from "@/components/icons/Icons";
import { AdminSessionPathFrame } from "./AdminSessionPathFrame";
import { SessionPathBubbles, type SessionPathChrome } from "./SessionPathBubbles";
import { SessionRecordingPanel } from "./SessionRecordingPanel";
import { SessionRecordingQuickAccess } from "./SessionRecordingQuickAccess";
import { SessionReleaseSwitch } from "./SessionReleaseSwitch";

export type TherapySessionsMode = "therapist" | "admin" | "client";

export type TherapySessionsWorkspaceProps = {
  sessions: TherapySessionWithNotes[];
  mode: TherapySessionsMode;
  clientId?: string;
  therapistName?: string;
  initialSessionNumber?: number | null;
  bunnyLibraryId?: string;
  pathChrome?: SessionPathChrome | null;
};

function getInitialSessionId(
  mode: TherapySessionsMode,
  sessions: TherapySessionWithNotes[],
  preferred?: number | null
): string | null {
  if (preferred != null && preferred >= 1 && preferred <= 18) {
    const match = sessions.find(
      (s) => !s.is_special && s.session_number === preferred
    );
    if (match) {
      if (mode === "client" && !match.released_to_client) {
        return sessions.find((s) => s.released_to_client)?.id ?? null;
      }
      return match.id;
    }
  }
  if (mode === "client") {
    return sessions.find((s) => s.released_to_client)?.id ?? null;
  }
  return (
    sessions.find((s) => !s.is_special && s.session_number === 1)?.id ??
    sessions[0]?.id ??
    null
  );
}

function NoteBlock({
  label,
  body,
  className,
}: {
  label: string;
  body: string | null;
  className?: string;
}) {
  if (!body?.trim()) return null;
  return (
    <div className={className}>
      <p className="mb-1 text-xs font-medium uppercase tracking-wide text-white/40">{label}</p>
      <p className="whitespace-pre-wrap text-sm text-white/85">{body}</p>
    </div>
  );
}

export function TherapySessionsWorkspace({
  sessions,
  mode,
  clientId,
  therapistName,
  initialSessionNumber,
  bunnyLibraryId,
  pathChrome,
}: TherapySessionsWorkspaceProps) {
  const router = useRouter();
  const onSetReleased = useMemo(() => {
    if (!clientId) return undefined;
    if (mode === "therapist") {
      return (sessionId: string, released: boolean) =>
        therapistSetSessionReleased(clientId, sessionId, released);
    }
    if (mode === "admin") {
      return (sessionId: string, released: boolean) =>
        adminSetSessionReleased(clientId, sessionId, released);
    }
    return undefined;
  }, [mode, clientId]);

  const onUpdateSession = useMemo(() => {
    if (!clientId) return undefined;
    if (mode === "therapist") {
      return (
        sessionId: string,
        data: { topic?: string; scheduledAtLocal?: string; meetingUrl?: string }
      ) => therapistUpdateSessionMeta(clientId, sessionId, data);
    }
    if (mode === "admin") {
      return (
        sessionId: string,
        data: { topic?: string; scheduledAtLocal?: string; meetingUrl?: string }
      ) => adminUpdateSessionMeta(clientId, sessionId, data);
    }
    return undefined;
  }, [mode, clientId]);

  const onAddNote = useMemo(() => {
    if (mode === "client") {
      return (sessionId: string, _therapistBody: string, clientBody: string) =>
        clientAddSessionNote(sessionId, clientBody);
    }
    if (!clientId) return undefined;
    if (mode === "therapist") {
      return (sessionId: string, therapistBody: string, clientBody: string) =>
        therapistAddSessionNote(clientId, sessionId, therapistBody, clientBody);
    }
    if (mode === "admin") {
      return (sessionId: string, therapistBody: string, clientBody: string) =>
        adminAddSessionNote(clientId, sessionId, therapistBody, clientBody);
    }
    return undefined;
  }, [mode, clientId]);

  const onUpdateNote = useMemo(() => {
    if (!clientId) return undefined;
    if (mode === "therapist") {
      return (noteId: string, therapistBody: string, clientBody: string) =>
        therapistUpdateSessionNote(clientId, noteId, therapistBody, clientBody);
    }
    if (mode === "admin") {
      return (noteId: string, therapistBody: string, clientBody: string) =>
        adminUpdateSessionNote(clientId, noteId, therapistBody, clientBody);
    }
    return undefined;
  }, [mode, clientId]);

  const sortedSessions = useMemo(() => sortSessionsOnPath(sessions), [sessions]);

  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(() =>
    getInitialSessionId(mode, sessions, initialSessionNumber)
  );
  const [highlightSessionId, setHighlightSessionId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [noteError, setNoteError] = useState<string | null>(null);
  const [draftTherapist, setDraftTherapist] = useState("");
  const [draftClient, setDraftClient] = useState("");
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editTherapist, setEditTherapist] = useState("");
  const [editClient, setEditClient] = useState("");
  const [topicDraft, setTopicDraft] = useState("");
  const [scheduleDraft, setScheduleDraft] = useState("");
  const [linkDraft, setLinkDraft] = useState("");

  const selected = useMemo(
    () => sessions.find((s) => s.id === selectedSessionId) ?? null,
    [sessions, selectedSessionId]
  );

  const canManage = mode === "therapist" || mode === "admin";
  const showTherapistNotes = mode !== "client";
  const clientSessionLocked =
    mode === "client" && selected ? !selected.released_to_client : false;
  const canClientAddNote =
    mode === "client" && selected?.released_to_client && Boolean(onAddNote);

  useEffect(() => {
    if (selected && canManage) {
      setTopicDraft(selected.topic ?? "");
      setScheduleDraft(isoToBerlinDatetimeLocal(selected.scheduled_at));
      setLinkDraft(selected.meeting_url ?? "");
    }
  }, [selected?.id, canManage, selected]);

  const syncMetaDrafts = (session: TherapySessionWithNotes) => {
    setTopicDraft(session.topic ?? "");
    setScheduleDraft(isoToBerlinDatetimeLocal(session.scheduled_at));
    setLinkDraft(session.meeting_url ?? "");
  };

  const handleSelect = (sessionId: string) => {
    setSelectedSessionId(sessionId);
    const session = sessions.find((s) => s.id === sessionId);
    if (session && canManage) syncMetaDrafts(session);
    setDraftTherapist("");
    setDraftClient("");
    setEditingNoteId(null);
  };

  const handleAddSpecial = (afterPathOrder: number) => {
    if (!clientId || (mode !== "therapist" && mode !== "admin")) return;
    startTransition(async () => {
      const result =
        mode === "admin"
          ? await adminInsertSpecialSession(clientId, afterPathOrder)
          : await therapistInsertSpecialSession(clientId, afterPathOrder);
      if (result.sessionId) {
        setHighlightSessionId(result.sessionId);
        setSelectedSessionId(result.sessionId);
      }
      await new Promise((resolve) => setTimeout(resolve, 480));
      router.refresh();
      window.setTimeout(() => setHighlightSessionId(null), 700);
    });
  };

  const handleDeleteSpecial = () => {
    if (!clientId || (mode !== "therapist" && mode !== "admin") || !selected?.is_special)
      return;
    if (!window.confirm("Notsitzung wirklich entfernen?")) return;
    const fallbackId =
      sessions.find((s) => !s.is_special && s.session_number === 1)?.id ??
      sessions.find((s) => !s.is_special)?.id ??
      null;
    startTransition(async () => {
      if (mode === "admin") {
        await adminDeleteSpecialSession(clientId, selected.id);
      } else {
        await therapistDeleteSpecialSession(clientId, selected.id);
      }
      setSelectedSessionId(fallbackId);
      router.refresh();
    });
  };

  const canAddSpecial = canManage && Boolean(clientId);
  const onAddSpecial = canAddSpecial ? handleAddSpecial : undefined;

  if (!selected) {
    return (
      <div className="space-y-6">
        {mode === "admin" ? (
          <AdminSessionPathFrame>
            <SessionPathBubbles
              sessions={sessions}
              selectedSessionId={null}
              onSelect={handleSelect}
              clientView={false}
              therapistName={therapistName}
              canAddSpecial={canAddSpecial}
              onAddSpecial={onAddSpecial}
              pathChrome={pathChrome}
              adminLayout
            />
          </AdminSessionPathFrame>
        ) : (
          <SessionPathBubbles
            sessions={sessions}
            selectedSessionId={null}
            onSelect={handleSelect}
            clientView={mode === "client"}
            therapistName={therapistName}
            canAddSpecial={canAddSpecial}
            onAddSpecial={onAddSpecial}
            pathChrome={pathChrome}
          />
        )}
        {mode === "client" && (
          <p className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-center text-sm text-white/50">
            Ihr Therapeut hat noch keine Sitzung freigegeben. Sobald eine Sitzung
            freigeschaltet ist, erscheint sie hier grün markiert.
          </p>
        )}
      </div>
    );
  }

  const saveMeta = () => {
    if (!onUpdateSession) return;
    startTransition(async () => {
      await onUpdateSession(selected.id, {
        topic: topicDraft,
        scheduledAtLocal: scheduleDraft,
        meetingUrl: linkDraft,
      });
      router.refresh();
    });
  };

  const submitNote = () => {
    if (!onAddNote) return;
    if (clientSessionLocked) {
      setNoteError("Diese Sitzung ist noch nicht freigegeben.");
      return;
    }
    if (!draftClient.trim() && !draftTherapist.trim()) {
      setNoteError("Bitte Text eingeben.");
      return;
    }
    startTransition(async () => {
      try {
        setNoteError(null);
        await onAddNote(
          selected.id,
          canManage ? draftTherapist : "",
          draftClient
        );
        setDraftTherapist("");
        setDraftClient("");
        router.refresh();
      } catch (error) {
        setNoteError(
          error instanceof Error ? error.message : "Speichern fehlgeschlagen."
        );
      }
    });
  };

  const startEditNote = (noteId: string, therapist: string | null, client: string | null) => {
    setEditingNoteId(noteId);
    setEditTherapist(therapist ?? "");
    setEditClient(client ?? "");
  };

  const saveEditNote = () => {
    if (!onUpdateNote || !editingNoteId) return;
    startTransition(async () => {
      await onUpdateNote(editingNoteId, editTherapist, editClient);
      setEditingNoteId(null);
      router.refresh();
    });
  };

  return (
    <div className="space-y-8">
      {mode === "admin" ? (
        <AdminSessionPathFrame>
          <SessionPathBubbles
            sessions={sessions}
            selectedSessionId={selectedSessionId}
            onSelect={handleSelect}
            clientView={false}
            therapistName={therapistName}
            canAddSpecial={canAddSpecial}
            onAddSpecial={onAddSpecial}
            highlightSessionId={highlightSessionId}
            pathChrome={pathChrome}
            adminLayout
          />
        </AdminSessionPathFrame>
      ) : (
        <SessionPathBubbles
          sessions={sessions}
          selectedSessionId={selectedSessionId}
          onSelect={handleSelect}
          clientView={mode === "client"}
          therapistName={therapistName}
          canAddSpecial={canAddSpecial}
          onAddSpecial={onAddSpecial}
          highlightSessionId={highlightSessionId}
          pathChrome={pathChrome}
        />
      )}

      <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-6 backdrop-blur-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-white">
              {formatTherapySessionLabel(
                selected.session_number,
                selected.topic,
                selected.is_special
              )}
            </h2>
            {selected.scheduled_at && (
              <p className="mt-1 flex items-center gap-2 text-sm text-white/60">
                <CalendarIcon size={16} />
                {formatGermanDateTime(selected.scheduled_at)}
              </p>
            )}
            {selected.meeting_url && mode !== "client" && (
              <a
                href={selected.meeting_url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 inline-block text-sm text-[#63eca9] hover:underline"
              >
                Meeting-Link öffnen
              </a>
            )}
            {selected.meeting_url && mode === "client" && selected.released_to_client && (
              <a
                href={selected.meeting_url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-flex rounded-xl border border-[#63eca9]/40 bg-[#63eca9]/10 px-4 py-2 text-sm text-[#63eca9] hover:bg-[#63eca9]/20"
              >
                Zum Termin (Link)
              </a>
            )}
          </div>

          {canManage && onSetReleased && (
            <div className="flex flex-col items-end gap-2">
              <SessionReleaseSwitch
                released={selected.released_to_client}
                variant={selected.is_special ? "special" : "default"}
                onChange={(released) => onSetReleased(selected.id, released)}
              />
              {canManage && selected.is_special && (
                <button
                  type="button"
                  disabled={pending}
                  onClick={handleDeleteSpecial}
                  className="rounded-xl border border-red-400/40 bg-red-500/10 px-3 py-1.5 text-xs text-red-300 hover:bg-red-500/20 disabled:opacity-50"
                >
                  Notsitzung entfernen
                </button>
              )}
            </div>
          )}
        </div>

        {canManage && onUpdateSession && (
          <div className="mt-6 grid gap-4 rounded-2xl border border-white/10 bg-white/[0.02] p-4 sm:grid-cols-3">
            <label className="block text-sm">
              <span className="text-white/60">Thema</span>
              <input
                type="text"
                value={topicDraft}
                onChange={(e) => setTopicDraft(e.target.value)}
                className="mt-1 w-full rounded-xl border border-white/15 bg-white/[0.04] px-3 py-2 text-white"
              />
            </label>
            <label className="block text-sm">
              <span className="text-white/60">Termin (Berlin)</span>
              <input
                type="datetime-local"
                value={scheduleDraft}
                onChange={(e) => setScheduleDraft(e.target.value)}
                className="mt-1 w-full rounded-xl border border-white/15 bg-white/[0.04] px-3 py-2 text-white"
              />
            </label>
            <label className="block text-sm">
              <span className="text-white/60">Meeting-Link</span>
              <input
                type="url"
                value={linkDraft}
                onChange={(e) => setLinkDraft(e.target.value)}
                placeholder="https://..."
                className="mt-1 w-full rounded-xl border border-white/15 bg-white/[0.04] px-3 py-2 text-white"
              />
            </label>
            <div className="sm:col-span-3">
              <button
                type="button"
                disabled={pending}
                onClick={saveMeta}
                className="rounded-xl border border-[#63eca9]/40 bg-[#63eca9]/15 px-4 py-2 text-sm text-[#63eca9] hover:bg-[#63eca9]/25 disabled:opacity-50"
              >
                Termin & Thema speichern
              </button>
            </div>
          </div>
        )}

        {mode === "therapist" && clientId && (
          <SessionRecordingPanel
            clientId={clientId}
            sessionId={selected.id}
            sessionNumber={selected.session_number}
            recordingTitle={selected.recording_title}
            bunnyVideoId={selected.recording_bunny_video_id}
            onUpdated={() => router.refresh()}
          />
        )}

        {mode === "client" &&
          selected.released_to_client &&
          selected.recording_bunny_video_id &&
          bunnyLibraryId && (
            <SessionRecordingQuickAccess
              sessionNumber={selected.session_number}
              sessionLabel={formatTherapySessionLabel(
                selected.session_number,
                selected.topic,
                selected.is_special
              )}
              recordingTitle={selected.recording_title}
              bunnyVideoId={selected.recording_bunny_video_id}
              bunnyLibraryId={bunnyLibraryId}
            />
          )}

        {clientSessionLocked && (
          <p className="mt-4 rounded-xl border border-white/10 bg-white/[0.02] p-4 text-sm text-white/50">
            Dein Therapeut {therapistName ?? ""} hat diese Sitzung noch nicht freigegeben.
          </p>
        )}

        {!clientSessionLocked && (
        <div className="mt-8 space-y-4">
          <h3 className="text-sm font-medium uppercase tracking-wide text-white/50">Notizen</h3>

          {selected.notes.length === 0 && (
            <p className="text-sm text-white/40">Noch keine Einträge in dieser Sitzung.</p>
          )}

          {selected.notes.map((note) => (
            <article
              key={note.id}
              className="rounded-2xl border border-white/10 bg-white/[0.02] p-4"
            >
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-xs text-white/45">
                <span>{note.author_label ?? "Nutzer"}</span>
                <span>
                  {formatGermanDateTime(note.created_at)}
                  {mode === "admin" && (note.revision_count ?? 0) > 0 && (
                    <span className="ml-2 text-red-400">
                      ({note.revision_count} Änderungen)
                    </span>
                  )}
                </span>
              </div>

              {editingNoteId === note.id && canManage ? (
                <div className="space-y-3">
                  {showTherapistNotes && (
                    <textarea
                      value={editTherapist}
                      onChange={(e) => setEditTherapist(e.target.value)}
                      rows={3}
                      placeholder="Therapeuten-Notizen"
                      className="w-full rounded-xl border border-white/15 bg-white/[0.04] px-3 py-2 text-sm text-white"
                    />
                  )}
                  <textarea
                    value={editClient}
                    onChange={(e) => setEditClient(e.target.value)}
                    rows={3}
                    placeholder="Klienten-Notizen"
                    className="w-full rounded-xl border border-white/15 bg-white/[0.04] px-3 py-2 text-sm text-white"
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={pending}
                      onClick={saveEditNote}
                      className="rounded-lg bg-[#63eca9]/20 px-3 py-1.5 text-sm text-[#63eca9]"
                    >
                      Speichern
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingNoteId(null)}
                      className="rounded-lg px-3 py-1.5 text-sm text-white/50"
                    >
                      Abbrechen
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {showTherapistNotes && (
                    <NoteBlock label="Therapeut" body={note.therapist_body} className="mb-3" />
                  )}
                  <NoteBlock label="Klient" body={note.client_body} />
                  {canManage && onUpdateNote && (
                    <button
                      type="button"
                      onClick={() =>
                        startEditNote(note.id, note.therapist_body, note.client_body)
                      }
                      className="mt-3 text-xs text-[#63eca9] hover:underline"
                    >
                      Bearbeiten
                    </button>
                  )}
                </>
              )}
            </article>
          ))}
        </div>
        )}

        {canManage && onAddNote && (
          <div className="mt-6 space-y-3 rounded-2xl border border-dashed border-white/15 p-4">
            <p className="text-sm text-white/60">Neuer Eintrag</p>
            {showTherapistNotes && (
              <textarea
                value={draftTherapist}
                onChange={(e) => setDraftTherapist(e.target.value)}
                rows={3}
                placeholder="Therapeuten-Notizen (nur Team)"
                className="w-full rounded-xl border border-white/15 bg-white/[0.04] px-3 py-2 text-sm text-white"
              />
            )}
            <textarea
              value={draftClient}
              onChange={(e) => setDraftClient(e.target.value)}
              rows={3}
              placeholder="Klienten-Notizen (sichtbar für Klient wenn freigegeben)"
              className="w-full rounded-xl border border-white/15 bg-white/[0.04] px-3 py-2 text-sm text-white"
            />
            {noteError && <p className="text-sm text-red-400">{noteError}</p>}
            <button
              type="button"
              disabled={pending}
              onClick={submitNote}
              className="rounded-xl border border-[#63eca9]/40 bg-[#63eca9]/15 px-4 py-2 text-sm text-[#63eca9] hover:bg-[#63eca9]/25 disabled:opacity-50"
            >
              Eintrag hinzufügen
            </button>
          </div>
        )}

        {canClientAddNote && (
          <div className="mt-6 space-y-3 rounded-2xl border border-dashed border-white/15 p-4">
            <p className="text-sm text-white/60">Neuer Eintrag</p>
            <textarea
              value={draftClient}
              onChange={(e) => setDraftClient(e.target.value)}
              rows={3}
              placeholder="Deine Notizen für diese Sitzung"
              className="w-full rounded-xl border border-white/15 bg-white/[0.04] px-3 py-2 text-sm text-white"
            />
            {noteError && <p className="text-sm text-red-400">{noteError}</p>}
            <button
              type="button"
              disabled={pending || !draftClient.trim()}
              onClick={submitNote}
              className="rounded-xl border border-[#63eca9]/40 bg-[#63eca9]/15 px-4 py-2 text-sm text-[#63eca9] hover:bg-[#63eca9]/25 disabled:opacity-50"
            >
              Eintrag hinzufügen
            </button>
          </div>
        )}
      </div>

      {canManage && (
        <div className="overflow-x-auto rounded-[20px] border border-white/10">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-white/[0.03] text-white/50">
              <tr>
                <th className="px-4 py-3 font-medium">Nr.</th>
                <th className="px-4 py-3 font-medium">Thema</th>
                <th className="px-4 py-3 font-medium">Termin</th>
                <th className="px-4 py-3 font-medium">Freigabe</th>
              </tr>
            </thead>
            <tbody>
              {sortedSessions.map((session) => (
                <tr
                  key={session.id}
                  className={`border-t border-white/10 hover:bg-white/[0.02] ${
                    session.is_special ? "bg-red-500/[0.08]" : ""
                  }`}
                >
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => handleSelect(session.id)}
                      className={
                        session.is_special
                          ? "text-red-300 hover:underline"
                          : "text-[#63eca9] hover:underline"
                      }
                    >
                      {session.is_special ? "N" : session.session_number}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-white/80">{session.topic ?? "—"}</td>
                  <td className="px-4 py-3 text-white/60">
                    {session.scheduled_at
                      ? formatGermanDateTime(session.scheduled_at)
                      : "—"}
                  </td>
                  <td className="px-4 py-3">
                    {onSetReleased && (
                      <SessionReleaseSwitch
                        released={session.released_to_client}
                        label=""
                        variant={session.is_special ? "special" : "default"}
                        onChange={(released) => onSetReleased(session.id, released)}
                      />
                    )}
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
