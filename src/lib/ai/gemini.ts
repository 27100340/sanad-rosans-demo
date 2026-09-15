/**
 * The one Gemini call helper. Direct REST, pinned fast model, hard timeout,
 * null on any failure so every feature falls back deterministically.
 * Never import this from a client component.
 */

// Pinned. Never use `*-latest` aliases: they resolve to thinking models that
// blow serverless budgets (lesson recorded in the reference project).
export const FAST_MODEL = "gemini-3.5-flash";
export const AUDIO_MODEL = "gemini-3.5-flash";

// Recitation transcription. Measured 2026-09-14 on the same 27s Al-Mulk clip:
// this model returned a byte-identical, correctly spaced transcript on three
// consecutive runs. The Live API streams phrase chunks whose seams do not fall
// on word boundaries, which broke word-level alignment and scored a correct
// recitation at 75-90%. Determinism matters more here than the Live tier's
// unmetered quota, because the score is written to a student's record.
export const TRANSCRIBE_MODEL = "gemini-3.5-transcribe";

// gemini-3.5-flash reports `thinking: true` and reasons by default. Measured 2026-09-14
// on a one-sentence prompt: default thinking 27-49s, thinkingLevel "low" 27s, thinking
// off 6.6s. Anything slower than the timeout below aborts into the scripted fallback,
// so thinking is off unless a caller opts in. Callers that opt in must raise timeoutMs.
const DEFAULT_THINKING_BUDGET = 0;

// With thinking off the same prompt measured 5-7s warm, but a cold or contended call
// spiked to 31s. The old 12s cap turned every spike into a silent scripted fallback;
// the demo runs as a long-lived service, not a serverless function, so waiting is safe.
const DEFAULT_TIMEOUT_MS = 30_000;

// gemini-3.5-flash returns 503 "high demand" intermittently; that clears in about a
// second, so retry it once inside the existing timeout budget. 429 is deliberately not
// retried: it means the request quota is spent (the free tier allows 20 generateContent
// calls per day per model), so a second attempt fails the same way — measured 2026-09-14.
// The scripted fallback is a better answer than more waiting.
const RETRY_STATUSES = [503];
const RETRY_DELAY_MS = 700;
const MAX_ATTEMPTS = 2;

const SLOW_ALIASES = ["gemini-flash-latest", "gemini-pro-latest"];

/** Transcribe models accept neither a developer instruction nor thinkingConfig. */
const THINKING_CAPABLE = (model: string) => !model.startsWith("gemini-3.5-transcribe");

export type GeminiPart =
  | { text: string }
  | { inlineData: { mimeType: string; data: string } };

/**
 * Response parts are not all shaped alike: the transcribe models return
 * `audioTranscription.text` rather than `text`, and reading only `text` made a
 * perfectly good transcript look like an empty answer.
 */
interface GeminiResponsePart {
  text?: string;
  audioTranscription?: { text?: string };
}

function partText(part: GeminiResponsePart): string {
  return part.text ?? part.audioTranscription?.text ?? "";
}

export interface AskGeminiInput {
  model?: string;
  /** Omitted for models that reject it, such as the transcribe models. */
  system?: string;
  parts: GeminiPart[];
  timeoutMs?: number;
  temperature?: number;
  maxOutputTokens?: number;
  /** Reasoning tokens the model may spend. 0 (default) keeps latency inside the timeout. */
  thinkingBudget?: number;
}

export interface AskGeminiResult {
  text: string | null;
  latencyMs: number;
  live: boolean; // false when no key is configured
}

export function aiIsLive(): boolean {
  return process.env.SANAD_AI_ENABLED !== "false" && Boolean(process.env.GEMINI_API_KEY);
}

export async function askGemini(input: AskGeminiInput): Promise<AskGeminiResult> {
  const started = Date.now();
  const key = process.env.GEMINI_API_KEY;
  if (!key || !aiIsLive()) return { text: null, latencyMs: 0, live: false };

  const model = input.model ?? FAST_MODEL;
  if (SLOW_ALIASES.includes(model)) throw new Error(`Refusing slow alias ${model}`);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), input.timeoutMs ?? DEFAULT_TIMEOUT_MS);
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
  const body = JSON.stringify({
    // `gemini-3.5-transcribe` rejects a developer instruction outright, so the
    // field is omitted rather than sent empty.
    ...(input.system ? { systemInstruction: { parts: [{ text: input.system }] } } : {}),
    contents: [{ role: "user", parts: input.parts }],
    generationConfig: {
      temperature: input.temperature ?? 0.4,
      maxOutputTokens: input.maxOutputTokens ?? 1200,
      // The transcribe models do no reasoning and reject the field with a bare
      // HTTP 400, the same way they reject a developer instruction.
      ...(THINKING_CAPABLE(model)
        ? { thinkingConfig: { thinkingBudget: input.thinkingBudget ?? DEFAULT_THINKING_BUDGET } }
        : {}),
    },
  });

  try {
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
      const res = await fetch(url, {
        method: "POST",
        headers: { "content-type": "application/json", "x-goog-api-key": key },
        signal: controller.signal,
        body,
      });
      if (res.ok) {
        const json = (await res.json()) as {
          candidates?: { content?: { parts?: GeminiResponsePart[] } }[];
        };
        const text = json.candidates?.[0]?.content?.parts?.map(partText).join("").trim() ?? "";
        return { text: text || null, latencyMs: Date.now() - started, live: true };
      }
      // A failed call and the scripted fallback look identical in the UI, so log the
      // reason server-side rather than letting live AI degrade silently.
      console.warn(`[gemini] ${model} HTTP ${res.status} after ${Date.now() - started}ms`);
      if (!RETRY_STATUSES.includes(res.status) || attempt === MAX_ATTEMPTS) break;
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
    }
    return { text: null, latencyMs: Date.now() - started, live: true };
  } catch (err) {
    const reason = err instanceof Error ? err.name : "unknown";
    console.warn(`[gemini] ${model} failed (${reason}) after ${Date.now() - started}ms`);
    return { text: null, latencyMs: Date.now() - started, live: true };
  } finally {
    clearTimeout(timer);
  }
}

/** Parse `KEY: value` lines into a map; repeated keys become arrays. */
export function parseKeyLines(text: string): Record<string, string | string[]> {
  const out: Record<string, string | string[]> = {};
  for (const raw of text.split(/\r?\n/)) {
    const m = raw.match(/^\s*([A-Z_]+):\s*(.*)$/);
    if (!m) continue;
    // gpt-oss ends lines with the two trailing spaces that mean a markdown break.
    const [, k, rawValue] = m;
    const v = rawValue.trimEnd();
    const prev = out[k];
    if (prev === undefined) out[k] = v;
    else if (Array.isArray(prev)) prev.push(v);
    else out[k] = [prev, v];
  }
  return out;
}

export const VALUES_GUARDRAIL = `You serve a school community. Be respectful of Islamic values, age-appropriate, and encouraging. Never produce content that is obscene, violent, or mocking of any faith. Never give medical, legal, or religious rulings; direct such questions to a teacher or parent. If a student expresses distress or danger, respond kindly and say you are alerting a teacher. Stay strictly within the task you were given.`;
