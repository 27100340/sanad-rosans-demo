/**
 * Parent inbox triage: classify a message and draft a reply for the
 * principal to edit. Keyword classifier and per-type templates are the
 * fallback; Gemini, when live, writes the reply from the same facts.
 */
import { askGemini, FAST_MODEL, VALUES_GUARDRAIL } from "./gemini";
import { school } from "@/lib/config/school";
import type { ParentMessage } from "@/lib/domain/types";

export type Triage = NonNullable<ParentMessage["triage"]>;

export interface TriageInput {
  message: ParentMessage;
  studentFirstNames: string[];
  guardianLanguage: "en" | "ur";
}

export interface TriageResult {
  messageId: string;
  triage: Triage;
  reply: string;
  live: boolean;
}

export function classifyMessage(text: string): Triage {
  const t = text.toLowerCase();
  if (/(fever|ill|sick|doctor|tease|bully|hurt|unsafe|urgent|not picking|missing)/.test(t)) return "urgent";
  if (/(thank|excited|proud|wonderful|great job|appreciate)/.test(t)) return "praise";
  return "routine";
}

function names(input: TriageInput): string {
  const list = input.studentFirstNames;
  return list.length <= 1 ? list[0] ?? "your child" : `${list.slice(0, -1).join(", ")} and ${list[list.length - 1]}`;
}

function template(triage: Triage, input: TriageInput): string {
  const child = names(input);
  switch (triage) {
    case "urgent":
      return `Thank you for telling us straight away. I have logged this as a priority and the class teacher will call you today before 14:00 to agree what ${child} needs from us this week. If anything changes before then, please reply here or call the office.\n\nMrs. Saima Qureshi, Principal, Gulberg`;
    case "praise":
      return `Thank you for taking the time to write; I will pass your words on to the teacher today. It is a pleasure to have ${child} in the school, and we will keep sharing what is going well in the weekly brief.\n\nMrs. Saima Qureshi, Principal, Gulberg`;
    default:
      return `Thank you for your message. I have passed it to the office and you will have a clear answer here by tomorrow morning; I will also make sure ${child}'s record reflects it. Please reply if there is anything else we should know.\n\nMrs. Saima Qureshi, Principal, Gulberg`;
  }
}

export function fallback(input: TriageInput): TriageResult {
  const triage = input.message.triage ?? classifyMessage(input.message.text);
  return { messageId: input.message.id, triage, reply: template(triage, input), live: false };
}

export async function run(input: TriageInput): Promise<TriageResult> {
  const base = fallback(input);
  const system = `You draft replies to parents on behalf of the principal of ${school.schoolName}, Gulberg campus. ${VALUES_GUARDRAIL}
Write a warm, specific reply of at most 90 words in ${input.guardianLanguage === "ur" ? "Urdu script (not Roman Urdu)" : "English"}. Address the parent respectfully without using their name. Refer to the child only by first name. Commit to one concrete next step with a time. Never promise outcomes you cannot control and never discuss medical treatment. Sign off as "Mrs. Saima Qureshi, Principal, Gulberg". Output only the reply text.`;
  const facts = `TRIAGE: ${base.triage}\nCHILD_FIRST_NAMES: ${input.studentFirstNames.join(", ")}\nMESSAGE: ${input.message.text}`;
  const res = await askGemini({ model: FAST_MODEL, system, parts: [{ text: facts }], maxOutputTokens: 260, temperature: 0.5 });
  if (!res.text) return base;
  return { ...base, reply: res.text, live: true };
}
