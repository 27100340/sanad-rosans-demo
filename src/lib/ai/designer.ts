/**
 * Assignment Designer. A teacher describes what they want in words; Groq
 * reasons over a summary of the real bank (topics, types, difficulty, marks)
 * and returns selection criteria, which are resolved to concrete questions.
 * Without a key, or on any failure, a keyword sniff of the brief produces the
 * same shape deterministically, so the designer always answers.
 */
import type { Difficulty, Question, QuestionType, TestMode } from "@/lib/domain/assessment";
import type { SubjectSpace } from "@/lib/domain/types";
import { questionsForSubject } from "@/lib/data/mock/questions";
import { parseKeyLines, VALUES_GUARDRAIL } from "./gemini";
import { askGroq } from "./groq";
import { subjectIdForSpace } from "./assess";

export interface DesignInput {
  brief: string;
  space: SubjectSpace;
}

export interface DesignCriteria {
  title: string;
  instructions: string;
  mode: TestMode;
  topicCodes: string[];
  types: QuestionType[];
  difficulty: "core" | "extended" | "mixed";
  count: number;
  durationMin?: number;
}

export interface DesignOutput {
  criteria: DesignCriteria;
  questions: Question[];
  live: boolean;
}

const MAX_COUNT = 20;
const TYPES: QuestionType[] = ["mcq", "numeric", "short", "structured"];
const MODES: TestMode[] = ["quiz", "timed", "mock", "past-paper"];

function clampCount(n: number): number {
  return Math.max(3, Math.min(MAX_COUNT, Math.round(n) || 6));
}

/** Picks questions by criteria with a stable order: topics round-robin, requested types first, difficulty mix ~60/40 core/extended. */
export function resolve(criteria: DesignCriteria, subjectId: string): Question[] {
  const pool = questionsForSubject(subjectId, criteria.topicCodes).filter((q) => !criteria.types.length || criteria.types.includes(q.type));
  const byTopic = new Map<string, Question[]>();
  for (const q of pool) byTopic.set(q.topicCode, [...(byTopic.get(q.topicCode) ?? []), q]);
  const want: Difficulty[] = criteria.difficulty === "mixed" ? [] : [criteria.difficulty];
  const ordered = [...byTopic.values()].map((qs) => [...qs].sort((a, b) => (want.length ? Number(!want.includes(a.difficulty)) - Number(!want.includes(b.difficulty)) : 0) || TYPES.indexOf(a.type) - TYPES.indexOf(b.type)));
  const picked: Question[] = [];
  for (let round = 0; picked.length < criteria.count; round += 1) {
    let any = false;
    for (const qs of ordered) {
      const q = qs[round];
      if (!q) continue;
      any = true;
      if (picked.length < criteria.count) picked.push(q);
    }
    if (!any) break;
  }
  if (criteria.difficulty === "mixed") {
    const core = picked.filter((q) => q.difficulty === "core");
    const ext = picked.filter((q) => q.difficulty === "extended");
    const nCore = Math.round(picked.length * 0.6);
    return [...core.slice(0, nCore), ...ext, ...core.slice(nCore)].slice(0, criteria.count);
  }
  return picked;
}

/** Keyword sniff: topic titles and codes, question types, difficulty words, a number, a mode word. */
export function fallback(input: DesignInput): DesignCriteria {
  const text = input.brief.toLowerCase();
  const topicCodes = input.space.syllabus.filter((t) => text.includes(t.code.toLowerCase()) || t.title.toLowerCase().split(/[:,]/)[0].split(/\s+/).some((w) => w.length >= 5 && text.includes(w))).map((t) => t.code);
  const types = TYPES.filter((t) => text.includes(t) || (t === "mcq" && /multiple|choice|mcq/.test(text)) || (t === "structured" && /structured|working|show/.test(text)) || (t === "short" && /short|explain|state/.test(text)));
  const difficulty: DesignCriteria["difficulty"] = /extended|hard|challeng|stretch/.test(text) ? "extended" : /core|easy|basic|warm/.test(text) ? "core" : "mixed";
  const count = clampCount(Number((text.match(/(\d{1,2})\s*(questions?|items?|q\b)/) ?? [])[1]) || 6);
  const mode: TestMode = /mock|exam/.test(text) ? "mock" : /timed|test/.test(text) ? "timed" : "quiz";
  const durationMin = mode === "quiz" ? undefined : Number((text.match(/(\d{1,3})\s*min/) ?? [])[1]) || undefined;
  const topicTitles = input.space.syllabus.filter((t) => topicCodes.includes(t.code)).map((t) => t.title.split(":")[0]);
  return {
    title: `${mode === "mock" ? "Mock" : mode === "timed" ? "Test" : "Quiz"}: ${topicTitles.length ? topicTitles.join(", ") : input.space.subject}`,
    instructions: "Answer every question. Show your working for structured questions; method marks need the steps.",
    mode,
    topicCodes: topicCodes.length ? topicCodes : input.space.tutorRules.allowedTopics,
    types,
    difficulty,
    count,
    durationMin,
  };
}

function parseLive(text: string, input: DesignInput): DesignCriteria | null {
  const kv = parseKeyLines(text);
  const one = (k: string) => (Array.isArray(kv[k]) ? kv[k][0] : kv[k]) ?? "";
  const codes = new Set(input.space.syllabus.map((t) => t.code));
  const topicCodes = one("TOPICS").split(/[,\s]+/).filter((c) => codes.has(c));
  if (!topicCodes.length) return null;
  const types = one("TYPES").split(/[,\s]+/).filter((t): t is QuestionType => TYPES.includes(t as QuestionType));
  const diffRaw = one("DIFFICULTY").trim().toLowerCase();
  const difficulty: DesignCriteria["difficulty"] = diffRaw === "core" || diffRaw === "extended" ? diffRaw : "mixed";
  const modeRaw = one("MODE").trim().toLowerCase();
  const mode = MODES.includes(modeRaw as TestMode) ? (modeRaw as TestMode) : "quiz";
  const duration = Number.parseInt(one("DURATION"), 10);
  return {
    title: one("TITLE").trim() || fallback(input).title,
    instructions: one("INSTRUCTIONS").trim() || fallback(input).instructions,
    mode,
    topicCodes,
    types,
    difficulty,
    count: clampCount(Number.parseInt(one("COUNT"), 10)),
    durationMin: mode === "quiz" ? undefined : Number.isFinite(duration) && duration > 0 ? duration : undefined,
  };
}

export async function design(input: DesignInput): Promise<DesignOutput> {
  const subjectId = subjectIdForSpace(input.space);
  const bank = questionsForSubject(subjectId);
  const summary = input.space.syllabus.map((t) => {
    const qs = bank.filter((q) => q.topicCode === t.code);
    const byType = TYPES.map((ty) => `${ty}:${qs.filter((q) => q.type === ty).length}`).join(" ");
    return `- ${t.code} ${t.title}: ${qs.length} questions (${byType}; core ${qs.filter((q) => q.difficulty === "core").length}, extended ${qs.filter((q) => q.difficulty === "extended").length})`;
  }).join("\n");
  const res = await askGroq({
    system: [
      `You design an assessment for ${input.space.subject} from a fixed question bank. You never write questions; you choose criteria.`,
      VALUES_GUARDRAIL,
      `BANK SUMMARY:\n${summary}`,
      "Output ONLY these lines:",
      "TITLE: <short title>",
      "INSTRUCTIONS: <one or two sentences to the student>",
      "MODE: quiz|timed|mock",
      "TOPICS: <comma-separated topic codes from the summary>",
      "TYPES: <comma-separated from mcq,numeric,short,structured; empty for any>",
      "DIFFICULTY: core|extended|mixed",
      "COUNT: <integer 3-20>",
      "DURATION: <minutes, or 0 for a quiz>",
    ].join("\n"),
    parts: [{ text: `TEACHER BRIEF:\n${input.brief.slice(0, 1200)}` }],
    temperature: 0.3,
    maxOutputTokens: 300,
  });
  const criteria = (res.text && parseLive(res.text, input)) || fallback(input);
  return { criteria, questions: resolve(criteria, subjectId), live: Boolean(res.text) && res.live };
}
