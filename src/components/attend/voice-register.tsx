"use client";

/**
 * Voice register. The teacher says or types "Hamza absent, Umar late" and the
 * marks are saved one by one through the attendance API. Speech recognition is
 * the browser's own, on-device where the engine is local; the text box is
 * always there so the demo works with no microphone at all.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Ear, Mic, MicOff, Send } from "lucide-react";
import { Chip, SectionTitle } from "@/components/ui/primitives";
import { ATTENDANCE_LABEL, ATTENDANCE_STATUSES, type AttendanceStatus } from "@/lib/domain/attendance";

// Minimal typings: the Web Speech API is not in lib.dom.
interface SpeechResultAlternative { transcript: string }
interface SpeechResultItem { isFinal: boolean; length: number; [index: number]: SpeechResultAlternative }
interface SpeechRecognitionEventLike { resultIndex: number; results: { length: number; [index: number]: SpeechResultItem } }
interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((e: SpeechRecognitionEventLike) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
}
type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

const API = "/api/attendance";
const SPEECH_LANG = "en-GB";
const LOG_MAX = 20;

/** The statuses a spoken command may set; "exempt" needs a written reason, so it stays off the list. */
const SPOKEN: readonly AttendanceStatus[] = ATTENDANCE_STATUSES.filter((s) => s !== "exempt");
const WORD_TO_STATUS = new Map<string, AttendanceStatus>(SPOKEN.map((s) => [s, s]));

export interface VoiceRosterEntry {
  studentId: string;
  name: string;
}

interface LogEntry {
  id: string;
  ok: boolean;
  text: string;
}

function speechCtor(): SpeechRecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { SpeechRecognition?: SpeechRecognitionCtor; webkitSpeechRecognition?: SpeechRecognitionCtor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

function firstNameOf(name: string): string {
  return name.split(/\s+/)[0]?.toLowerCase() ?? "";
}

/** first name -> student id, only where the first name is unique in the roster. */
function nameIndex(roster: VoiceRosterEntry[]): Map<string, string> {
  const counts = new Map<string, number>();
  for (const r of roster) {
    const key = firstNameOf(r.name);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  const index = new Map<string, string>();
  for (const r of roster) {
    const key = firstNameOf(r.name);
    if (counts.get(key) === 1) index.set(key, r.studentId);
  }
  return index;
}

export interface ParsedCommand {
  studentId: string;
  status: AttendanceStatus;
}

export interface ParsedUtterance {
  commands: ParsedCommand[];
  unmatched: string[];
}

/**
 * Splits an utterance into fragments, then reads each fragment word by word.
 * A name and a status in either order make one command; anything else is
 * ignored, and a fragment that yields nothing is reported back to the teacher.
 */
export function parseUtterance(text: string, roster: VoiceRosterEntry[]): ParsedUtterance {
  const index = nameIndex(roster);
  const commands: ParsedCommand[] = [];
  const unmatched: string[] = [];

  for (const fragment of text.split(/[,;.\n]|\band\b|\bthen\b/i)) {
    const words = fragment.toLowerCase().match(/[a-z']+/g) ?? [];
    if (!words.length) continue;
    let pendingId: string | null = null;
    let pendingStatus: AttendanceStatus | null = null;
    let made = 0;
    for (const word of words) {
      const id = index.get(word);
      const status = WORD_TO_STATUS.get(word);
      if (id) pendingId = id;
      else if (status) pendingStatus = status;
      if (pendingId && pendingStatus) {
        commands.push({ studentId: pendingId, status: pendingStatus });
        made += 1;
        pendingId = null;
        pendingStatus = null;
      }
    }
    if (!made) unmatched.push(fragment.trim());
  }
  return { commands, unmatched };
}

export function VoiceRegister({ lessonId, roster }: { lessonId: string; roster: VoiceRosterEntry[] }) {
  const router = useRouter();
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(false);
  const [interim, setInterim] = useState("");
  const [typed, setTyped] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [log, setLog] = useState<LogEntry[]>([]);
  const recRef = useRef<SpeechRecognitionLike | null>(null);
  const nameOf = useCallback((studentId: string) => roster.find((r) => r.studentId === studentId)?.name ?? studentId, [roster]);

  useEffect(() => setSupported(speechCtor() !== null), []);

  const push = useCallback((entries: LogEntry[]) => setLog((prev) => [...entries, ...prev].slice(0, LOG_MAX)), []);

  const apply = useCallback(
    async (text: string) => {
      const clean = text.trim();
      if (!clean) return;
      const { commands, unmatched } = parseUtterance(clean, roster);
      if (!commands.length && !unmatched.length) return;
      setBusy(true);
      setError(null);
      const entries: LogEntry[] = [];
      for (const cmd of commands) {
        try {
          const res = await fetch(API, {
            method: "PATCH",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ lessonId, studentId: cmd.studentId, status: cmd.status, note: "" }),
          });
          const out = (await res.json().catch(() => ({}))) as { error?: string };
          entries.push({
            id: `${cmd.studentId}-${cmd.status}-${Date.now()}-${entries.length}`,
            ok: res.ok,
            text: res.ok ? `${nameOf(cmd.studentId)} · ${ATTENDANCE_LABEL[cmd.status]}` : `${nameOf(cmd.studentId)} · ${out.error ?? "could not be saved"}`,
          });
        } catch {
          entries.push({ id: `${cmd.studentId}-${Date.now()}-${entries.length}`, ok: false, text: `${nameOf(cmd.studentId)} · could not reach the server` });
        }
      }
      for (const frag of unmatched) entries.push({ id: `x-${frag}-${Date.now()}-${entries.length}`, ok: false, text: `Not understood: "${frag}"` });
      push(entries);
      setBusy(false);
      if (entries.some((e) => e.ok)) router.refresh();
    },
    [lessonId, nameOf, push, roster, router],
  );

  const stop = useCallback(() => {
    try {
      recRef.current?.stop();
    } catch {
      /* recognition may already be stopped */
    }
    recRef.current = null;
    setListening(false);
    setInterim("");
  }, []);

  const start = useCallback(() => {
    const Ctor = speechCtor();
    if (!Ctor) {
      setError("This browser has no speech recognition. Type the commands instead.");
      return;
    }
    try {
      const rec = new Ctor();
      rec.lang = SPEECH_LANG;
      rec.continuous = true;
      rec.interimResults = true;
      rec.onresult = (e) => {
        let live = "";
        for (let i = e.resultIndex; i < e.results.length; i += 1) {
          const item = e.results[i];
          const text = item[0]?.transcript ?? "";
          if (item.isFinal) void apply(text);
          else live += ` ${text}`;
        }
        setInterim(live.trim());
      };
      rec.onerror = () => setError("Speech recognition stopped. Type the commands instead.");
      rec.onend = () => {
        recRef.current = null;
        setListening(false);
        setInterim("");
      };
      rec.start();
      recRef.current = rec;
      setError(null);
      setListening(true);
    } catch {
      setError("Speech recognition could not start. Type the commands instead.");
    }
  }, [apply]);

  useEffect(() => () => {
    try {
      recRef.current?.stop();
    } catch {
      /* nothing to stop */
    }
  }, []);

  return (
    <div className="card space-y-4 p-5">
      <SectionTitle title="Voice register" hint="Say or type a name and a status, several at a time: “Hamza absent, Umar late”." />

      <div className="flex flex-wrap items-center gap-2">
        <button type="button" className={listening ? "btn-danger" : "btn-primary"} onClick={() => (listening ? stop() : start())} disabled={busy}>
          {listening ? <MicOff size={14} /> : <Mic size={14} />} {listening ? "Stop listening" : "Start listening"}
        </button>
        {listening ? (
          <Chip tone="warn">
            <Ear size={11} /> Listening
          </Chip>
        ) : null}
        {!supported ? <Chip tone="neutral">No microphone recognition in this browser</Chip> : null}
      </div>

      {interim ? <p className="card-quiet px-3 py-2 text-xs italic text-ink-2">{interim}</p> : null}

      <form
        className="flex flex-col gap-2 sm:flex-row"
        onSubmit={(e) => {
          e.preventDefault();
          if (busy) return;
          const text = typed;
          setTyped("");
          void apply(text);
        }}
      >
        <input
          className="input py-2 text-sm"
          aria-label="Typed register command"
          placeholder="Hamza absent, Umar late, Fatima present"
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          maxLength={300}
        />
        <button type="submit" className="btn-soft shrink-0" disabled={busy || !typed.trim()}>
          <Send size={14} /> Apply
        </button>
      </form>

      <p className="help">
        Statuses you can use: {SPOKEN.map((s) => ATTENDANCE_LABEL[s].toLowerCase()).join(", ")}. Unknown words are ignored.
      </p>

      {error ? <p className="chip-danger">{error}</p> : null}

      {log.length ? (
        <ul className="space-y-1.5">
          {log.map((entry) => (
            <li key={entry.id} className="flex items-center gap-2 text-xs">
              <Chip tone={entry.ok ? "ok" : "warn"}>{entry.ok ? "Marked" : "Skipped"}</Chip>
              <span className="min-w-0 flex-1 truncate text-ink-2">{entry.text}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
