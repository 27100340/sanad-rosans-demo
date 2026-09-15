/**
 * Early-warning note. Scoring is pure (lib/domain/risk.ts); the AI only
 * writes the one-sentence explanation for the top students. The fallback
 * joins the rule reasons into a sentence.
 */
import { parseKeyLines, VALUES_GUARDRAIL } from "./gemini";
import { askGroq } from "./groq";
import { school } from "@/lib/config/school";
import type { RiskFlag } from "@/lib/domain/types";

export interface RiskNoteInput {
  flag: RiskFlag;
  firstName: string;
  className: string;
  ownerName: string;
}

export type RiskNotes = Record<string, string>; // studentId -> sentence

function joinReasons(reasons: string[]): string {
  const lower = reasons.map((r) => r.charAt(0).toLowerCase() + r.slice(1));
  if (lower.length === 1) return lower[0];
  return `${lower.slice(0, -1).join(", ")} and ${lower[lower.length - 1]}`;
}

export function fallbackOne(input: RiskNoteInput): string {
  const { flag, firstName, ownerName } = input;
  const opener = flag.level === "high" ? "needs a conversation this week" : flag.level === "medium" ? "should be checked on this week" : "is worth a quiet look";
  return `${firstName} ${opener}: ${joinReasons(flag.reasons)}. Owner: ${ownerName}.`;
}

export function fallback(inputs: RiskNoteInput[]): RiskNotes {
  return Object.fromEntries(inputs.map((i) => [i.flag.studentId, fallbackOne(i)]));
}

export async function run(inputs: RiskNoteInput[]): Promise<RiskNotes> {
  const base = fallback(inputs);
  if (inputs.length === 0) return base;
  const system = `You are the early-warning assistant for the principal of ${school.schoolName}. Language: English. ${VALUES_GUARDRAIL}
For each STUDENT block write exactly one line "NOTE: <one sentence>" in the same order. The sentence names the student by first name, states the strongest reason with its figure, and ends with the single next step for the named owner. No diagnosis, no labels about the child's character.`;
  const blocks = inputs
    .map((i, n) => `STUDENT ${n + 1}: first_name=${i.firstName}; class=${i.className}; level=${i.flag.level}; score=${i.flag.score}; reasons=${i.flag.reasons.join(" | ")}; owner=${i.ownerName}`)
    .join("\n");
  const res = await askGroq({ system, parts: [{ text: blocks }], maxOutputTokens: 300, temperature: 0.3 });
  if (!res.text) return base;
  const parsed = parseKeyLines(res.text).NOTE;
  const notes = parsed === undefined ? [] : Array.isArray(parsed) ? parsed : [parsed];
  const out: RiskNotes = { ...base };
  inputs.forEach((i, n) => {
    const line = notes[n]?.trim();
    if (line) out[i.flag.studentId] = line;
  });
  return out;
}
