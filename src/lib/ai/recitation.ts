/**
 * Recitation transcription. Live path sends the recorded clip to Gemini with
 * inline audio; the scripted path fabricates a deterministic transcript from
 * the canonical simple text so the pitch never depends on a microphone.
 * Server-only (imports the Gemini helper).
 */
import { AUDIO_MODEL, askGemini } from "./gemini";
import { normalizeArabic } from "@/lib/quran/normalize";

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
}

export async function transcribeRecitation(input: TranscribeInput): Promise<TranscribeResult> {
  const res = await askGemini({
    model: AUDIO_MODEL,
    system: SYSTEM,
    parts: [
      { inlineData: { mimeType: input.mimeType, data: input.audioBase64 } },
      { text: `The reciter is attempting Surah ${input.surah}, ayat ${input.from} to ${input.to}. Transcribe what is actually heard.` },
    ],
    temperature: 0.1,
    maxOutputTokens: 800,
    timeoutMs: 20_000,
  });
  if (!res.text) return { transcript: null, notes: [], live: res.live };
  return { ...parseTranscript(res.text), live: res.live };
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
