/**
 * Handwriting reader for photographed answer scripts. Gemini transcribes the
 * working as plain text (one step per line) so the Mark-Scheme Marker can
 * score it like a typed answer. Without a key or on any failure it returns
 * null and the runner asks the student to type the answer instead.
 */
import { askGemini, AUDIO_MODEL, VALUES_GUARDRAIL } from "./gemini";

const MAX_IMAGE_BYTES = 4_000_000;

export interface TranscriptOutput {
  text: string;
  live: boolean;
}

export function parseDataUrl(dataUrl: string): { mimeType: string; data: string } | null {
  const m = /^data:(image\/(?:jpe?g|png|webp));base64,(.+)$/i.exec(dataUrl);
  if (!m || m[2].length > MAX_IMAGE_BYTES) return null;
  return { mimeType: m[1], data: m[2] };
}

export async function transcribe(dataUrl: string, question: string): Promise<TranscriptOutput | null> {
  const image = parseDataUrl(dataUrl);
  if (!image) return null;
  const res = await askGemini({
    model: AUDIO_MODEL,
    system: [
      "You read a photographed handwritten answer to an exam question and transcribe it faithfully.",
      VALUES_GUARDRAIL,
      "Output ONLY the transcription: one line per step of working, mathematics in plain text (use x, /, ^, sqrt). Do not solve, correct or comment. If the image has no readable answer, output exactly: UNREADABLE",
    ].join("\n"),
    parts: [{ text: `QUESTION: ${question.slice(0, 600)}` }, { inlineData: image }],
    temperature: 0.1,
    maxOutputTokens: 600,
    timeoutMs: 20_000,
  });
  if (!res.text || /^UNREADABLE/i.test(res.text.trim())) return res.live ? { text: "", live: true } : null;
  return { text: res.text.trim(), live: true };
}
