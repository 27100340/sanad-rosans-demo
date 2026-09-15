/**
 * Recitation transcription. Recorded clips arrive as 16kHz PCM and go to the
 * dedicated transcribe model, which returns a stable, correctly spaced
 * transcript; anything else (an older client sending webm) goes to the general
 * model with inline audio. The scripted path fabricates a deterministic
 * transcript from the canonical simple text so the pitch never depends on a
 * microphone. Server-only (imports the Gemini helper).
 */
import { AUDIO_MODEL, TRANSCRIBE_MODEL, askGemini } from "./gemini";
import { transcribeWithWhisper } from "./whisper";
import { normalizeArabic } from "@/lib/quran/normalize";

/** The recorder uploads raw little-endian PCM16 at this rate. */
const PCM_MIME = "audio/pcm;rate=16000";
const PCM_SAMPLE_RATE = 16000;
const WAV_HEADER_BYTES = 44;
const BYTES_PER_SECOND = PCM_SAMPLE_RATE * 2;

/**
 * Measured 2026-09-14: the transcribe model returns an empty `content` for a
 * single clip of about 50s or more, while 20s, 30s and 40s all transcribe
 * correctly. A five-ayah sabaq runs close to a minute, so anything longer is
 * split. 40s stays under the observed cliff and costs a third fewer requests.
 */
const SEGMENT_SECONDS = 40;

/** An empty segment on good audio is usually transient; try it twice. */
const SEGMENT_ATTEMPTS = 2;

/**
 * Silence is judged RELATIVE to the recording, never on an absolute level. A
 * studio recitation measures 2100-3600 mean int16, but a child at a laptop mic
 * measures about 170 — barely above an earlier fixed threshold of 120. That
 * threshold silently skipped quiet segments and dropped the words in them,
 * which is precisely the "it omits words when I speak" failure. A segment is
 * silence only when it is far quieter than the rest of the same clip and below
 * a floor no speech reaches.
 */
const SILENT_RELATIVE = 0.12;
const SILENT_FLOOR = 40;

function silenceThreshold(clipLevel: number): number {
  return Math.min(SILENT_FLOOR, clipLevel * SILENT_RELATIVE);
}

/** How far back from a nominal cut to hunt for a pause, and the window scanned. */
const SPLIT_SEARCH_SECONDS = 4;
const SPLIT_WINDOW_MS = 120;

/** Mean absolute sample level over a byte range; used to find a pause. */
function levelOf(pcm: Buffer, start: number, end: number): number {
  let sum = 0;
  let count = 0;
  for (let at = start; at + 1 < end; at += 2) {
    sum += Math.abs(pcm.readInt16LE(at));
    count += 1;
  }
  return count ? sum / count : 0;
}

/**
 * Cut on the quietest window in the few seconds before the nominal boundary,
 * so a split lands in the pause between ayat rather than through a word. Falls
 * back to the nominal cut when the passage has no pause there.
 */
function quietSplitPoint(pcm: Buffer, nominal: number): number {
  const windowBytes = Math.floor((SPLIT_WINDOW_MS / 1000) * BYTES_PER_SECOND) & ~1;
  const earliest = Math.max(0, nominal - SPLIT_SEARCH_SECONDS * BYTES_PER_SECOND);
  let bestAt = nominal;
  let bestLevel = Infinity;
  for (let at = earliest; at + windowBytes <= nominal; at += windowBytes) {
    const level = levelOf(pcm, at, at + windowBytes);
    if (level < bestLevel) {
      bestLevel = level;
      bestAt = at + Math.floor(windowBytes / 2);
    }
  }
  return bestAt & ~1; // keep the cut on a sample boundary
}

/**
 * Split into equal parts rather than fixed-size windows with a remainder. Fixed
 * windows left a stubby tail — a 90s recitation gave four 20s segments and a 10s
 * offcut — and the model returns nothing for that fragment, which failed the
 * whole sabaq. Equal parts keep every segment a similar, workable length.
 */
function segmentPcm(pcm: Buffer): Buffer[] {
  const maxBytes = SEGMENT_SECONDS * BYTES_PER_SECOND;
  if (pcm.length <= maxBytes) return [pcm];
  const count = Math.ceil(pcm.length / maxBytes);
  const target = Math.floor(pcm.length / count);
  const segments: Buffer[] = [];
  let from = 0;
  for (let part = 1; part < count; part += 1) {
    const to = quietSplitPoint(pcm, Math.min(from + target, pcm.length));
    if (to <= from) continue; // no sensible cut here; let this part run on
    segments.push(pcm.subarray(from, to));
    from = to;
  }
  segments.push(pcm.subarray(from));
  return segments;
}

/**
 * Both transcribers take a container, not raw PCM, so put the 44-byte WAV
 * header back on before sending.
 */
function wavBase64(pcm: Buffer): string {
  const header = Buffer.alloc(WAV_HEADER_BYTES);
  header.write("RIFF", 0);
  header.writeUInt32LE(36 + pcm.length, 4);
  header.write("WAVE", 8);
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20); // PCM
  header.writeUInt16LE(1, 22); // mono
  header.writeUInt32LE(PCM_SAMPLE_RATE, 24);
  header.writeUInt32LE(PCM_SAMPLE_RATE * 2, 28);
  header.writeUInt16LE(2, 32);
  header.writeUInt16LE(16, 34);
  header.write("data", 36);
  header.writeUInt32LE(pcm.length, 40);
  return Buffer.concat([header, pcm]).toString("base64");
}

export const MAX_TAJWEED_NOTES = 3;

const SYSTEM = `You are a Quran recitation transcriber for a Hifz madrasa. Listen to the audio and transcribe the Quranic Arabic recitation VERBATIM as plain Arabic words: no diacritics (tashkeel), no ayah numbers, no punctuation, no commentary, no translation. Write exactly the words you hear in the order heard, even if the reciter omits, repeats or substitutes a word; never correct the reciter towards the expected text. Output the transcript on the first line(s). After the transcript you may add up to ${MAX_TAJWEED_NOTES} lines of the form "NOTE: <observation>" describing tajweed observations (elongation, nasalisation, letter substitution) only where you are confident, phrased as gentle suggestions for the teacher to confirm. If the audio is silent or contains no Arabic recitation, output only the word SILENT.`;

export interface TranscribeInput {
  audioBase64: string;
  mimeType: string;
  surah: number;
  from: number;
  to: number;
}

export interface TranscribeResult {
  transcript: string | null; // null when not live, silent, or the call failed
  notes: string[];
  live: boolean;
  /** Which transcriber produced it, so the result can say so honestly. */
  engine: "gemini" | "whisper";
}

/** True when the recorder sent raw PCM rather than a browser container. */
export function isRecorderPcm(mimeType: string): boolean {
  return mimeType.split(" ").join("").toLowerCase() === PCM_MIME;
}

/**
 * Whisper takes the whole recitation in one request, so it is the answer when
 * Gemini is capped or a segment will not read. Still the fallback, never the
 * lead: it is measurably the weaker transcriber on Quranic Arabic.
 */
async function whisperWholeClip(pcm: Buffer, live: boolean): Promise<TranscribeResult> {
  const res = await transcribeWithWhisper(Buffer.from(wavBase64(pcm), "base64"));
  if (!res.text) return { transcript: null, notes: [], live: live || res.live, engine: "whisper" };
  return { ...parseTranscript(res.text), live: res.live, engine: "whisper" };
}

export async function transcribeRecitation(input: TranscribeInput): Promise<TranscribeResult> {
  if (isRecorderPcm(input.mimeType)) {
    // Transcribe-only model: it returns words and no NOTE lines, so tajweed
    // notes are empty here, and it rejects a system instruction, so the one
    // instruction it needs rides along with the audio. Word-level feedback
    // comes from the local alignment either way.
    const pcm = Buffer.from(input.audioBase64, "base64");
    const segments = segmentPcm(pcm);
    const quiet = silenceThreshold(levelOf(pcm, 0, pcm.length));
    const pieces: string[] = [];
    let live = false;
    for (const segment of segments) {
      // Silence carries no words to lose, so skip it without spending a request.
      if (levelOf(segment, 0, segment.length) < quiet) continue;
      let text: string | null = null;
      // A segment occasionally comes back empty on otherwise good audio, so try
      // once more before giving up on it.
      for (let attempt = 1; attempt <= SEGMENT_ATTEMPTS && !text; attempt += 1) {
        const res = await askGemini({
          model: TRANSCRIBE_MODEL,
          parts: [
            { text: "Transcribe this Quranic Arabic recitation exactly, as separate words." },
            { inlineData: { mimeType: "audio/wav", data: wavBase64(segment) } },
          ],
          temperature: 0,
          maxOutputTokens: 800,
          timeoutMs: 45_000,
        });
        live = res.live;
        text = res.text;
      }
      // Never score a partial transcript. Skipping a failed segment silently
      // dropped ~30s of a real recitation and still returned a confident 61%,
      // which is a fabricated assessment of a child's memorisation. If any part
      // of the audio could not be read, the whole attempt fails honestly.
      if (!text) {
        console.warn(`[recitation] segment ${pieces.length + 1}/${segments.length} returned nothing; falling back to Whisper for the whole clip`);
        return whisperWholeClip(pcm, live);
      }
      pieces.push(text);
    }
    if (!pieces.length) return { transcript: null, notes: [], live, engine: "gemini" };
    return { ...parseTranscript(pieces.join(" ")), live, engine: "gemini" };
  }

  const res = await askGemini({
    model: AUDIO_MODEL,
    system: SYSTEM,
    parts: [
      { inlineData: { mimeType: input.mimeType, data: input.audioBase64 } },
      { text: `The reciter is attempting Surah ${input.surah}, ayat ${input.from} to ${input.to}. Transcribe what is actually heard.` },
    ],
    temperature: 0.1,
    maxOutputTokens: 800,
    timeoutMs: 45_000,
  });
  if (!res.text) return { transcript: null, notes: [], live: res.live, engine: "gemini" };
  return { ...parseTranscript(res.text), live: res.live, engine: "gemini" };
}

export function parseTranscript(text: string): { transcript: string | null; notes: string[] } {
  const notes: string[] = [];
  const body: string[] = [];
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) continue;
    const note = line.match(/^NOTE:\s*(.+)$/i);
    if (note) notes.push(note[1].trim());
    else body.push(line);
  }
  const joined = normalizeArabic(body.join(" "));
  if (!joined || /^SILENT$/i.test(body.join(" ").trim())) return { transcript: null, notes: notes.slice(0, MAX_TAJWEED_NOTES) };
  return { transcript: joined, notes: notes.slice(0, MAX_TAJWEED_NOTES) };
}

export type SimulatedVariant = "perfect" | "one-miss" | "one-sub";

const MISS_OFFSET_FROM_END = 4;

/** Deterministic scripted attempt over the canonical simple text. */
export function simulateTranscript(canonicalSimpleText: string, variant: SimulatedVariant): string {
  const words = normalizeArabic(canonicalSimpleText).split(" ").filter(Boolean);
  if (variant === "perfect" || words.length < MISS_OFFSET_FROM_END + 1) return words.join(" ");
  if (variant === "one-miss") {
    const drop = words.length - MISS_OFFSET_FROM_END;
    return words.filter((_, i) => i !== drop).join(" ");
  }
  const at = Math.floor(words.length / 2);
  const word = words[at];
  // The classic slip: adding or dropping the leading waw of a word.
  const slipped = word.startsWith("و") && word.length > 2 ? word.slice(1) : `و${word}`;
  return words.map((w, i) => (i === at ? slipped : w)).join(" ");
}
