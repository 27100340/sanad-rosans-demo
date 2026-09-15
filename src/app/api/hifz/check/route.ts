/**
 * POST /api/hifz/check — the recite-back pipeline (general-spec/06, step 3-7).
 * Resolves a transcript (Gemini audio → Whisper → simulated), aligns
 * it against the canonical Uthmani text, updates the unit's SRS state, and
 * surfaces any look-alike pairs touched by a slip. Always returns a result.
 */
import { NextResponse } from "next/server";
import type { HifzUnit, HifzUnitKind, MutashabihPair, RecitationResult } from "@/lib/domain/types";
import { reviewUnit } from "@/lib/domain/srs";
import { compareRecitation } from "@/lib/quran/diff";
import { ayahAtWordIndex, canonicalText, segmentsFor } from "@/lib/quran";
import { normalizeArabic, tokenizeArabic } from "@/lib/quran/normalize";
import { aiIsLive } from "@/lib/ai/gemini";
import { simulateTranscript, transcribeRecitation, type SimulatedVariant } from "@/lib/ai/recitation";
import { MUTASHABIHAT, ZAID_UNITS } from "@/lib/data/mock/hifz";
import { todayISO } from "@/lib/utils";
import { getViewer } from "@/lib/auth/viewer";
import { viewerRestriction } from "@/lib/auth/access";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PASS_SABAQ = 100;
const PASS_REVISION = 95;

interface CheckBody {
  surah: number;
  from: number;
  to: number;
  mode: "audio" | "browser" | "simulated";
  audioBase64?: string;
  mimeType?: string;
  browserTranscript?: string;
  variant?: SimulatedVariant;
  unitKind?: HifzUnitKind;
  unitId?: string;
}

export interface CheckResponse {
  result: RecitationResult;
  unit: HifzUnit | null;
  mutashabihat: MutashabihPair[];
  live: boolean;
}

interface Resolved {
  transcript: string;
  source: RecitationResult["source"];
  notes: string[];
  live: boolean;
}

/**
 * A transcript this much shorter than the passage is a failed capture, not a
 * weak recitation: a silent or noisy clip makes the model emit a word or two,
 * which would otherwise be scored as ~0% and written to the student's
 * memorisation record. A student who genuinely stops part-way still clears this
 * and is scored with real omissions.
 */
const MIN_HEARD_FRACTION = 0.25;

function tooLittleHeard(transcript: string, expected: string): boolean {
  const heard = tokenizeArabic(transcript).length;
  const total = tokenizeArabic(expected).length;
  return total > 0 && heard < Math.ceil(total * MIN_HEARD_FRACTION);
}

async function resolveTranscript(body: CheckBody): Promise<Resolved> {
  const live = aiIsLive();
  const simple = normalizeArabic(canonicalText(body.surah, body.from, body.to));
  if (body.mode === "audio" && live && body.audioBase64) {
    const t = await transcribeRecitation({ audioBase64: body.audioBase64, mimeType: body.mimeType ?? "audio/webm", surah: body.surah, from: body.from, to: body.to });
    if (t.transcript && tooLittleHeard(t.transcript, simple)) {
      throw new Error(
        `Only ${tokenizeArabic(t.transcript).length} words were heard out of about ${tokenizeArabic(simple).length}. That usually means the recording did not pick up the recitation. No score was recorded — check the microphone and recite again.`,
      );
    }
    if (t.transcript) return { transcript: t.transcript, source: t.engine, notes: t.notes, live };
  }
  // Only when the seat explicitly has no recording to send. A failed audio
  // attempt must NOT be quietly graded by the browser recogniser: on a correct
  // recitation of Al-Kafirun that path produced 11% and marked the unit weak.
  if (body.mode === "browser" && body.browserTranscript?.trim() && !tooLittleHeard(body.browserTranscript, simple)) {
    return { transcript: body.browserTranscript, source: "browser-speech", notes: [], live };
  }
  if (body.mode !== "simulated") throw new Error("The recording could not be transcribed. No score was created. Retry, ask your ustadh, or explicitly choose a simulated example.");
  const variant: SimulatedVariant = body.variant ?? "perfect";
  return { transcript: simulateTranscript(simple, variant), source: "simulated", notes: [], live };
}

function matchedPairs(result: RecitationResult): MutashabihPair[] {
  const segments = segmentsFor(result.surah, result.fromAyah, result.toAyah);
  const slipped = new Set<number>();
  for (const w of result.words) {
    if (w.state !== "sub" && w.state !== "miss") continue;
    const ayah = ayahAtWordIndex(segments, w.index);
    if (ayah !== undefined) slipped.add(ayah);
  }
  return MUTASHABIHAT.filter(
    (p) => (p.a.surah === result.surah && slipped.has(p.a.ayah)) || (p.b.surah === result.surah && slipped.has(p.b.ayah)),
  );
}

export async function POST(req: Request) {
  const viewer = await getViewer();
  if (viewerRestriction(viewer) || !(viewer.role === "ustadh" || viewer.studentId === "s-zaid-hassan")) return NextResponse.json({ error: "This recitation tool is available to the Hifz seats." }, { status: 403 });
  let body: CheckBody;
  try {
    body = (await req.json()) as CheckBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  if (!body || typeof body !== "object" || !["audio", "browser", "simulated"].includes(body.mode) || ![body.surah, body.from, body.to].every(Number.isInteger) || body.from < 1 || body.to < body.from || body.to - body.from > 20) return NextResponse.json({ error: "Invalid recitation range or mode." }, { status: 400 });
  if (body.variant && !["perfect", "one-miss", "one-sub"].includes(body.variant)) return NextResponse.json({ error: "Unknown simulated example." }, { status: 400 });
  if (body.audioBase64 && (typeof body.audioBase64 !== "string" || body.audioBase64.length > 4_000_000)) return NextResponse.json({ error: "Recording too large; use a shorter clip." }, { status: 413 });
  if (body.browserTranscript && (typeof body.browserTranscript !== "string" || body.browserTranscript.length > 6000)) return NextResponse.json({ error: "Transcript too long." }, { status: 400 });
  const canonical = canonicalText(body.surah, body.from, body.to);
  if (!canonical) return NextResponse.json({ error: "Range not in the bundled verse subset" }, { status: 404 });

  let resolved: Resolved;
  try { resolved = await resolveTranscript(body); } catch(e) { return NextResponse.json({ error: e instanceof Error ? e.message : "Transcription unavailable" }, { status: 422 }); }
  const passThreshold = body.unitKind === "sabaq" || body.unitKind === undefined ? PASS_SABAQ : PASS_REVISION;
  const result = compareRecitation(canonical, resolved.transcript, {
    passThreshold,
    source: resolved.source,
    surah: body.surah,
    fromAyah: body.from,
    toAyah: body.to,
    tajweedNotes: resolved.notes,
  });

  const existing = body.unitId ? ZAID_UNITS.find((u) => u.id === body.unitId) : undefined;
  // Only a real server-side transcription moves a child's memorisation record.
  // Gemini and Whisper both qualify; simulated attempts never did, and browser
  // speech must not either, because Chrome's ar-SA recogniser scores fluent
  // Quranic recitation in the low tens and would record "weak" on the strength
  // of its own mishearing.
  const transcribed = resolved.source === "gemini" || resolved.source === "whisper";
  const unit = existing && transcribed ? reviewUnit(existing, result.score, todayISO()) : null;

  const response: CheckResponse = { result, unit, mutashabihat: matchedPairs(result), live: resolved.live };
  return NextResponse.json(response);
}
