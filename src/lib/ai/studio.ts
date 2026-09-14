/**
 * Question Studio. Drafts one bank-ready question from a syllabus topic, a
 * type and a difficulty. Gemini answers in a strict `KEY: value` block; the
 * fallback builds a deterministic draft from the topic title and its
 * subtopics, so the studio works with no key configured. Nothing is written
 * to the bank here; the route does that once the teacher accepts.
 */
import { askGemini, parseKeyLines, VALUES_GUARDRAIL } from "./gemini";
import type { Difficulty, QuestionType } from "@/lib/domain/assessment";
import type { SubjectSpace, SyllabusTopic } from "@/lib/domain/types";
import { school } from "@/lib/config/school";
import { classById } from "@/lib/data/mock/people";

export interface StudioInput {
  space: SubjectSpace;
  topicCode: string;
  type: QuestionType;
  difficulty: Difficulty;
  brief?: string;
}

export interface StudioDraft {
  stem: string;
  options?: string[];
  answer: string;
  markScheme: string[];
  marks: number;
  live: boolean;
}

export const MCQ_OPTIONS = 4;
const MAX_MARKS = 10;

function topicOf(space: SubjectSpace, topicCode: string): SyllabusTopic {
  return space.syllabus.find((t) => t.code === topicCode) ?? space.syllabus[0] ?? { code: topicCode, title: "This topic", subtopics: [] };
}

function structuredMarks(difficulty: Difficulty): number {
  return difficulty === "extended" ? 4 : 3;
}

/** Three sibling topics from the same space, so the multiple-choice distractors are plausible. */
function distractors(space: SubjectSpace, topic: SyllabusTopic): string[] {
  const others = space.syllabus.filter((t) => t.code !== topic.code).map((t) => t.title);
  while (others.length < MCQ_OPTIONS - 1) others.push(`Another strand of ${space.subject}`);
  return others.slice(0, MCQ_OPTIONS - 1);
}

/** Deterministic draft: a sensible starting point the teacher edits before it joins the bank. */
export function fallback(input: StudioInput): StudioDraft {
  const topic = topicOf(input.space, input.topicCode);
  const sub = topic.subtopics[0] ?? topic.title;
  const lower = sub.toLowerCase();

  if (input.type === "mcq") {
    return {
      stem: `Which part of the syllabus does the task "${sub}" belong to?`,
      options: [topic.title, ...distractors(input.space, topic)],
      answer: "0",
      markScheme: [`B1: ${topic.title}`],
      marks: 1,
      live: false,
    };
  }
  if (input.type === "numeric") {
    return {
      stem: `Work through one ${lower} example from ${topic.code} ${topic.title}. Give your final answer as a number.`,
      answer: "0",
      markScheme: ["A1: the correct value"],
      marks: 1,
      live: false,
    };
  }
  if (input.type === "short") {
    return {
      stem: `Explain ${lower} in your own words, in two sentences, and give one example.`,
      answer: `A clear statement of the rule behind ${lower}, followed by one worked example.`,
      markScheme: [`B1: states the rule behind ${lower}`, "B1: gives one correct example"],
      marks: 2,
      live: false,
    };
  }
  const marks = structuredMarks(input.difficulty);
  const scheme = [
    `M1: sets out a correct method for ${lower}`,
    "M1: carries the method through without an arithmetic slip",
    "A1: correct final answer, clearly stated",
    "B1: checks the answer or states the units",
  ].slice(0, marks);
  return {
    stem: `A question on ${lower} (${topic.code} ${topic.title}). Show every step of your method and state your final answer.`,
    answer: `Method for ${lower} shown line by line, ending in a stated final answer.`,
    markScheme: scheme,
    marks,
    live: false,
  };
}

function one(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] ?? "" : value ?? "").trim();
}

function many(value: string | string[] | undefined): string[] {
  return (Array.isArray(value) ? value : value === undefined ? [] : [value]).map((v) => v.trim()).filter(Boolean);
}

const LETTER_INDEX: Record<string, string> = { A: "0", B: "1", C: "2", D: "3" };

/** Reads the model's key block; returns null when anything required is missing or out of range. */
function parseDraft(text: string, input: StudioInput): StudioDraft | null {
  const keys = parseKeyLines(text);
  const stem = one(keys.STEM);
  const markScheme = many(keys.MARK);
  const options = many(keys.OPTION);
  let answer = one(keys.ANSWER);
  const marks = Math.round(Number(one(keys.MARKS)));

  if (stem.length < 8 || !markScheme.length || !Number.isFinite(marks) || marks < 1 || marks > MAX_MARKS) return null;
  if (input.type === "mcq") {
    if (options.length !== MCQ_OPTIONS) return null;
    const upper = answer.toUpperCase();
    if (upper in LETTER_INDEX) answer = LETTER_INDEX[upper];
    const index = Number(answer);
    if (!Number.isInteger(index) || index < 0 || index >= MCQ_OPTIONS) return null;
    answer = String(index);
    return { stem, options, answer, markScheme, marks, live: true };
  }
  if (!answer) return null;
  return { stem, answer, markScheme, marks, live: true };
}

const TYPE_BRIEF: Record<QuestionType, string> = {
  mcq: `a multiple-choice question with exactly ${MCQ_OPTIONS} options and one correct option`,
  numeric: "a question whose answer is a single number",
  short: "a short-answer question worth two or three marks",
  structured: "a structured question worth three or four marks, answered with working",
};

export async function draftQuestion(input: StudioInput): Promise<StudioDraft> {
  const topic = topicOf(input.space, input.topicCode);
  const className = classById.get(input.space.classId)?.name ?? "the class";
  const system = [
    `You author ${input.space.subject} questions for ${className} at ${school.schoolName}, following ${input.space.subjectCode ?? "the school syllabus"}.`,
    VALUES_GUARDRAIL,
    `Write ${TYPE_BRIEF[input.type]} at ${input.difficulty} level. Use British English and plain text only; no Markdown, no LaTeX.`,
    "Answer as KEY: value lines and nothing else, in this order:",
    "STEM: the question as the student reads it, on one line",
    input.type === "mcq" ? `OPTION: one option per line, exactly ${MCQ_OPTIONS} OPTION lines, correct one included` : "",
    input.type === "mcq" ? "ANSWER: the zero-based index of the correct option" : "ANSWER: the model answer on one line",
    "MARK: one mark point per line, in the school's M1 / A1 / B1 style, one line per mark",
    "MARKS: the total marks as a whole number, equal to the number of MARK lines",
  ]
    .filter(Boolean)
    .join("\n");

  const parts = [
    {
      text: [
        `TOPIC: ${topic.code} ${topic.title}`,
        `SUBTOPICS: ${topic.subtopics.join(", ") || "none listed"}`,
        `DIFFICULTY: ${input.difficulty}`,
        `KNOWN MISCONCEPTIONS:\n${input.space.misconceptions.map((m) => `- ${m.tag}: ${m.example}`).join("\n") || "- none recorded"}`,
        `TEACHER BRIEF: ${input.brief?.trim() || "none given"}`,
      ].join("\n"),
    },
  ];

  const res = await askGemini({ system, parts, temperature: 0.6, maxOutputTokens: 700 });
  if (!res.text) return fallback(input);
  return parseDraft(res.text, input) ?? fallback(input);
}
