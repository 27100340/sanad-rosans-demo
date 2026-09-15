/**
 * On-demand question generation and the examiner's briefing. SERVER-ONLY.
 *
 * The generator is ported from the reference's `lib/exam-lab/generate.ts`,
 * including the reason it exists in that shape: physics questions are
 * formula-dense, JSON is a poor carrier for them, so the model is asked for a
 * line-delimited format separated by `===Q===` that needs no escaping at all.
 * The parser below is the reference's, with its KNOWN key set intact.
 *
 * Two changes for Sanad:
 *  - Provider is Groq, not Gemini.
 *  - The reference asks for KaTeX because it renders KaTeX. Sanad does not, so
 *    the prompt asks for plain Unicode and every field still passes through
 *    `toPlainPhysics` afterwards.
 *
 * Assembly itself never needs this: the Exam Lab draws from 1,012 seeded
 * questions and only calls the model when a teacher explicitly asks it to top
 * up a selection the banks cannot fill. When it fails, the paper is shorter and
 * the teacher is told so.
 */
import { parseKeyLines, VALUES_GUARDRAIL } from "@/lib/ai/gemini";
import { askGroq } from "@/lib/ai/groq";
import { stripLatex } from "@/lib/ai/plain-maths";
import type { PhysicsQuestion, QuestionFormat, ThinkingLevel } from "@/lib/domain/physics";
import { LEVEL_BLURB } from "@/lib/domain/physics";
import { MISCONCEPTIONS } from "@/content/physics/cohort";
import { toPlainPhysics } from "@/content/physics/latex";
import { ALL_TOPICS, SYLLABUS_NAME, SYLLABUS_YEARS, defaultPaper, formulaeFor } from "@/content/physics/topics";
import { school } from "@/lib/config/school";

const MCQ_OPTIONS = 4;
const MAX_GENERATED = 5;
const MIN_STEM_CHARS = 12;
const MAX_QUESTION_MARKS = 6;
const MIN_MARK_POINT_BODY = 10;

function plain(text: string): string {
  return toPlainPhysics(stripLatex(text)).trim();
}

/* ------------------------------------------------------------------ */
/* Block parser — ported from the reference                            */
/* ------------------------------------------------------------------ */

interface RawBlock {
  topic?: string;
  level?: string;
  type?: string;
  command?: string;
  marks?: number;
  stem?: string;
  options: string[];
  answer?: string;
  scheme: string[];
}

const KNOWN = new Set(["TOPIC", "LEVEL", "TYPE", "COMMAND", "MARKS", "STEM", "A", "B", "C", "D", "ANSWER", "MARK"]);

function parseBlocks(text: string): RawBlock[] {
  const cleaned = text.replace(/```[a-z]*/gi, "").trim();
  const blocks = cleaned
    .split(/^\s*===Q===\s*$/m)
    .map((b) => b.trim())
    .filter(Boolean);

  const out: RawBlock[] = [];
  for (const block of blocks) {
    const rec: RawBlock = { options: [], scheme: [] };
    let last = "";
    for (const line of block.split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Za-z]+):\s?(.*)$/);
      const key = m ? m[1].toUpperCase() : "";
      if (!m || !KNOWN.has(key)) {
        // A stem that wrapped onto a second line is joined back on.
        if (last === "STEM" && rec.stem && line.trim()) rec.stem += ` ${line.trim()}`;
        continue;
      }
      const value = m[2].trim();
      switch (key) {
        case "TOPIC": rec.topic = value; last = "TOPIC"; break;
        case "LEVEL": rec.level = value.toUpperCase().replace(/[^A-Z]/g, ""); last = "LEVEL"; break;
        case "TYPE": rec.type = value.toLowerCase(); last = "TYPE"; break;
        case "COMMAND": rec.command = value; last = "COMMAND"; break;
        case "MARKS": rec.marks = parseInt(value, 10); last = "MARKS"; break;
        case "STEM": rec.stem = value; last = "STEM"; break;
        case "A": case "B": case "C": case "D": rec.options.push(value); last = "OPT"; break;
        case "ANSWER": rec.answer = value.toUpperCase().replace(/[^ABCD]/g, "").charAt(0); last = "ANSWER"; break;
        case "MARK": if (value) rec.scheme.push(value); last = "MARK"; break;
      }
    }
    if (rec.stem && rec.stem.length >= MIN_STEM_CHARS && rec.scheme.length) out.push(rec);
  }
  return out;
}

/**
 * A mark point has to be readable on its own. gpt-oss will return the bare code
 * `M1` for a MARK line if it is allowed to, which is worthless to a marker, so
 * a draft whose scheme is only codes is rejected and the paper stays shorter.
 */
const MARK_CODE_PREFIX = /^[MAB]\d\s*[:.\-–—]?\s*/i;

function markPointBody(line: string): string {
  return line.replace(MARK_CODE_PREFIX, "").trim();
}

function toQuestion(block: RawBlock, wantLevels: ThinkingLevel[], wantTopics: string[], format: QuestionFormat | "mixed", index: number): Omit<PhysicsQuestion, "id" | "source" | "visibility"> | null {
  const stem = plain(block.stem ?? "");
  const scheme = block.scheme.map(plain).filter(Boolean);
  if (stem.length < MIN_STEM_CHARS || !scheme.length) return null;
  if (!scheme.every((line) => markPointBody(line).length >= MIN_MARK_POINT_BODY)) {
    console.warn(`[physics-generate] rejected a draft: mark scheme was codes without mark points (${scheme.join(" | ")})`);
    return null;
  }

  // Prefer the model's own tags when they are valid, so the labels match the question.
  const modelLevel = block.level === "LOT" || block.level === "HOT" ? (block.level as ThinkingLevel) : undefined;
  const lvl: ThinkingLevel = modelLevel && wantLevels.includes(modelLevel) ? modelLevel : wantLevels[index % wantLevels.length];
  const modelTopic = block.topic && ALL_TOPICS.includes(block.topic) ? block.topic : undefined;
  const topic = modelTopic ?? wantTopics[index % Math.max(1, wantTopics.length)] ?? ALL_TOPICS[0];

  const wantMcq = format === "mcq" || (format === "mixed" && block.type === "mcq");
  const options = block.options.map(plain).filter(Boolean);
  const answerIndex = block.answer ? "ABCD".indexOf(block.answer) : -1;
  const isMcq = wantMcq && options.length === MCQ_OPTIONS && answerIndex >= 0;

  if (isMcq) {
    return { t: topic, lvl, type: "mcq", paper: "P1", cmd: block.command || "Calculate", marks: 1, stem, opts: options, ans: answerIndex, scheme: scheme.slice(0, 2) };
  }
  if (format === "mcq") return null; // an mcq was asked for and the model did not produce one

  const marks = Math.min(scheme.length, MAX_QUESTION_MARKS);
  return { t: topic, lvl, type: "structured", paper: defaultPaper(topic), cmd: block.command || "Explain", marks, stem, scheme: scheme.slice(0, MAX_QUESTION_MARKS) };
}

export interface GenerateInput {
  topics: string[];
  levels: ThinkingLevel[];
  format: QuestionFormat | "mixed";
  count: number;
}

/**
 * Drafts up to five fresh questions in one call. Returns an empty array when no
 * model is reachable or nothing parsed — the caller then ships a shorter paper
 * rather than a fabricated one.
 */
export async function generateQuestions(input: GenerateInput): Promise<Omit<PhysicsQuestion, "id" | "source" | "visibility">[]> {
  const count = Math.min(Math.max(input.count, 1), MAX_GENERATED);
  const topics = input.topics.length ? input.topics : ALL_TOPICS;
  const levels = input.levels.length ? input.levels : (["LOT", "HOT"] as ThinkingLevel[]);

  const styleLine =
    input.format === "mcq"
      ? `EVERY question must be TYPE: mcq, with exactly ${MCQ_OPTIONS} options A-D and one correct answer.`
      : input.format === "structured"
        ? "EVERY question must be TYPE: structured, with no options."
        : "Mix mcq and structured questions.";

  const system = [
    `You are a Cambridge International examiner writing ORIGINAL practice questions for ${SYLLABUS_NAME}, ${SYLLABUS_YEARS}, for ${school.schoolName}.`,
    VALUES_GUARDRAIL,
    "Never copy real past-paper wording; write fresh, exam-authentic questions with correct physics and realistic, self-consistent numbers.",
    "NOTATION: plain text with real Unicode symbols. Never LaTeX, never a backslash, never dollar delimiters. Write m s⁻², 6.67 × 10⁻¹¹, λ, Ω, Δ, θ directly.",
    "Output ONLY the delimited blocks specified. No preamble, no markdown fences, no commentary.",
  ].join("\n");

  const prompt = [
    `Write exactly ${count} question(s).`,
    `Topics to draw from: ${topics.join(", ")}.`,
    `Thinking levels, spread across the set: LOT — ${LEVEL_BLURB.LOT} HOT — ${LEVEL_BLURB.HOT}`,
    styleLine,
    "",
    "OUTPUT FORMAT — repeat this block per question, separated by a line containing exactly ===Q===",
    "===Q===",
    "TOPIC: <the ONE syllabus topic this question is about, copied exactly from the list above>",
    "LEVEL: LOT or HOT",
    "TYPE: mcq or structured",
    "COMMAND: <one Cambridge command word: State, Define, Calculate, Determine, Explain, Suggest, Show that, Compare, Describe, Sketch>",
    `MARKS: <whole number; mcq = 1, structured 3 to ${MAX_QUESTION_MARKS}>`,
    "STEM: <the full question on ONE single line>",
    `A: <option A>   (mcq only, exactly ${MCQ_OPTIONS} options)`,
    "B: <option B>   (mcq only)",
    "C: <option C>   (mcq only)",
    "D: <option D>   (mcq only)",
    "ANSWER: <A, B, C or D>   (mcq only)",
    "MARK: <one mark point, written out in full as a marker would read it, starting with M1, A1 or B1 and a colon. Never a bare code: `MARK: M1` is wrong and will be discarded.>",
    "MARK: <repeat for each marking point; for an mcq, say why the answer is correct>",
    "",
    "Start the first block with ===Q=== and keep each field on its own single line.",
    `FOR CONTEXT, misconceptions this class already shows — write questions that expose them, do not repeat these examples verbatim:\n${MISCONCEPTIONS.filter((m) => topics.includes(m.topic)).map((m) => `- ${m.topic}: ${m.correction}`).join("\n") || "- none recorded for these strands"}`,
    `RELATIONSHIPS AVAILABLE: ${topics.slice(0, 6).flatMap(formulaeFor).slice(0, 12).join("; ")}`,
  ].join("\n");

  const res = await askGroq({ system, parts: [{ text: prompt }], temperature: 0.8, maxOutputTokens: 2400 });
  if (!res.text) return [];

  const blocks = parseBlocks(res.text);
  if (!blocks.length) {
    console.warn(`[physics-generate] no ===Q=== blocks parsed from ${res.text.length} chars`);
    return [];
  }
  return blocks
    .slice(0, count)
    .map((block, i) => toQuestion(block, levels, input.topics, input.format, i))
    .filter((q): q is Omit<PhysicsQuestion, "id" | "source" | "visibility"> => q !== null);
}

/* ------------------------------------------------------------------ */
/* Examiner's briefing                                                 */
/* ------------------------------------------------------------------ */

export interface BriefingInput {
  topics: string[];
  levels: ThinkingLevel[];
  questionCount: number;
  totalMarks: number;
  paperLabel: string;
}

const MAX_WATCH_LINES = 3;

/** Scripted briefing, built from the chosen strands and the misconceptions recorded against them. */
export function briefingFallback(input: BriefingInput): { text: string; live: boolean } {
  const watch = MISCONCEPTIONS.filter((m) => !input.topics.length || input.topics.includes(m.topic))
    .sort((a, b) => b.count - a.count)
    .slice(0, MAX_WATCH_LINES)
    .map((m) => `- ${m.correction} (seen ${m.count} times this term on ${m.topic})`);

  return {
    text: [
      `${input.paperLabel}: ${input.questionCount} questions, ${input.totalMarks} marks, covering ${input.topics.join(", ") || "the whole 9702 syllabus"}.`,
      `Thinking levels included: ${input.levels.join(" and ")}. LOT — ${LEVEL_BLURB.LOT} HOT — ${LEVEL_BLURB.HOT}`,
      watch.length ? "Watch for, from this term's marking:" : "No misconceptions have been recorded against these strands yet this term.",
      ...watch,
    ]
      .filter(Boolean)
      .join("\n"),
    live: false,
  };
}

export async function examinerBriefing(input: BriefingInput): Promise<{ text: string; live: boolean }> {
  const system = [
    `You brief a physics teacher at ${school.schoolName} on a practice paper just assembled from their ${SYLLABUS_NAME} bank.`,
    VALUES_GUARDRAIL,
    "Write for the teacher, not the student. Be specific about what the paper tests and where this class loses marks.",
    "NOTATION: plain text with real Unicode symbols. Never LaTeX, never a backslash, never dollar delimiters.",
    "Answer as KEY: value lines and nothing else. ONE LABEL PER LINE, in this exact order:",
    "SUMMARY: one sentence saying what this paper tests overall",
    "WATCH: one thing to look for in the class's answers, on one line",
    `WATCH: repeat the WATCH label for each further point; write at most ${MAX_WATCH_LINES} WATCH lines in total`,
  ].join("\n");

  const parts = [
    {
      text: [
        `PAPER: ${input.paperLabel}, ${input.questionCount} questions, ${input.totalMarks} marks`,
        `TOPICS: ${input.topics.join(", ") || "the whole 9702 syllabus"}`,
        `THINKING LEVELS: ${input.levels.join(", ")}`,
        `MISCONCEPTIONS ALREADY RECORDED FOR THIS CLASS:\n${
          MISCONCEPTIONS.filter((m) => !input.topics.length || input.topics.includes(m.topic))
            .map((m) => `- ${m.topic} (${m.count} students): ${m.example}`)
            .join("\n") || "- none"
        }`,
      ].join("\n"),
    },
  ];

  const res = await askGroq({ system, parts, temperature: 0.4, maxOutputTokens: 450 });
  if (!res.text) return briefingFallback(input);

  const keys = parseKeyLines(res.text);
  const summary = plain(Array.isArray(keys.SUMMARY) ? keys.SUMMARY[0] ?? "" : keys.SUMMARY ?? "");
  const rawWatch = keys.WATCH === undefined ? [] : Array.isArray(keys.WATCH) ? keys.WATCH : [keys.WATCH];
  const watch = rawWatch.map(plain).filter(Boolean).slice(0, MAX_WATCH_LINES);
  if (summary.length < 12 || !watch.length) return briefingFallback(input);
  return { text: [summary, "Watch for:", ...watch.map((w) => `- ${w}`)].join("\n"), live: true };
}
