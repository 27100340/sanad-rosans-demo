/**
 * POST /api/hifz/submission — the student sends a recorded passage to the
 * ustadh for a human hearing. No assessment is produced here and no score is
 * written; the clip simply joins the qari's queue. The audio is held in this
 * process's memory only (src/lib/data/hifz-submissions.ts).
 */
import { NextResponse } from "next/server";
import type { HifzSubmission } from "@/lib/domain/hifz-marking";
import { classifyUnit } from "@/lib/domain/srs";
import { getViewer } from "@/lib/auth/viewer";
import { ZAID_UNITS } from "@/lib/data/mock/hifz";
import { MAX_AUDIO_BASE64, createSubmission } from "@/lib/data/hifz-submissions";
import { canonicalText } from "@/lib/quran";
import { todayISO } from "@/lib/utils";
import { submitAsStudent } from "./guards";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_MIME_CHARS = 80;
const MAX_DURATION_SECONDS = 15 * 60;

interface SubmitBody {
  unitId?: unknown;
  audioBase64?: unknown;
  mimeType?: unknown;
  durationSeconds?: unknown;
}

export interface SubmitResponse {
  submission: HifzSubmission;
}

export async function POST(req: Request) {
  const viewer = await getViewer();
  const studentId = submitAsStudent(viewer);
  if (!studentId) return NextResponse.json({ error: "Only the Hifz student and his ustadh can send a recitation." }, { status: 403 });

  let body: SubmitBody;
  try {
    body = (await req.json()) as SubmitBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (typeof body.unitId !== "string") return NextResponse.json({ error: "Which passage is this?" }, { status: 400 });
  const unit = ZAID_UNITS.find((u) => u.id === body.unitId && u.studentId === studentId);
  if (!unit) return NextResponse.json({ error: "That passage is not on this student's plan." }, { status: 404 });
  if (!canonicalText(unit.surah, unit.fromAyah, unit.toAyah)) return NextResponse.json({ error: "That passage is outside the bundled verse subset." }, { status: 404 });

  if (typeof body.audioBase64 !== "string" || body.audioBase64.length === 0) {
    return NextResponse.json({ error: "No recording was attached, so nothing was sent." }, { status: 400 });
  }
  if (body.audioBase64.length > MAX_AUDIO_BASE64) return NextResponse.json({ error: "Recording too large; record a shorter passage." }, { status: 413 });
  if (typeof body.mimeType !== "string" || !body.mimeType.startsWith("audio/") || body.mimeType.length > MAX_MIME_CHARS) {
    return NextResponse.json({ error: "Unrecognised recording format." }, { status: 400 });
  }
  const duration = typeof body.durationSeconds === "number" && Number.isFinite(body.durationSeconds) ? body.durationSeconds : 0;
  if (duration < 0 || duration > MAX_DURATION_SECONDS) return NextResponse.json({ error: "Recording length is out of range." }, { status: 400 });

  const submission = createSubmission({
    studentId,
    unitId: unit.id,
    unitKind: classifyUnit(unit, todayISO()),
    surah: unit.surah,
    fromAyah: unit.fromAyah,
    toAyah: unit.toAyah,
    durationSeconds: Math.round(duration),
    audioBase64: body.audioBase64,
    mimeType: body.mimeType,
  });

  const response: SubmitResponse = { submission };
  return NextResponse.json(response, { status: 201 });
}
