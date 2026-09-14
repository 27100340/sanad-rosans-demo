/**
 * Past-paper bank: genuine Cambridge O Level papers sliced per question by
 * tools/papers/slice.py into public/papers/** and bank.json. Question crops
 * are public images; answers and mark-scheme rows/crops are server-only and
 * must only be sent to a client after the question has been answered.
 * Papers are (c) UCLES, reproduced for classroom practice.
 */
import raw from "./bank.json";

export type PaperQuestionType = "mcq" | "structured";

export interface PaperQuestion {
  id: string;
  code: string; // syllabus, e.g. "4024"
  paper: string; // component, e.g. "21"
  paperKey: string; // session + component, e.g. "s24_21"
  paperLabel: string; // "4024/21 May/June 2024"
  series: string;
  year: number;
  qnum: number;
  type: PaperQuestionType;
  marks: number;
  img: string[]; // question crops, in reading order (may span pages)
  answer: string | null; // mcq letter A-D (server-only)
  msImg: string[]; // mark-scheme crops (server-only)
  msRows: string[]; // mark-scheme rows as text, for the AI marker (server-only)
  insertImg: string[]; // reading insert pages, when the paper has one
  ref: string; // "4024/21/S/2024 Q1"
}

/** What the runner may see before the question is answered. */
export type StudentPaperQuestion = Omit<PaperQuestion, "answer" | "msImg" | "msRows">;

export interface Paper {
  code: string;
  paperKey: string;
  paper: string;
  label: string;
  series: string;
  year: number;
  type: PaperQuestionType; // mcq papers are auto-marked
  questions: number;
  marks: number;
  hasInsert: boolean;
  /** Minutes per Cambridge component: P1 MCQ 1h, structured 1h30-2h30. */
  durationMin: number;
}

export const SUBJECT_BY_CODE: Record<string, { name: string; subjectId: string }> = {
  "4024": { name: "Mathematics D", subjectId: "ol-maths" },
  "5054": { name: "Physics", subjectId: "ol-physics" },
  "1123": { name: "English Language", subjectId: "ol-english" },
};

const DURATION: Record<string, number> = { "4024/11": 120, "4024/21": 150, "4024/1": 120, "4024/2": 150, "5054/11": 60, "5054/21": 105, "5054/41": 60, "5054/2": 105, "1123/11": 105, "1123/21": 120 };
const SECONDS_PER_MARK = 78; // ~1.3 min per mark, the Cambridge rule of thumb used for per-question timing

export const PAPER_QUESTIONS: PaperQuestion[] = (raw as PaperQuestion[]).map((q) => ({ ...q, insertImg: q.insertImg ?? [] }));

export const paperQuestionById = new Map(PAPER_QUESTIONS.map((q) => [q.id, q]));

export function forStudentPaper(q: PaperQuestion): StudentPaperQuestion {
  const { id, code, paper, paperKey, paperLabel, series, year, qnum, type, marks, img, insertImg, ref } = q;
  return { id, code, paper, paperKey, paperLabel, series, year, qnum, type, marks, img, insertImg, ref };
}

export function questionsForPaper(code: string, paperKey: string): PaperQuestion[] {
  return PAPER_QUESTIONS.filter((q) => q.code === code && q.paperKey === paperKey).sort((a, b) => a.qnum - b.qnum);
}

export function listPapers(code?: string): Paper[] {
  const groups = new Map<string, PaperQuestion[]>();
  for (const q of PAPER_QUESTIONS) {
    if (code && q.code !== code) continue;
    const key = `${q.code}/${q.paperKey}`;
    groups.set(key, [...(groups.get(key) ?? []), q]);
  }
  return [...groups.values()]
    .map((qs) => {
      const first = qs[0];
      return {
        code: first.code,
        paperKey: first.paperKey,
        paper: first.paper,
        label: first.paperLabel,
        series: first.series,
        year: first.year,
        type: qs.every((q) => q.type === "mcq") ? "mcq" as const : "structured" as const,
        questions: qs.length,
        marks: qs.reduce((a, q) => a + q.marks, 0),
        hasInsert: qs.some((q) => q.insertImg.length > 0),
        durationMin: DURATION[`${first.code}/${first.paper}`] ?? Math.round((qs.reduce((a, q) => a + q.marks, 0) * SECONDS_PER_MARK) / 60),
      };
    })
    .sort((a, b) => a.code.localeCompare(b.code) || b.year - a.year || a.paper.localeCompare(b.paper));
}

/** Seconds a student gets for one question when practising by the paper's own pace. */
export function secondsFor(q: Pick<PaperQuestion, "marks" | "type">): number {
  return q.type === "mcq" ? 90 : q.marks * SECONDS_PER_MARK;
}

/** Syllabus codes present in the bank for a catalogue subject id, e.g. "ol-maths" -> "4024". */
export function codeForSubject(subjectId: string): string | undefined {
  return Object.entries(SUBJECT_BY_CODE).find(([, v]) => v.subjectId === subjectId)?.[0];
}
