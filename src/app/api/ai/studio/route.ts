/**
 * Question Studio. POST drafts a question for a space the teacher owns; PUT
 * accepts an edited draft into the subject's bank and audits it. Only the
 * owning teacher may do either.
 */
import { getViewer } from "@/lib/auth/viewer";
import type { Persona } from "@/lib/auth/personas";
import { draftQuestion, MCQ_OPTIONS } from "@/lib/ai/studio";
import { subjectIdForSpace } from "@/lib/ai/assess";
import { addQuestion } from "@/lib/data/mock/questions";
import { audit } from "@/lib/data/mock/notify";
import { spaceById } from "@/lib/data/mock/spaces";
import type { Difficulty, QuestionType } from "@/lib/domain/assessment";
import type { SubjectSpace } from "@/lib/domain/types";

const TYPES: QuestionType[] = ["mcq", "numeric", "short", "structured"];
const MAX_MARKS = 10;
const MAX_STEM = 1000;
const MAX_LINE = 300;

interface Body {
  spaceId?: string;
  topicCode?: string;
  type?: string;
  difficulty?: string;
  brief?: string;
  stem?: string;
  options?: unknown;
  answer?: string;
  markScheme?: unknown;
  marks?: number;
}

function ownedSpace(viewer: Persona, spaceId: string | undefined): SubjectSpace | null {
  if (viewer.role !== "teacher" || !spaceId) return null;
  const space = spaceById.get(spaceId);
  return space && space.teacherId === viewer.personId ? space : null;
}

function questionType(value: string | undefined): QuestionType {
  return TYPES.includes(value as QuestionType) ? (value as QuestionType) : "structured";
}

function difficultyOf(value: string | undefined): Difficulty {
  return value === "extended" ? "extended" : "core";
}

function lines(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((x): x is string => typeof x === "string").map((x) => x.trim().slice(0, MAX_LINE)).filter(Boolean);
}

function topicCodeOf(space: SubjectSpace, value: string | undefined): string | null {
  return space.syllabus.some((t) => t.code === value) ? (value as string) : null;
}

export async function POST(req: Request) {
  const viewer = await getViewer();
  const body = (await req.json().catch(() => ({}))) as Body;
  const space = ownedSpace(viewer, body.spaceId);
  if (!space) return Response.json({ error: "forbidden" }, { status: 403 });
  const topicCode = topicCodeOf(space, body.topicCode);
  if (!topicCode) return Response.json({ error: "Pick a topic from this space's syllabus." }, { status: 400 });

  const draft = await draftQuestion({
    space,
    topicCode,
    type: questionType(body.type),
    difficulty: difficultyOf(body.difficulty),
    brief: typeof body.brief === "string" ? body.brief.slice(0, MAX_STEM) : "",
  });
  return Response.json({ draft });
}

export async function PUT(req: Request) {
  const viewer = await getViewer();
  const body = (await req.json().catch(() => ({}))) as Body;
  const space = ownedSpace(viewer, body.spaceId);
  if (!space) return Response.json({ error: "forbidden" }, { status: 403 });
  const topicCode = topicCodeOf(space, body.topicCode);
  if (!topicCode) return Response.json({ error: "Pick a topic from this space's syllabus." }, { status: 400 });

  const subjectId = subjectIdForSpace(space);
  if (!subjectId) return Response.json({ error: "This space has no subject in the catalogue." }, { status: 400 });

  const type = questionType(body.type);
  const stem = (body.stem ?? "").trim().slice(0, MAX_STEM);
  const answer = (body.answer ?? "").trim().slice(0, MAX_LINE);
  const markScheme = lines(body.markScheme);
  const options = lines(body.options);
  const marks = Math.round(Number(body.marks));

  if (stem.length < 8) return Response.json({ error: "Write the question stem." }, { status: 400 });
  if (!markScheme.length) return Response.json({ error: "Add at least one mark point." }, { status: 400 });
  if (!Number.isFinite(marks) || marks < 1 || marks > MAX_MARKS) return Response.json({ error: `Marks must be between 1 and ${MAX_MARKS}.` }, { status: 400 });
  if (type === "mcq" && options.length !== MCQ_OPTIONS) return Response.json({ error: `A multiple-choice question needs exactly ${MCQ_OPTIONS} options.` }, { status: 400 });
  if (type === "mcq") {
    const index = Number(answer);
    if (!Number.isInteger(index) || index < 0 || index >= MCQ_OPTIONS) return Response.json({ error: "The answer must be the number of the correct option." }, { status: 400 });
  } else if (!answer) return Response.json({ error: "Write the model answer." }, { status: 400 });

  const q = addQuestion({
    subjectId,
    topicCode,
    type,
    stem,
    options: type === "mcq" ? options : undefined,
    answer,
    markScheme,
    marks,
    difficulty: difficultyOf(body.difficulty),
    authorId: viewer.personId,
  });
  audit(viewer.personId, "question.create", "question", q.id, { topicCode, type });
  return Response.json({ question: q });
}
