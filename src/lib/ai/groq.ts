/**
 * The one Groq call helper: every text seat goes through here. Direct REST,
 * pinned model, hard timeout, null on any failure so each feature falls back
 * to its deterministic script. Never import this from a client component.
 *
 * Provider split (decided 2026-09-14): audio and images stay on Gemini because
 * Groq serves no multimodal model here — recitation uses the Live API
 * transcribe model and handwriting uses Gemini vision. Everything text-only
 * runs on Groq, whose free tier allows ~1,000 requests per window against
 * Gemini's 20 per day.
 */

// Pinned. The catalogue also carries smaller qwen/allam models; this is the
// strongest general model Groq serves and the only one validated against the
// KEY: line format that brief, marker, risk-note and designer parse.
export const GROQ_TEXT_MODEL = "openai/gpt-oss-120b";

const ENDPOINT = "https://api.groq.com/openai/v1/chat/completions";
const DEFAULT_TIMEOUT_MS = 30_000;

// Groq returns 429 with a Retry-After when the per-minute token bucket is dry,
// and 503 under load. One retry inside the timeout budget covers both.
const RETRY_STATUSES = [429, 503];
const RETRY_DELAY_MS = 700;
const MAX_ATTEMPTS = 2;

// gpt-oss reasons before answering and bills those tokens against max_tokens.
// Measured 2026-09-14 on a parent brief: at default effort it spent 471 of 500
// tokens reasoning and returned a truncated headline, so every brief fell back to
// script. "low" is the floor the API accepts (there is no "none"), and it still
// used 269 tokens — hence a separate allowance on top of the caller's budget so
// maxOutputTokens continues to mean visible output.
const REASONING_EFFORT = "low";
const REASONING_HEADROOM_TOKENS = 500;

export interface AskGroqInput {
  system: string;
  /** Text blocks, joined with blank lines. Groq serves no multimodal model here. */
  parts: { text: string }[];
  timeoutMs?: number;
  temperature?: number;
  maxOutputTokens?: number;
}

export interface AskGroqResult {
  text: string | null;
  latencyMs: number;
  live: boolean; // false when no key is configured
}

/** True when the text seats can answer live. Mirrors aiIsLive() for Gemini. */
export function groqIsLive(): boolean {
  return process.env.SANAD_AI_ENABLED !== "false" && Boolean(process.env.GROQ_API_KEY);
}

export async function askGroq(input: AskGroqInput): Promise<AskGroqResult> {
  const started = Date.now();
  const key = process.env.GROQ_API_KEY;
  if (!key || !groqIsLive()) return { text: null, latencyMs: 0, live: false };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), input.timeoutMs ?? DEFAULT_TIMEOUT_MS);
  const body = JSON.stringify({
    model: GROQ_TEXT_MODEL,
    messages: [
      { role: "system", content: input.system },
      { role: "user", content: input.parts.map((p) => p.text).join("\n\n") },
    ],
    temperature: input.temperature ?? 0.4,
    max_tokens: (input.maxOutputTokens ?? 1200) + REASONING_HEADROOM_TOKENS,
    reasoning_effort: REASONING_EFFORT,
  });

  try {
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
      const res = await fetch(ENDPOINT, {
        method: "POST",
        headers: { "content-type": "application/json", authorization: `Bearer ${key}` },
        signal: controller.signal,
        body,
      });
      if (res.ok) {
        const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
        const text = json.choices?.[0]?.message?.content?.trim() ?? "";
        return { text: text || null, latencyMs: Date.now() - started, live: true };
      }
      // A failed call and the scripted fallback look identical in the UI, so log
      // the reason server-side rather than letting live AI degrade silently.
      console.warn(`[groq] ${GROQ_TEXT_MODEL} HTTP ${res.status} after ${Date.now() - started}ms`);
      if (!RETRY_STATUSES.includes(res.status) || attempt === MAX_ATTEMPTS) break;
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
    }
    return { text: null, latencyMs: Date.now() - started, live: true };
  } catch (err) {
    const reason = err instanceof Error ? err.name : "unknown";
    console.warn(`[groq] ${GROQ_TEXT_MODEL} failed (${reason}) after ${Date.now() - started}ms`);
    return { text: null, latencyMs: Date.now() - started, live: true };
  } finally {
    clearTimeout(timer);
  }
}
