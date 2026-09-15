/**
 * Mark-Scheme Marker. Groq returns strict `AWARDED / POINT / FEEDBACK`
 * lines; the fallback is a keyword rubric scorer that looks for each mark
 * scheme line's evidence in the answer. The teacher overrides every mark.
 */
import { parseKeyLines, VALUES_GUARDRAIL } from "./gemini";
import { askGroq } from "./groq";
import type { MarkPoint } from "@/lib/domain/types";
import { school } from "@/lib/config/school";

export interface MarkInput {
  question: string;
  answer: string;
  markScheme: string[];
  maxMarks: number;
  firstName: string;
}

export interface MarkOutput {
  awarded: number;
  points: MarkPoint[];
  feedback: string;
  live: boolean;
}

const STOP_WORDS = new Set(["shows", "showing", "correctly", "obtain", "obtains", "writes", "identifies", "from", "both", "sides", "with", "that", "then", "this", "answer", "common"]);
const EXPRESSION_RE = /[0-9a-z]+(?:\s*[=+\-×x*/]\s*[0-9a-z]+)+/gi;
const OPERATOR_RE = /[=+\-×*/]/;

function compact(text: string): string {
  return text.toLowerCase().replace(/[×*]/g, "").replace(/\s+/g, "");
}

function labelOf(line: string): string {
  const m = line.match(/^([A-Z]\d)\s*:\s*(.*)$/);
  if (!m) return line;
  return `${m[1]} ${m[2].split(/\s+/).slice(0, 3).join(" ")}`;
}

/** `3x = 15` matches a line that starts with `3x` and ends in `15`, so chained working like `3x = 27 - 12 = 15` still earns the point. */
function lineMatches(line: string, expr: string): boolean {
  const l = compact(line);
  const e = compact(expr);
  if (l.includes(e)) return true;
  const parts = e.split("=");
  if (parts.length !== 2) return false;
  const segments = l.split("=");
  return segments.length >= 2 && segments[0] === parts[0] && segments[segments.length - 1] === parts[1];
}

function evidenceFor(line: string, answer: string): string | null {
  const body = line.replace(/^[A-Z]\d\s*:\s*/, "");
  const answerLines = answer.split(/\r?\n|,\s*/);
  const expressions = (body.match(EXPRESSION_RE) ?? []).filter((e) => OPERATOR_RE.test(e));
  const tokens = expressions.length ? [] : (body.match(/\b\d+[a-z]\b/gi) ?? []);
  for (const expr of [...expressions, ...tokens]) {
    const hit = answerLines.find((l) => lineMatches(l, expr));
    if (hit) return hit.trim();
  }
  if (expressions.length || tokens.length) return null;
  if (/check|substitut|verif/i.test(body)) {
    const hit = answerLines.find((l) => /check|substitut|verif|✓/i.test(l));
    return hit ? hit.trim() : null;
  }
  const words = body.toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length >= 5 && !STOP_WORDS.has(w));
  const hit = answerLines.find((l) => words.some((w) => l.toLowerCase().includes(w)));
  return hit ? hit.trim() : null;
}

function feedbackFor(points: MarkPoint[], awarded: number, max: number, answer: string): string {
  if (awarded === max) return "Every mark point is evidenced. Keep writing the check line; it is what separates full marks from three.";
  const missed = points.filter((p) => !p.earned).map((p) => p.label);
  const bare = answer.trim().split(/\r?\n|,\s*/).length <= 1;
  if (bare) return "The final value is right but no working is shown, so the method marks cannot be credited. Write the expanded bracket, then each balancing step on its own line.";
  if (missed.length === 1 && /check/i.test(missed[0])) return "Method and answer are correct. Add one line substituting your value back into the original equation to secure the last mark.";
  return `Working is partly shown. Missing: ${missed.join("; ")}. Show each balancing step on its own line before the answer.`;
}

export function fallback(input: MarkInput): MarkOutput {
  const points: MarkPoint[] = input.markScheme.map((line) => {
    const evidence = evidenceFor(line, input.answer);
    return { label: labelOf(line), earned: evidence !== null, evidence: evidence ?? "not found in the answer" };
  });
  const awarded = Math.min(input.maxMarks, points.filter((p) => p.earned).length);
  return { awarded, points, feedback: feedbackFor(points, awarded, input.maxMarks, input.answer), live: false };
}

function parseLive(text: string, input: MarkInput): MarkOutput | null {
  const kv = parseKeyLines(text);
  const awardedRaw = Array.isArray(kv.AWARDED) ? kv.AWARDED[0] : kv.AWARDED;
  const awarded = Number.parseInt(awardedRaw ?? "", 10);
  const pointLines = Array.isArray(kv.POINT) ? kv.POINT : kv.POINT ? [kv.POINT] : [];
  const feedback = Array.isArray(kv.FEEDBACK) ? kv.FEEDBACK.join(" ") : kv.FEEDBACK;
  if (Number.isNaN(awarded) || pointLines.length !== input.markScheme.length || !feedback) return null;
  const points: MarkPoint[] = pointLines.map((line, i) => {
    const [status, label, ...rest] = line.split(" - ");
    return {
      label: label?.trim() || labelOf(input.markScheme[i]),
      earned: status.trim().toLowerCase() === "earned",
      evidence: rest.join(" - ").trim() || "no evidence quoted",
    };
  });
  return { awarded: Math.max(0, Math.min(input.maxMarks, awarded)), points, feedback: feedback.trim(), live: true };
}

export async function run(input: MarkInput): Promise<MarkOutput> {
  const system = [
    `You are the marker for ${school.schoolName}. You mark one student answer against a Cambridge-style mark scheme. Student first name: ${input.firstName}.`,
    VALUES_GUARDRAIL,
    "Mark strictly: award a point only when the answer contains evidence for that mark scheme line. Method marks require the step to be written, not merely implied by a correct final answer.",
    "Output ONLY these lines, nothing else:",
    "AWARDED: <integer>",
    "POINT: earned|missed - <short label> - <quote from the answer, or why it is missing>   (one POINT line per mark scheme line, in the same order)",
    "FEEDBACK: <two sentences to the student, specific, encouraging, without restating the final answer>",
  ].join("\n");
  const res = await askGroq({
    system,
    parts: [{ text: `QUESTION: ${input.question}\nMAX: ${input.maxMarks}\nMARK SCHEME:\n${input.markScheme.map((l) => `- ${l}`).join("\n")}\n\nANSWER:\n${input.answer}` }],
    temperature: 0.1,
    maxOutputTokens: 500,
  });
  if (!res.text) return fallback(input);
  return parseLive(res.text, input) ?? fallback(input);
}
