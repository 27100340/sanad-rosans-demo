/**
 * Teacher: preview an assembly (GET) and create + allocate a test (POST).
 * Ownership: the space must belong to the viewer (space.teacherId === viewer.personId).
 */
import { getViewer } from "@/lib/auth/viewer";
import { spaceById } from "@/lib/data/mock/spaces";
import { classById } from "@/lib/data/mock/people";
import { addTest, allocate } from "@/lib/data/mock/tests";
import { questionById } from "@/lib/data/mock/questions";
import { assembleQuestions, subjectIdForSpace } from "@/lib/ai/assess";
import { maxMarksOf, type TestMode } from "@/lib/domain/assessment";
import type { GuardMode } from "@/lib/domain/proctor";
import { daysAgoISO } from "@/lib/utils";
import { audit, notify } from "@/lib/data/mock/notify";
import { listPapers } from "@/lib/data/pastpapers";

const GUARD_MODES: GuardMode[] = ["off", "standard", "strict"];
const DEFAULT_GUARD: Record<TestMode, GuardMode> = { quiz: "off", timed: "standard", mock: "strict", "past-paper": "off" };
const MODES: TestMode[] = ["quiz", "timed", "mock", "past-paper"];
const DEFAULT_CLOSE_DAYS = 7;
const MAX_ATTEMPTS = 3;

function ownedSpace(viewer: Awaited<ReturnType<typeof getViewer>>, spaceId: string | null) {
  if (viewer.role !== "teacher" || !spaceId) return null;
  const space = spaceById.get(spaceId);
  return space && space.teacherId === viewer.personId ? space : null;
}

function parseMode(v: unknown): TestMode {
  return MODES.includes(v as TestMode) ? (v as TestMode) : "quiz";
}

export async function GET(req: Request) {
  const viewer = await getViewer();
  const url = new URL(req.url);
  const space = ownedSpace(viewer, url.searchParams.get("spaceId"));
  if (!space) return Response.json({ error: "forbidden" }, { status: 403 });
  const topicCodes = url.searchParams.getAll("topic");
  const mode = parseMode(url.searchParams.get("mode"));
  const questions = assembleQuestions(subjectIdForSpace(space), topicCodes, mode);
  return Response.json({ questions, maxMarks: maxMarksOf(questions) });
}

interface Body {
  spaceId?: string;
  title?: string;
  mode?: TestMode;
  topicCodes?: string[];
  durationMin?: number;
  attemptsAllowed?: number;
  closesAt?: string;
  guardMode?: GuardMode; // off | standard | strict (strict runs the camera proctor)
  instructions?: string;
  questionIds?: string[]; // hand-picked set (bank browser / designer); overrides assembly
  paperCode?: string; // mode "past-paper": allocate a whole Cambridge paper
  paperKey?: string;
  studentIds?: string[]; // omitted = whole class
}

export async function POST(req: Request) {
  const viewer = await getViewer();
  const body = (await req.json().catch(() => ({}))) as Body;
  const space = ownedSpace(viewer, body.spaceId ?? null);
  if (!space) return Response.json({ error: "forbidden" }, { status: 403 });

  const title = typeof body.title === "string" ? body.title.trim() : "";
  if (title.length < 3) return Response.json({ error: "Give the test a title." }, { status: 400 });
  const topicCodes = Array.isArray(body.topicCodes) ? body.topicCodes.filter((t): t is string => typeof t === "string") : [];
  const mode = parseMode(body.mode);
  const instructions = typeof body.instructions === "string" ? body.instructions.trim().slice(0, 2000) : undefined;
  const paper = mode === "past-paper" ? listPapers().find((p) => p.code === body.paperCode && p.paperKey === body.paperKey) : undefined;
  if (mode === "past-paper" && !paper) return Response.json({ error: "Pick a paper to allocate." }, { status: 400 });
  const picked = Array.isArray(body.questionIds) ? body.questionIds.filter((id): id is string => typeof id === "string") : [];
  const questions = paper ? [] : picked.length ? picked.map((id) => questionById.get(id)).filter((q): q is NonNullable<typeof q> => Boolean(q) && q.subjectId === subjectIdForSpace(space)) : assembleQuestions(subjectIdForSpace(space), topicCodes, mode);
  if (!paper && !questions.length) return Response.json({ error: "The bank has no questions for those topics yet." }, { status: 400 });

  const durationMin = mode === "quiz" ? undefined : paper ? paper.durationMin : Math.max(5, Math.min(180, Number(body.durationMin) || 25));
  const attemptsAllowed = Math.max(1, Math.min(MAX_ATTEMPTS, Number(body.attemptsAllowed) || 1));
  const closesAt = typeof body.closesAt === "string" && /^\d{4}-\d{2}-\d{2}$/.test(body.closesAt) ? body.closesAt : daysAgoISO(-DEFAULT_CLOSE_DAYS);

  const guardMode = GUARD_MODES.includes(body.guardMode as GuardMode) ? (body.guardMode as GuardMode) : DEFAULT_GUARD[mode];
  const test = addTest({ spaceId: space.id, title, mode, questionIds: questions.map((q) => q.id), durationMin, opensAt: daysAgoISO(0), closesAt, attemptsAllowed, proctored: guardMode === "strict", guardMode, instructions, paperCode: paper?.code, paperKey: paper?.paperKey, createdBy: viewer.personId });
  const classStudents = classById.get(space.classId)?.studentIds ?? [];
  const requested = Array.isArray(body.studentIds) ? body.studentIds.filter((s): s is string => typeof s === "string" && classStudents.includes(s)) : [];
  const targets = requested.length ? requested : classStudents;
  const allocated = allocate(test.id, targets);
  audit(viewer.personId, "test.create", "test", test.id, { title, mode, guardMode, allocated });
  notify({ personIds: targets }, { kind: "test", title: `New ${mode === "quiz" ? "quiz" : mode === "mock" ? "mock exam" : "test"}: ${title}`, body: `${space.subject} · closes ${closesAt}${durationMin ? ` · ${durationMin} min` : ""}`, href: "/portal/learn/tests", fromId: viewer.personId });
  return Response.json({ test, allocated, maxMarks: paper ? paper.marks : maxMarksOf(questions) });
}
