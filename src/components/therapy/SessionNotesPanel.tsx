"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import type { TherapySessionNoteRow } from "@/lib/therapySessions";
import { formatGermanDateTime } from "@/lib/clientId";
import { SimpleRichTextEditor } from "@/components/ui/SimpleRichTextEditor";

const REACTION_EMOJIS = ["👍", "❤️", "😂", "🙏", "🔥", "👏", "😮", "😢"];
const INPUT_EMOJIS = [
  "😊", "😂", "❤️", "👍", "🙏", "🔥", "👏", "😍",
  "😢", "😮", "🎉", "💪", "✨", "🙌", "🤔", "✅",
];

type Mode = "therapist" | "admin" | "client";

type Props = {
  notes: TherapySessionNoteRow[];
  mode: Mode;
  currentUserId?: string | null;
  sessionId: string;
  onAddFeedback: (text: string) => Promise<void>;
  onAddPrivateNote: (html: string) => Promise<void>;
  onToggleReaction: (noteId: string, emoji: string) => Promise<void>;
  locked?: boolean;
};

function stripHtml(html: string) {
  return html.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim();
}

function toggleLocalReaction(
  reactions: Record<string, string[]> | undefined,
  emoji: string,
  userId: string
): Record<string, string[]> {
  const next: Record<string, string[]> = { ...(reactions ?? {}) };
  const set = new Set(next[emoji] ?? []);
  if (set.has(userId)) set.delete(userId);
  else set.add(userId);
  if (set.size === 0) delete next[emoji];
  else next[emoji] = [...set];
  return next;
}

export function SessionNotesPanel({
  notes,
  mode,
  currentUserId,
  sessionId,
  onAddFeedback,
  onAddPrivateNote,
  onToggleReaction,
  locked = false,
}: Props) {
  const [tab, setTab] = useState<"feedback" | "notes">("feedback");
  const [draftChat, setDraftChat] = useState("");
  const [draftNoteHtml, setDraftNoteHtml] = useState("");
  const [expandedNoteId, setExpandedNoteId] = useState<string | null>(null);
  const [pickerFor, setPickerFor] = useState<string | null>(null);
  const [pickerPos, setPickerPos] = useState<{ top: number; left: number } | null>(null);
  const [inputEmojiOpen, setInputEmojiOpen] = useState(false);
  const [plusMenuOpen, setPlusMenuOpen] = useState(false);
  const [localNotes, setLocalNotes] = useState(notes);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const inputBarRef = useRef<HTMLDivElement>(null);
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const reactionBtnRefs = useRef<Map<string, HTMLButtonElement>>(new Map());

  const scrollChatToBottom = () => {
    const el = chatScrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  };

  useEffect(() => {
    setLocalNotes(notes);
  }, [notes]);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      const target = e.target as Node;
      if (!inputBarRef.current?.contains(target)) {
        setInputEmojiOpen(false);
        setPlusMenuOpen(false);
      }
      const pickerEl = document.getElementById("session-reaction-picker");
      if (pickerEl && !pickerEl.contains(target)) {
        const isTrigger = [...reactionBtnRefs.current.values()].some((b) =>
          b.contains(target)
        );
        if (!isTrigger) setPickerFor(null);
      }
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  useLayoutEffect(() => {
    if (!pickerFor) {
      setPickerPos(null);
      return;
    }
    const btn = reactionBtnRefs.current.get(pickerFor);
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    const width = 220;
    const left = Math.min(
      Math.max(8, rect.right - width),
      window.innerWidth - width - 8
    );
    const top = Math.max(8, rect.top - 8);
    setPickerPos({ top, left });
  }, [pickerFor]);

  const feedbackNotes = useMemo(
    () => localNotes.filter((n) => (n.client_body?.trim() ?? "").length > 0),
    [localNotes]
  );
  const privateNotes = useMemo(
    () =>
      localNotes.filter(
        (n) =>
          (n.therapist_body?.trim() ?? "").length > 0 &&
          !(n.client_body?.trim() ?? "").length
      ),
    [localNotes]
  );

  useEffect(() => {
    scrollChatToBottom();
  }, [feedbackNotes.length, tab]);

  const canWriteFeedback =
    !locked && (mode === "therapist" || mode === "admin" || mode === "client");
  const canWritePrivate = !locked && (mode === "therapist" || mode === "admin");

  const sendChat = () => {
    if (!draftChat.trim()) return;
    const text = draftChat.trim();
    setError(null);
    setDraftChat("");
    const optimistic: TherapySessionNoteRow = {
      id: `tmp-${Date.now()}`,
      session_id: sessionId,
      author_id: currentUserId ?? "",
      author_label: "Du",
      author_is_staff: mode !== "client",
      therapist_body: null,
      client_body: text,
      reactions: {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setLocalNotes((prev) => [...prev, optimistic]);
    requestAnimationFrame(() => scrollChatToBottom());
    startTransition(async () => {
      try {
        await onAddFeedback(text);
        requestAnimationFrame(() => scrollChatToBottom());
      } catch (e) {
        setLocalNotes(notes);
        setDraftChat(text);
        setError(e instanceof Error ? e.message : "Senden fehlgeschlagen");
      }
    });
  };

  const savePrivate = () => {
    if (!stripHtml(draftNoteHtml)) return;
    setError(null);
    startTransition(async () => {
      try {
        await onAddPrivateNote(draftNoteHtml);
        setDraftNoteHtml("");
        setTab("notes");
      } catch (e) {
        setError(e instanceof Error ? e.message : "Speichern fehlgeschlagen");
      }
    });
  };

  const react = (noteId: string, emoji: string) => {
    if (!currentUserId) return;
    setPickerFor(null);
    setLocalNotes((prev) =>
      prev.map((n) =>
        n.id === noteId
          ? {
              ...n,
              reactions: toggleLocalReaction(n.reactions, emoji, currentUserId),
            }
          : n
      )
    );
    startTransition(async () => {
      try {
        await onToggleReaction(noteId, emoji);
      } catch {
        setLocalNotes(notes);
      }
    });
  };

  const reactionPicker =
    pickerFor && pickerPos && typeof document !== "undefined"
      ? createPortal(
          <div
            id="session-reaction-picker"
            className="fixed z-[80] flex max-w-[220px] flex-wrap gap-1 rounded-2xl border border-white/15 bg-[#0b1210] p-1.5 shadow-xl"
            style={{
              top: pickerPos.top,
              left: pickerPos.left,
              transform: "translateY(-100%)",
            }}
          >
            {REACTION_EMOJIS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                className="rounded-full px-1.5 py-0.5 text-sm hover:bg-white/10"
                onClick={() => react(pickerFor, emoji)}
              >
                {emoji}
              </button>
            ))}
          </div>,
          document.body
        )
      : null;

  return (
    <div className="mt-8 space-y-4">
      {reactionPicker}
      <div className="flex w-fit rounded-full border border-white/15 bg-black/30 p-0.5 text-xs">
        <button
          type="button"
          onClick={() => setTab("feedback")}
          className={`rounded-full px-4 py-1.5 font-medium ${
            tab === "feedback"
              ? "bg-[#63eca9]/25 text-[#63eca9]"
              : "text-white/55 hover:text-white/85"
          }`}
        >
          Feedback-Chat
        </button>
        {(mode === "therapist" || mode === "admin") && (
          <button
            type="button"
            onClick={() => setTab("notes")}
            className={`rounded-full px-4 py-1.5 font-medium ${
              tab === "notes"
                ? "bg-[#63eca9]/25 text-[#63eca9]"
                : "text-white/55 hover:text-white/85"
            }`}
          >
            Notizen
          </button>
        )}
      </div>

      {tab === "feedback" ? (
        <div className="rounded-2xl border border-white/10 bg-[#0b1210]/70">
          <div
            ref={chatScrollRef}
            className="max-h-[420px] space-y-3 overflow-y-auto px-3 py-4 sm:px-4"
          >
            {feedbackNotes.length === 0 ? (
              <p className="py-8 text-center text-sm text-white/40">
                Noch keine Nachrichten in diesem Chat.
              </p>
            ) : (
              feedbackNotes.map((note) => {
                const mine = Boolean(
                  currentUserId && note.author_id === currentUserId
                );
                return (
                  <div
                    key={note.id}
                    className={`flex ${mine ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`relative max-w-[85%] rounded-2xl px-3.5 py-2.5 ${
                        mine
                          ? "rounded-br-md bg-[#1f6b4a] text-white"
                          : "rounded-bl-md bg-white/[0.08] text-white"
                      }`}
                    >
                      <div className="mb-1 text-[11px] font-medium text-white/70">
                        {note.author_label ?? "Nutzer"}
                      </div>
                      <p className="whitespace-pre-wrap text-sm leading-relaxed">
                        {note.client_body}
                      </p>
                      <div className="mt-1.5 flex flex-wrap items-center justify-between gap-2">
                        <span className="text-[10px] text-white/40">
                          {formatGermanDateTime(note.created_at)}
                        </span>
                        <div className="relative flex items-center gap-1">
                          {Object.entries(note.reactions ?? {}).map(([emoji, users]) =>
                            users.length ? (
                              <button
                                key={emoji}
                                type="button"
                                onClick={() => react(note.id, emoji)}
                                className={`rounded-full border px-1.5 py-0.5 text-[11px] ${
                                  currentUserId && users.includes(currentUserId)
                                    ? "border-[#63eca9]/50 bg-[#63eca9]/15"
                                    : "border-white/15 bg-black/20"
                                }`}
                              >
                                {emoji} {users.length}
                              </button>
                            ) : null
                          )}
                          <button
                            type="button"
                            ref={(el) => {
                              if (el) reactionBtnRefs.current.set(note.id, el);
                              else reactionBtnRefs.current.delete(note.id);
                            }}
                            onClick={() =>
                              setPickerFor((id) => (id === note.id ? null : note.id))
                            }
                            className="rounded-full px-1.5 py-0.5 text-xs text-white/45 hover:bg-white/10 hover:text-white"
                            title="Reaktion"
                          >
                            ☺
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {canWriteFeedback ? (
            <div ref={inputBarRef} className="relative border-t border-white/10 bg-black/30 px-3 py-3">
              {(inputEmojiOpen || plusMenuOpen) && (
                <div className="absolute bottom-full left-3 z-30 mb-2 w-[280px] rounded-2xl border border-white/15 bg-[#0b1210] p-2 shadow-xl">
                  {plusMenuOpen ? (
                    <div className="space-y-1">
                      <button
                        type="button"
                        className="w-full rounded-xl px-3 py-2 text-left text-sm text-white/80 hover:bg-white/10"
                        onClick={() => {
                          setPlusMenuOpen(false);
                          setInputEmojiOpen(true);
                        }}
                      >
                        ☺ Emoji einfügen
                      </button>
                      <p className="px-3 py-2 text-xs text-white/35">
                        Datei-Anhang folgt in einem späteren Update.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-8 gap-1">
                      {INPUT_EMOJIS.map((emoji) => (
                        <button
                          key={emoji}
                          type="button"
                          className="rounded-lg p-1.5 text-lg hover:bg-white/10"
                          onClick={() => {
                            setDraftChat((t) => `${t}${emoji}`);
                          }}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="flex items-end gap-2">
                <button
                  type="button"
                  className="mb-1 rounded-full p-2 text-white/45 hover:bg-white/10 hover:text-white"
                  title="Mehr"
                  onClick={() => {
                    setPlusMenuOpen((o) => !o);
                    setInputEmojiOpen(false);
                  }}
                >
                  +
                </button>
                <button
                  type="button"
                  className="mb-1 rounded-full p-2 text-white/45 hover:bg-white/10 hover:text-white"
                  title="Emoji"
                  onClick={() => {
                    setInputEmojiOpen((o) => !o);
                    setPlusMenuOpen(false);
                  }}
                >
                  ☺
                </button>
                <textarea
                  value={draftChat}
                  onChange={(e) => setDraftChat(e.target.value)}
                  rows={1}
                  placeholder="Nachricht …"
                  className="min-h-[40px] flex-1 resize-none rounded-2xl border border-white/15 bg-white/[0.04] px-3 py-2 text-sm text-white outline-none focus:border-[#63eca9]/40"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      sendChat();
                    }
                  }}
                />
                <button
                  type="button"
                  disabled={pending || !draftChat.trim()}
                  onClick={sendChat}
                  className="mb-0.5 rounded-full bg-[#63eca9] px-4 py-2 text-sm font-medium text-black disabled:opacity-40"
                >
                  Senden
                </button>
              </div>
            </div>
          ) : null}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="space-y-2">
            {privateNotes.length === 0 ? (
              <p className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-8 text-center text-sm text-white/40">
                Noch keine privaten Notizen.
              </p>
            ) : (
              privateNotes.map((note) => {
                const open = expandedNoteId === note.id;
                const preview = stripHtml(note.therapist_body ?? "").slice(0, 120);
                return (
                  <article
                    key={note.id}
                    className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]"
                  >
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedNoteId((id) => (id === note.id ? null : note.id))
                      }
                      className="flex w-full items-start justify-between gap-3 px-4 py-3 text-left"
                    >
                      <div className="min-w-0">
                        <div className="text-xs text-white/40">
                          {formatGermanDateTime(note.created_at)} · {note.author_label}
                        </div>
                        <div className="mt-1 truncate text-sm text-white/80">
                          {preview || "Notiz"}
                          {!open && preview.length >= 120 ? "…" : ""}
                        </div>
                      </div>
                      <span className="text-xs text-white/40">{open ? "▲" : "▼"}</span>
                    </button>
                    {open ? (
                      <div
                        className="border-t border-white/8 px-4 py-3 text-sm text-white/85 [&_a]:text-[#63eca9] [&_a]:underline [&_ul]:list-disc [&_ul]:pl-5"
                        dangerouslySetInnerHTML={{
                          __html: note.therapist_body ?? "",
                        }}
                      />
                    ) : null}
                  </article>
                );
              })
            )}
          </div>
        </div>
      )}

      {canWritePrivate ? (
        <div className="space-y-3 rounded-2xl border border-white/12 bg-white/[0.03] p-4">
          <p className="text-sm text-white/60">
            Private Therapeuten-Notiz (Klient sieht das nicht) — erscheint im Reiter
            Notizen mit Zeitstempel.
          </p>
          <SimpleRichTextEditor
            value={draftNoteHtml}
            onChange={setDraftNoteHtml}
            placeholder="Stichpunkte mit „-“, Fett, Unterstreichen, Links …"
          />
          <button
            type="button"
            disabled={pending || !stripHtml(draftNoteHtml)}
            onClick={savePrivate}
            className="rounded-full bg-[#63eca9] px-5 py-2 text-sm font-medium text-black disabled:opacity-40"
          >
            Notiz speichern
          </button>
        </div>
      ) : null}

      {error ? <p className="text-sm text-red-300">{error}</p> : null}
      <span className="sr-only">{sessionId}</span>
    </div>
  );
}
