/**
 * POST /api/hifz/submission/[id]/mark — the qari's mark on the Hifz rubric.
 * The score is derived from the bands he selected, never sent by the client,
 * and this is the write that moves the unit's spaced-repetition state: a human
 * hearing is the authoritative assessment.
 */
import { NextResponse } from "next/server";
import type { HifzUnit } from "@/lib/domain/types";
import type { HifzMark, HifzSubmission } from "@/lib/domain/hifz-marking";
import { MAX_COMMENT_CHARS, MAX_LUQMAS, isOutcome, missingCriteria, parseRubricMarks, rubricScore } from "@/lib/domain/hifz-marking";
import { getViewer } from "@/lib/auth/viewer";
import { findSubmission, markSubmission } from "@/lib/data/hifz-submissions";
import { teacherById } from "@/lib/data/mock/people";
import { audit } from "@/lib/data/mock/notify";
import { mayMarkHifz } from "../../guards";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface MarkBody {
  marks?: unknown;
  luqmas?: unknown;
  outcome?: unknown;
  comment?: unknown;
}

export interface MarkResponse {
  submission: HifzSubmission;
  unit: HifzUnit | null;
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const viewer = await getViewer();
  if (!mayMarkHifz(viewer)) return NextResponse.json({ error: "Only the ustadh marks a recitation." }, { status: 403 });

  const { id } = await params;
  const existing = findSubmission(id);
  if (!existing) return NextResponse.json({ error: "No such submission." }, { status: 404 });
  // Marking advances the unit's SRS state, so a second mark would move the
  // record twice off one hearing.
  if (existing.status === "marked") return NextResponse.json({ error: "This recitation has already been marked." }, { status: 409 });

  let body: MarkBody;
  try {
    body = (await req.json()) as MarkBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const marks = parseRubricMarks(body.marks);
  if (!marks) return NextResponse.json({ error: "The rubric selection was not understood." }, { status: 400 });
  const missing = missingCriteria(marks);
  if (missing.length) return NextResponse.json({ error: `Still to mark: ${missing.map((c) => c.label).join(", ")}.` }, { status: 400 });
  if (!isOutcome(body.outcome)) return NextResponse.json({ error: "Record an outcome: pass, repeat or needs work." }, { status: 400 });
  if (typeof body.luqmas !== "number" || !Number.isInteger(body.luqmas) || body.luqmas < 0 || body.luqmas > MAX_LUQMAS) {
    return NextResponse.json({ error: `Luqmas must be a whole number from 0 to ${MAX_LUQMAS}.` }, { status: 400 });
  }
  const comment = typeof body.comment === "string" ? body.comment.trim().slice(0, MAX_COMMENT_CHARS) : "";

  const mark: HifzMark = {
    marks,
    luqmas: body.luqmas,
    score: rubricScore(marks),
    outcome: body.outcome,
    comment,
    markedById: viewer.personId,
    markedByName: teacherById.get(viewer.personId)?.name ?? viewer.label,
    markedAt: new Date().toISOString(),
  };

  const recorded = markSubmission(id, mark);
  if (!recorded) return NextResponse.json({ error: "No such submission." }, { status: 404 });

  audit(viewer.personId, "hifz.mark", "student", recorded.submission.studentId, {
    unit: recorded.submission.unitId,
    score: mark.score,
    outcome: mark.outcome,
    luqmas: mark.luqmas,
  });

  const response: MarkResponse = { submission: recorded.submission, unit: recorded.unit };
  return NextResponse.json(response);
}
