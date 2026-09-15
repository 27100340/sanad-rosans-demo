/**
 * Recitation transcription through Groq's Whisper, used as the fallback when
 * Gemini's transcribe model is unavailable.
 *
 * Why a second transcriber at all: `gemini-3.5-transcribe` is capped at 100
 * requests per day per model on this plan, and one sabaq costs several of them
 * because long audio must be segmented. Whisper takes the whole clip in a
 * single request, so a capped day no longer stops a lesson.
 *
 * It is NOT the primary. Measured 2026-09-15 on the same real 90s recitation,
 * Gemini scored 44/44 and Whisper 42/44 (`واجر` heard as `واجو`, `رزقه` as
 * `رزقها`). Those two words are the difference between passing a sabaq and
 * failing one, so the better transcriber leads and this one catches the fall —
 * and the result is labelled `whisper` so nobody reads the two as equivalent.
 *
 * Server-only.
 */

const ENDPOINT = "https://api.groq.com/openai/v1/audio/transcriptions";

/** large-v3 rather than turbo: turbo degraded badly on Quranic Arabic in testing. */
export const WHISPER_MODEL = "whisper-large-v3";

const DEFAULT_TIMEOUT_MS = 45_000;

export interface WhisperResult {
  text: string | null;
  live: boolean;
}

export function whisperIsLive(): boolean {
  return process.env.SANAD_AI_ENABLED !== "false" && Boolean(process.env.GROQ_API_KEY);
}

/**
 * Transcribe a complete WAV clip. No segmenting: Whisper chunks long audio
 * itself, which is the main reason it is worth having here.
 */
export async function transcribeWithWhisper(wav: Buffer, timeoutMs = DEFAULT_TIMEOUT_MS): Promise<WhisperResult> {
  const key = process.env.GROQ_API_KEY;
  if (!key || !whisperIsLive()) return { text: null, live: false };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const form = new FormData();
    form.append("file", new Blob([new Uint8Array(wav)], { type: "audio/wav" }), "recitation.wav");
    form.append("model", WHISPER_MODEL);
    form.append("language", "ar");
    form.append("response_format", "json");

    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: { authorization: `Bearer ${key}` },
      signal: controller.signal,
      body: form,
    });
    if (!res.ok) {
      console.warn(`[whisper] ${WHISPER_MODEL} HTTP ${res.status}`);
      return { text: null, live: true };
    }
    const json = (await res.json()) as { text?: string };
    const text = json.text?.trim() ?? "";
    return { text: text || null, live: true };
  } catch (err) {
    const reason = err instanceof Error ? err.name : "unknown";
    console.warn(`[whisper] ${WHISPER_MODEL} failed (${reason})`);
    return { text: null, live: true };
  } finally {
    clearTimeout(timer);
  }
}
