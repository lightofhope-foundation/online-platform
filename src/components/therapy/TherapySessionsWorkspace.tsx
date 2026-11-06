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
  clientToggleNoteReaction,
  therapistAddSessionNote,
  therapistDeleteSpecialSession,
  therapistInsertSpecialSession,
  therapistSetSessionReleased,
  therapistToggleNoteReaction,
  therapistUpdateSessionMeta,
  therapistUpdateSessionNote,
} from "@/app/actions/therapySessions";
import { SessionNotesPanel } from "@/components/therapy/SessionNotesPanel";
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
  /** Deep-link by session UUID (works for Notsitzungen too). */
  initialSessionId?: string | null;
  bunnyLibraryId?: string;
  pathChrome?: SessionPathChrome | null;
  currentUserId?: string | null;
};

function getInitialSessionId(
  mode: TherapySessionsMode,
  sessions: TherapySessionWithNotes[],
  preferredNumber?: number | null,
  preferredId?: string | null
): string | null {
  if (preferredId) {
    const byId = sessions.find((s) => s.id === preferredId);
    if (byId) {
      if (mode === "client" && !byId.released_to_client) {
        return sessions.find((s) => s.released_to_client)?.id ?? null;
      }
      return byId.id;
    }
  }
  if (preferredNumber != null && preferredNumber >= 1 && preferredNumber <= 18) {
    const match = sessions.find(
      (s) => !s.is_special && s.session_number === preferredNumber
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

export function TherapySessionsWorkspace({
  sessions,
  mode,
  clientId,
  therapistName,
  initialSessionNumber,
  initialSessionId,
  bunnyLibraryId,
  pathChrome,
  currentUserId,
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
    getInitialSessionId(mode, sessions, initialSessionNumber, initialSessionId)
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

        {!clientSessionLocked && onAddNote ? (
          <SessionNotesPanel
            notes={selected.notes}
            mode={mode}
            currentUserId={currentUserId}
            sessionId={selected.id}
            locked={clientSessionLocked}
            onAddFeedback={async (text) => {
              await onAddNote(selected.id, "", text);
              // Soft refresh without blocking chat UX
              void Promise.resolve().then(() => router.refresh());
            }}
            onAddPrivateNote={async (html) => {
              await onAddNote(selected.id, html, "");
              router.refresh();
            }}
            onToggleReaction={async (noteId, emoji) => {
              if (mode === "client") {
                await clientToggleNoteReaction(noteId, emoji);
                return;
              }
              if (!clientId) return;
              await therapistToggleNoteReaction(clientId, noteId, emoji);
            }}
          />
        ) : null}
        {noteError ? <p className="mt-2 text-sm text-red-400">{noteError}</p> : null}
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
