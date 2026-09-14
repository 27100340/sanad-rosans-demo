/**
 * The one Gemini call helper. Direct REST, pinned fast model, hard timeout,
 * null on any failure so every feature falls back deterministically.
 * Never import this from a client component.
 */

// Pinned. Never use `*-latest` aliases: they resolve to thinking models that
// blow serverless budgets (lesson recorded in the reference project).
export const FAST_MODEL = "gemini-3.5-flash";
export const AUDIO_MODEL = "gemini-3.5-flash";

const SLOW_ALIASES = ["gemini-flash-latest", "gemini-pro-latest"];

export type GeminiPart =
  | { text: string }
  | { inlineData: { mimeType: string; data: string } };

export interface AskGeminiInput {
  model?: string;
  system: string;
  parts: GeminiPart[];
  timeoutMs?: number;
  temperature?: number;
  maxOutputTokens?: number;
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
  const timer = setTimeout(() => controller.abort(), input.timeoutMs ?? 12_000);
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json", "x-goog-api-key": key },
      signal: controller.signal,
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: input.system }] },
        contents: [{ role: "user", parts: input.parts }],
        generationConfig: {
          temperature: input.temperature ?? 0.4,
          maxOutputTokens: input.maxOutputTokens ?? 1200,
        },
      }),
    });
    if (!res.ok) return { text: null, latencyMs: Date.now() - started, live: true };
    const json = (await res.json()) as {
      candidates?: { content?: { parts?: { text?: string }[] } }[];
    };
    const text = json.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("").trim() ?? "";
    return { text: text || null, latencyMs: Date.now() - started, live: true };
  } catch {
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
    const [, k, v] = m;
    const prev = out[k];
    if (prev === undefined) out[k] = v;
    else if (Array.isArray(prev)) prev.push(v);
    else out[k] = [prev, v];
  }
  return out;
}

export const VALUES_GUARDRAIL = `You serve a school community. Be respectful of Islamic values, age-appropriate, and encouraging. Never produce content that is obscene, violent, or mocking of any faith. Never give medical, legal, or religious rulings; direct such questions to a teacher or parent. If a student expresses distress or danger, respond kindly and say you are alerting a teacher. Stay strictly within the task you were given.`;
