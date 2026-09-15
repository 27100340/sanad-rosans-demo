/**
 * Recitations a student has sent to the ustadh, and the marks he writes back.
 *
 * Everything here lives in process memory for the length of the demo run: the
 * submission rows on the singleton store, the audio in a Map beside them.
 * There is no file storage and no upload to any third party — a clip leaves
 * this process only if the student explicitly triggers the experimental AI
 * check, which is a separate route. Restarting the server clears all of it,
 * and the UI says so rather than implying a recording archive exists.
 *
 * Marking is authoritative: it is the only path in this module that writes a
 * unit's spaced-repetition state.
 */
import type { HifzUnit, HifzUnitKind } from "@/lib/domain/types";
import type { HifzMark, HifzSubmission } from "@/lib/domain/hifz-marking";
import { reviewUnit } from "@/lib/domain/srs";
import { todayISO } from "@/lib/utils";
import { singleton } from "./store";
import { ZAID_UNITS } from "./mock/hifz";

/** The recorder's PCM upload format; anything else is served back untouched. */
const PCM_MIME = "audio/pcm;rate=16000";
const PCM_SAMPLE_RATE = 16000;
const WAV_HEADER_BYTES = 44;
const BITS_PER_SAMPLE = 16;
const CHANNELS = 1;

/** Base64 chars. Matches the cap POST /api/hifz/check already enforces. */
export const MAX_AUDIO_BASE64 = 4_000_000;

/**
 * Clips are the only large thing in memory, so only the most recent few are
 * kept. An evicted submission stays in the queue and says plainly that its
 * recording is gone rather than failing to play with no explanation.
 */
const MAX_CLIPS = 8;
const MAX_SUBMISSIONS = 40;

const EVICTED_NOTE = "The recording was dropped to keep the demo's memory bounded. Only the most recent clips are held.";

interface StoredClip {
  base64: string;
  mimeType: string;
}

const HIFZ_STUDENT_ID = "s-zaid-hassan";

/**
 * One seeded row so the marking desk is demonstrable without a microphone. It
 * carries no audio and says so; nothing about it is presented as a recording
 * that exists.
 */
function seedSubmission(): HifzSubmission {
  return {
    id: "sub-seed-1",
    studentId: HIFZ_STUDENT_ID,
    unitId: "u-67b",
    unitKind: "sabqi",
    surah: 67,
    fromAyah: 6,
    toAyah: 10,
    submittedAt: `${todayISO()}T07:20:00.000Z`,
    durationSeconds: 0,
    audioAvailable: false,
    audioNote: "Seeded demo row — no recording is attached. Record from Listen & recite to send a real clip.",
    status: "pending",
    mark: null,
    unitAfterMark: null,
  };
}

const SUBMISSIONS: HifzSubmission[] = singleton("hifzSubmissions", () => [seedSubmission()]);
const CLIPS: Map<string, StoredClip> = singleton("hifzSubmissionClips", () => new Map<string, StoredClip>());

export interface NewSubmission {
  studentId: string;
  unitId: string;
  unitKind: HifzUnitKind;
  surah: number;
  fromAyah: number;
  toAyah: number;
  durationSeconds: number;
  audioBase64: string;
  mimeType: string;
}

function newId(): string {
  return `sub-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

/** Drop the oldest clips once the store is over its cap. */
function evictOldClips(): void {
  while (CLIPS.size > MAX_CLIPS) {
    const oldest = CLIPS.keys().next();
    if (oldest.done) return;
    CLIPS.delete(oldest.value);
    const stale = SUBMISSIONS.find((s) => s.id === oldest.value);
    if (stale) {
      stale.audioAvailable = false;
      stale.audioNote = EVICTED_NOTE;
    }
  }
}

export function createSubmission(input: NewSubmission): HifzSubmission {
  const submission: HifzSubmission = {
    id: newId(),
    studentId: input.studentId,
    unitId: input.unitId,
    unitKind: input.unitKind,
    surah: input.surah,
    fromAyah: input.fromAyah,
    toAyah: input.toAyah,
    submittedAt: new Date().toISOString(),
    durationSeconds: input.durationSeconds,
    audioAvailable: true,
    audioNote: null,
    status: "pending",
    mark: null,
    unitAfterMark: null,
  };
  CLIPS.set(submission.id, { base64: input.audioBase64, mimeType: input.mimeType });
  SUBMISSIONS.unshift(submission);
  while (SUBMISSIONS.length > MAX_SUBMISSIONS) {
    const dropped = SUBMISSIONS.pop();
    if (dropped) CLIPS.delete(dropped.id);
  }
  evictOldClips();
  return submission;
}

export function allSubmissions(): HifzSubmission[] {
  return [...SUBMISSIONS];
}

export function submissionsForStudent(studentId: string): HifzSubmission[] {
  return SUBMISSIONS.filter((s) => s.studentId === studentId);
}

export function findSubmission(id: string): HifzSubmission | undefined {
  return SUBMISSIONS.find((s) => s.id === id);
}

/**
 * The recorder uploads raw little-endian PCM16, which no browser will play, so
 * the 44-byte RIFF header goes back on before it is served. The server-side
 * transcriber builds the same header for its own upload in
 * src/lib/ai/recitation.ts; that copy belongs to the AI pipeline and is not
 * exported, so this one stays local to the audio store.
 */
function wavFromPcm(pcm: Buffer): Buffer {
  const byteRate = PCM_SAMPLE_RATE * CHANNELS * (BITS_PER_SAMPLE / 8);
  const header = Buffer.alloc(WAV_HEADER_BYTES);
  header.write("RIFF", 0);
  header.writeUInt32LE(36 + pcm.length, 4);
  header.write("WAVE", 8);
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20); // PCM
  header.writeUInt16LE(CHANNELS, 22);
  header.writeUInt32LE(PCM_SAMPLE_RATE, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(CHANNELS * (BITS_PER_SAMPLE / 8), 32);
  header.writeUInt16LE(BITS_PER_SAMPLE, 34);
  header.write("data", 36);
  header.writeUInt32LE(pcm.length, 40);
  return Buffer.concat([header, pcm]);
}

function isRecorderPcmMime(mimeType: string): boolean {
  return mimeType.split(" ").join("").toLowerCase() === PCM_MIME;
}

/** Bytes an <audio> element can play, or null when nothing is held. */
export function playableAudio(id: string): { body: Buffer; mimeType: string } | null {
  const clip = CLIPS.get(id);
  if (!clip) return null;
  const bytes = Buffer.from(clip.base64, "base64");
  if (isRecorderPcmMime(clip.mimeType)) return { body: wavFromPcm(bytes), mimeType: "audio/wav" };
  return { body: bytes, mimeType: clip.mimeType };
}

export interface MarkOutcomeRecord {
  submission: HifzSubmission;
  unit: HifzUnit | null;
}

/**
 * Record the qari's mark and let it move the memorisation record. A human mark
 * is the authoritative signal, so it feeds `reviewUnit` directly.
 *
 * The unit object inside ZAID_UNITS is updated in place: the mock module holds
 * one array per process and every Hifz page reads it, so assigning onto the
 * existing object is what makes the new due date and status visible on the
 * student's map. Production replaces this with a repository write.
 */
export function markSubmission(id: string, mark: HifzMark): MarkOutcomeRecord | null {
  const submission = findSubmission(id);
  if (!submission) return null;
  const existing = ZAID_UNITS.find((u) => u.id === submission.unitId);
  const updated = existing ? Object.assign(existing, reviewUnit(existing, mark.score, todayISO())) : null;
  submission.mark = mark;
  submission.status = "marked";
  submission.unitAfterMark = updated ? { ...updated } : null;
  return { submission, unit: submission.unitAfterMark };
}
