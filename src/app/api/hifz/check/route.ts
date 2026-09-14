/**
 * POST /api/hifz/check — the recite-back pipeline (general-spec/06, step 3-7).
 * Resolves a transcript (Gemini audio → browser speech → simulated), aligns
 * it against the canonical Uthmani text, updates the unit's SRS state, and
 * surfaces any look-alike pairs touched by a slip. Always returns a result.
 */
import { NextResponse } from "next/server";
import type { HifzUnit, HifzUnitKind, MutashabihPair, RecitationResult } from "@/lib/domain/types";
import { reviewUnit } from "@/lib/domain/srs";
import { compareRecitation } from "@/lib/quran/diff";
import { ayahAtWordIndex, canonicalText, segmentsFor } from "@/lib/quran";
import { normalizeArabic } from "@/lib/quran/normalize";
import { aiIsLive } from "@/lib/ai/gemini";
import { simulateTranscript, transcribeRecitation, type SimulatedVariant } from "@/lib/ai/recitation";
import { MUTASHABIHAT, ZAID_UNITS } from "@/lib/data/mock/hifz";
import { todayISO } from "@/lib/utils";

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

async function resolveTranscript(body: CheckBody): Promise<Resolved> {
  const live = aiIsLive();
  const simple = normalizeArabic(canonicalText(body.surah, body.from, body.to));
  if (body.mode === "audio" && live && body.audioBase64) {
    const t = await transcribeRecitation({ audioBase64: body.audioBase64, mimeType: body.mimeType ?? "audio/webm", surah: body.surah, from: body.from, to: body.to });
    if (t.transcript) return { transcript: t.transcript, source: "gemini", notes: t.notes, live };
  }
  if (body.mode !== "simulated" && body.browserTranscript?.trim()) {
    return { transcript: body.browserTranscript, source: "browser-speech", notes: [], live };
  }
  const variant: SimulatedVariant = body.mode === "simulated" ? (body.variant ?? "perfect") : "one-miss";
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
  let body: CheckBody;
  try {
    body = (await req.json()) as CheckBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const canonical = canonicalText(body.surah, body.from, body.to);
  if (!canonical) return NextResponse.json({ error: "Range not in the bundled verse subset" }, { status: 404 });

  const resolved = await resolveTranscript(body);
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
  const unit = existing ? reviewUnit(existing, result.score, todayISO()) : null;

  const response: CheckResponse = { result, unit, mutashabihat: matchedPairs(result), live: resolved.live };
  return NextResponse.json(response);
}
