/**
 * Exam Lab. Builds a practice paper either as a drill from the tagged banks or
 * as an exact reproduction of a real Cambridge paper. Assembly is deterministic
 * and draws on 1,012 seeded questions, so this route answers with no API key at
 * all; the model is asked only for the examiner's briefing, and for extra
 * questions when a teacher explicitly opts in and the banks fall short.
 *
 * Teacher seats only — the payload carries answers and mark schemes.
 */
import { getViewer } from "@/lib/auth/viewer";
import { viewerRestriction } from "@/lib/auth/access";
import { examinerBriefing, generateQuestions } from "../_ai/generate";
import { addAiQuestion, addPaper, bankMatching, defaultFilter, questionsForPaperCode, selectQuestions, type BankFilter } from "@/lib/data/physics";
import {
  PAPER_CANON,
  PAPER_DEFAULT_QUESTIONS,
  PAPER_MAX_QUESTIONS,
  PAPER_MIN_QUESTIONS,
  PAPER_TYPES,
  THINKING_LEVELS,
  forRunner,
  type PaperType,
  type PhysicsQuestion,
  type QuestionFormat,
  type ThinkingLevel,
} from "@/lib/domain/physics";
import { ALL_TOPICS } from "@/content/physics/topics";
import { peopleById, teacherById } from "@/lib/data/mock/people";

const FORMATS: (QuestionFormat | "mixed")[] = ["mixed", "mcq", "structured"];
const SOURCES: BankFilter["source"][] = ["any", "authored", "pastpaper"];
const MAX_TOPUP = 5;

interface Body {
  mode?: string;
  code?: string;
  topics?: unknown;
  levels?: unknown;
  format?: string;
  paperType?: string;
  source?: string;
  includeFigureQuestions?: boolean;
  count?: number;
  topUp?: boolean;
}

function topicList(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return [...new Set(raw.filter((t): t is string => typeof t === "string" && ALL_TOPICS.includes(t)))];
}

function levelList(raw: unknown): ThinkingLevel[] {
  if (!Array.isArray(raw)) return [...THINKING_LEVELS];
  const picked = THINKING_LEVELS.filter((l) => raw.includes(l));
  return picked.length ? picked : [...THINKING_LEVELS];
}

function paperTypeOf(value: string | undefined): PaperType | "any" {
  return PAPER_TYPES.includes(value as PaperType) ? (value as PaperType) : "any";
}

function titleFor(topics: string[], paperType: PaperType | "mixed"): string {
  const label = paperType === "mixed" ? "Mixed paper" : PAPER_CANON[paperType].name;
  if (!topics.length) return `${label} · whole syllabus`;
  if (topics.length <= 2) return `${label} · ${topics.join(" and ")}`;
  return `${label} · ${topics.slice(0, 2).join(", ")} +${topics.length - 2}`;
}

/** Duration follows the Cambridge per-mark rate for whichever paper dominates. */
function durationFor(questions: PhysicsQuestion[], paperType: PaperType | "mixed"): number {
  const marks = questions.reduce((sum, q) => sum + q.marks, 0);
  const canon = paperType === "mixed" ? PAPER_CANON.P2 : PAPER_CANON[paperType];
  return Math.max(5, Math.round((canon.durationMin / canon.marks) * marks));
}

function dominantPaper(questions: PhysicsQuestion[]): PaperType | "mixed" {
  const kinds = new Set(questions.map((q) => q.paper));
  return kinds.size === 1 ? [...kinds][0] : "mixed";
}

export async function POST(req: Request) {
  const viewer = await getViewer();
  if (viewer.role !== "teacher" || viewerRestriction(viewer)) return Response.json({ error: "The Exam Lab is a teacher tool." }, { status: 403 });

  const body = (await req.json().catch(() => ({}))) as Body;
  const includeFigureQuestions = body.includeFigureQuestions === true;
  const teacherName = teacherById.get(viewer.personId)?.name ?? peopleById.get(viewer.personId)?.name ?? viewer.label;

  /* ---- Exact past-paper mode ---- */
  if (body.mode === "paper") {
    const code = typeof body.code === "string" ? body.code : "";
    const questions = code ? questionsForPaperCode(code, includeFigureQuestions) : [];
    if (!questions.length) return Response.json({ error: "That paper is not in the bank, or every question in it needs a figure the portal does not hold." }, { status: 400 });

    const paperType = questions[0].paper;
    const totalMarks = questions.reduce((sum, q) => sum + q.marks, 0);
    const topics = [...new Set(questions.map((q) => q.t))];
    const briefing = await examinerBriefing({ topics, levels: [...THINKING_LEVELS], questionCount: questions.length, totalMarks, paperLabel: `${code} (${PAPER_CANON[paperType].name})` });

    const paper = addPaper({
      title: `${code} · ${PAPER_CANON[paperType].short}`,
      mode: "paper",
      code,
      paperType,
      topics,
      levels: [...THINKING_LEVELS],
      questionIds: questions.map((q) => q.id),
      totalMarks,
      durationMin: PAPER_CANON[paperType].durationMin,
      createdBy: viewer.personId,
      createdByName: teacherName,
      aiAssembled: false,
      briefing: briefing.text,
      briefingLive: briefing.live,
    });

    return Response.json({
      paper,
      questions: questions.map(forRunner),
      scheme: questions.map((q) => ({ id: q.id, ans: q.ans, scheme: q.scheme })),
      short: false,
      omittedForFigures: includeFigureQuestions ? 0 : undefined,
    });
  }

  /* ---- Drill mode ---- */
  const topics = topicList(body.topics);
  const levels = levelList(body.levels);
  const format = FORMATS.includes(body.format as QuestionFormat | "mixed") ? (body.format as QuestionFormat | "mixed") : "mixed";
  const source = SOURCES.includes(body.source as BankFilter["source"]) ? (body.source as BankFilter["source"]) : "any";
  const requested = Math.round(Number(body.count));
  const count = Number.isFinite(requested) ? Math.min(Math.max(requested, PAPER_MIN_QUESTIONS), PAPER_MAX_QUESTIONS) : PAPER_DEFAULT_QUESTIONS;

  const filter: BankFilter = { ...defaultFilter(), topics, levels, format, paperType: paperTypeOf(body.paperType), source, includeFigureQuestions };
  if (!bankMatching(filter).length && !body.topUp) {
    return Response.json({ error: "No banked questions match that combination. Widen the strands, the levels or the paper, or let the studio write the extras." }, { status: 400 });
  }

  const questions: PhysicsQuestion[] = selectQuestions(filter, count);

  // Only ask the model for what the banks genuinely could not supply.
  let aiAssembled = false;
  const shortfall = count - questions.length;
  if (shortfall > 0 && body.topUp) {
    const drafts = await generateQuestions({ topics, levels, format, count: Math.min(shortfall, MAX_TOPUP) });
    for (const draft of drafts) {
      questions.push(addAiQuestion(draft));
      aiAssembled = true;
    }
  }

  if (!questions.length) return Response.json({ error: "Could not assemble a paper from that selection." }, { status: 400 });

  const paperType = dominantPaper(questions);
  const totalMarks = questions.reduce((sum, q) => sum + q.marks, 0);
  const briefing = await examinerBriefing({ topics, levels, questionCount: questions.length, totalMarks, paperLabel: titleFor(topics, paperType) });

  const paper = addPaper({
    title: titleFor(topics, paperType),
    mode: "drill",
    paperType,
    topics,
    levels,
    questionIds: questions.map((q) => q.id),
    totalMarks,
    durationMin: durationFor(questions, paperType),
    createdBy: viewer.personId,
    createdByName: teacherName,
    aiAssembled,
    briefing: briefing.text,
    briefingLive: briefing.live,
  });

  return Response.json({
    paper,
    questions: questions.map(forRunner),
    scheme: questions.map((q) => ({ id: q.id, ans: q.ans, scheme: q.scheme })),
    short: questions.length < count,
  });
}
