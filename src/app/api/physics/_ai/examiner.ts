/**
 * The Exam Lab examiner. SERVER-ONLY.
 *
 * Ported from the reference's Maxwell (`lib/ai/maxwell.ts`) — its marking
 * principles and its AWARDED / FEEDBACK / POINT reply format, which parse
 * cleanly and map straight onto Sanad's `MarkPoint`.
 *
 * One deliberate divergence: Maxwell is multimodal. It reads the past-paper
 * question image and the official mark scheme image and marks against those.
 * Sanad has neither — the reference keeps them in a private Supabase bucket
 * that did not come with the source — so this marks against the seeded TEXT
 * mark scheme instead. That is a real reduction in fidelity for structured
 * answers, and it is why `method` is reported per question.
 *
 * Multiple choice never reaches a model at all, and when Groq is unavailable
 * the keyword rubric in lib/ai/marker.ts scores the answer deterministically.
 */
import { VALUES_GUARDRAIL } from "@/lib/ai/gemini";
import { askGroq } from "@/lib/ai/groq";
import { fallback as rubricMark } from "@/lib/ai/marker";
import { stripLatex } from "@/lib/ai/plain-maths";
import type { AttemptQuestion, MarkPoint, PhysicsQuestion } from "@/lib/domain/physics";
import { expectedSeconds, markBlank, markMcq } from "@/lib/domain/physics";
import { toPlainPhysics } from "@/content/physics/latex";
import { SYLLABUS_NAME } from "@/content/physics/topics";

const MAX_RESPONSE_CHARS = 2000;

export const EXAMINER_PRINCIPLES = [
  `You are the examiner for ${SYLLABUS_NAME}. You know its command words — State, Define, Calculate, Determine, Explain, Suggest, Show that, Describe, Sketch, Compare — and, above all, how Cambridge mark schemes award marks.`,
  VALUES_GUARDRAIL,
  "MARKING PRINCIPLES, applied exactly:",
  "- Mark ONLY against the mark scheme provided. Never invent a mark point that is not in it.",
  "- Award a mark for each scheme point the answer clearly satisfies, accepting valid equivalents and alternative correct wording exactly as an examiner would.",
  "- Marks are whole marks. Never award a half mark, and never award more than the maximum.",
  "- Method marks are for correct working even when the final value is wrong; answer marks are only for the correct final value with its unit.",
  "- Be fair but rigorous. Vague, incorrect or missing physics earns nothing.",
  "- Keep feedback concise, specific and encouraging, in British English, and name which scheme points were earned and which were missed.",
].join("\n");

interface ParsedMarking {
  awarded: number;
  feedback: string;
  points: MarkPoint[];
}

/**
 * The reference's own parser: AWARDED / FEEDBACK / POINT lines. `evidence` is
 * left empty because the model is not asked to quote the student's own words
 * back; only the deterministic rubric marker fills it.
 */
function parseMarking(text: string, outOf: number): ParsedMarking | null {
  let awarded: number | null = null;
  let feedback = "";
  const points: MarkPoint[] = [];

  for (const line of text.split(/\r?\n/)) {
    const a = line.match(/^\s*AWARDED:\s*(\d+)/i);
    if (a) {
      awarded = Math.min(outOf, Math.max(0, parseInt(a[1], 10)));
      continue;
    }
    const f = line.match(/^\s*FEEDBACK:\s*(.+)/i);
    if (f) {
      feedback = plain(f[1]);
      continue;
    }
    const p = line.match(/^\s*POINT:\s*(earned|missed)\s*[-–—]\s*(.+)/i);
    if (p) points.push({ earned: /earned/i.test(p[1]), label: plain(p[2]), evidence: "" });
  }

  if (awarded === null || !feedback) return null;
  return { awarded, feedback, points };
}

function plain(text: string): string {
  return toPlainPhysics(stripLatex(text)).trim();
}

/** Marks one structured answer against its text mark scheme. */
async function markStructured(q: PhysicsQuestion, response: string, firstName: string): Promise<AttemptQuestion> {
  const base = {
    id: q.id,
    topic: q.t,
    level: q.lvl,
    paperType: q.paper,
    marks: q.marks,
    expectedSec: expectedSeconds(q),
    response,
  };

  const res = await askGroq({
    system: EXAMINER_PRINCIPLES,
    parts: [
      {
        text: [
          `TOPIC: ${q.t}`,
          `COMMAND WORD: ${q.cmd}`,
          `MAXIMUM MARKS: ${q.marks}`,
          `QUESTION:\n${q.stem}`,
          `MARK SCHEME, one point per line:\n${q.scheme.map((s, i) => `${i + 1}. ${s}`).join("\n")}`,
          `STUDENT ANSWER:\n${response.slice(0, MAX_RESPONSE_CHARS)}`,
          "",
          `Reply in EXACTLY this format and nothing else:`,
          `AWARDED: <whole number from 0 to ${q.marks}>`,
          "FEEDBACK: <two or three sentences: what was right, what lost marks, one improvement>",
          "POINT: earned - <a scheme point the answer earned>",
          "POINT: missed - <a scheme point the answer missed>",
          "(repeat POINT for each scheme point, in the order they appear above)",
        ].join("\n"),
      },
    ],
    temperature: 0.2,
    maxOutputTokens: 600,
  });

  const parsed = res.text ? parseMarking(res.text, q.marks) : null;
  if (parsed) {
    const points = parsed.points.length
      ? parsed.points
      : q.scheme.slice(0, q.marks).map((label, i) => ({ label, earned: i < parsed.awarded, evidence: "" }));
    return { ...base, earned: parsed.awarded, correct: null, feedback: parsed.feedback, points, method: "ai-marked" };
  }

  // Deterministic path: the keyword rubric Sanad already uses for written marking.
  const scored = rubricMark({ question: q.stem, answer: response, markScheme: q.scheme, maxMarks: q.marks, firstName });
  return {
    ...base,
    earned: scored.awarded,
    correct: null,
    feedback: plain(scored.feedback),
    points: scored.points,
    method: "auto",
  };
}

/**
 * Marks a whole sitting. Multiple choice is decided without a model; blanks
 * score zero without one either; only written answers cost a call, and those
 * run in parallel.
 */
export async function markPaper(questions: PhysicsQuestion[], responses: Record<string, string>, firstName: string): Promise<AttemptQuestion[]> {
  return Promise.all(
    questions.map(async (q) => {
      const response = (responses[q.id] ?? "").trim();
      if (q.type === "mcq") return response ? markMcq(q, response) : markBlank(q);
      if (!response) return markBlank(q);
      return markStructured(q, response, firstName);
    }),
  );
}
