/**
 * Space Tutor. The system prompt is built from the space's Tutor Rules, so
 * the tutor cannot know more than the teacher allowed. Fallback is a scripted
 * Socratic exchange keyed on the demo question 3(x + 4) = 27.
 */
import { askGemini, VALUES_GUARDRAIL } from "./gemini";
import type { SubjectSpace } from "@/lib/domain/types";
import { school } from "@/lib/config/school";
import { spaceById } from "@/lib/data/mock/spaces";
import { teacherById } from "@/lib/data/mock/people";

export interface TutorTurn {
  role: "student" | "tutor";
  text: string;
}

export interface TutorInput {
  spaceId: string;
  firstName: string;
  grade: string;
  messages: TutorTurn[];
}

export interface TutorOutput {
  reply: string;
  misconceptionTag: string | null;
  live: boolean;
}

const POLICY_LINES: Record<SubjectSpace["tutorRules"]["answerPolicy"], string> = {
  "hint-only": "Answer policy HINT-ONLY: never state a final answer or a completed solution. Ask one guiding question, or point to the next single step, and wait.",
  "worked-example": "Answer policy WORKED-EXAMPLE: you may fully work a similar example with different numbers, then ask the student to apply it to their own question.",
  full: "Answer policy FULL: you may give the full solution, but always explain each step and end with a check question.",
};

const LANGUAGE_LINES: Record<SubjectSpace["tutorRules"]["language"], string> = {
  en: "Language: English only. If asked for Urdu, say politely that this space is English only.",
  ur: "Language: Urdu only, written in Urdu script (never Roman Urdu).",
  both: "Language: reply in English by default; switch to Urdu in Urdu script (never Roman Urdu) when the student writes in Urdu or asks for it.",
};

export function introFor(space: SubjectSpace, firstName: string): string {
  const teacher = teacherById.get(space.teacherId)?.name ?? "your teacher";
  const unlocked = space.syllabus.filter((t) => space.tutorRules.allowedTopics.includes(t.code)).map((t) => t.title.split(":")[0]);
  const strands = Array.from(new Set(unlocked)).join(", ");
  return `Assalamu alaikum ${firstName}. I am your ${space.subject} tutor. ${teacher} has unlocked ${strands}. What are you working on?`;
}

export function buildSystemPrompt(space: SubjectSpace, firstName: string, grade: string): string {
  const rules = space.tutorRules;
  const allowed = space.syllabus.filter((t) => rules.allowedTopics.includes(t.code));
  const locked = space.syllabus.filter((t) => !rules.allowedTopics.includes(t.code));
  const teacher = teacherById.get(space.teacherId)?.name ?? "the teacher";
  const cite = space.resources.filter((r) => r.status === "approved" && r.tutorMayCite).map((r) => `- ${r.title} (${r.source})`);
  return [
    `You are the Space Tutor for ${space.subject}, ${grade}, at ${school.schoolName}. The student's first name is ${firstName}.`,
    VALUES_GUARDRAIL,
    `TEACHER RULES (set by ${teacher}; binding):`,
    `ALLOWED TOPICS:\n${allowed.map((t) => `- ${t.code} ${t.title}: ${t.subtopics.join(", ")}`).join("\n")}`,
    `NOT YET UNLOCKED (refuse gracefully; say ${teacher} has not unlocked this yet and suggest asking in class):\n${locked.map((t) => `- ${t.code} ${t.title}`).join("\n") || "- none"}`,
    POLICY_LINES[rules.answerPolicy],
    LANGUAGE_LINES[rules.language],
    `Tone: ${rules.tone}`,
    `FORBIDDEN:\n${rules.forbidden.map((f) => `- ${f}`).join("\n") || "- none"}`,
    `APPROVED RESOURCES you may cite by title (never invent others):\n${cite.join("\n")}`,
    "Be Socratic: one question or one step at a time. Keep replies under 120 words. Plain text, no headings.",
    "After your reply, add one final line exactly in the form `TAG: <kebab-case-misconception>` if the student's latest message shows a specific misconception, otherwise `TAG: none`.",
  ].join("\n\n");
}

function parseReply(text: string): { reply: string; tag: string | null } {
  const lines = text.trim().split(/\r?\n/);
  let tag: string | null = null;
  const kept: string[] = [];
  for (const line of lines) {
    const m = line.match(/^\s*TAG:\s*(.+)$/i);
    if (m) tag = m[1].trim().toLowerCase();
    else kept.push(line);
  }
  if (tag === "none" || tag === "") tag = null;
  return { reply: kept.join("\n").trim(), tag };
}

const URDU_RE = /[؀-ۿ]/;
const ANSWER_RE = /\b(answer|just tell|tell me x|what is x|final|solution)\b/i;
const EQUATION_RE = /(equation|solve|3\s*\(\s*x|bracket|x\s*\+\s*4|3x)/i;

const URDU_REPLY = "ٹھیک ہے، اردو میں بات کرتے ہیں۔ پہلے بریکٹ کھولیں: 3 کو x اور 4 دونوں سے ضرب دیں۔ آپ کو کیا ملتا ہے؟ آخری جواب میں نہیں بتاؤں گا، مگر ہر قدم پر آپ کی رہنمائی کروں گا۔";

function stems(topics: SubjectSpace["syllabus"]): Set<string> {
  const words = topics.flatMap((t) => t.subtopics.flatMap((s) => s.toLowerCase().split(/[^a-z]+/)));
  return new Set(words.map((w) => w.replace(/s$/, "")).filter((w) => w.length >= 5));
}

/** Subtopic words that appear only in locked strands, so "circle" refuses but "graph" (shared with 8As) does not. */
function lockedKeywords(space: SubjectSpace): string[] {
  const allowed = stems(space.syllabus.filter((t) => space.tutorRules.allowedTopics.includes(t.code)));
  const locked = stems(space.syllabus.filter((t) => !space.tutorRules.allowedTopics.includes(t.code)));
  return [...locked].filter((w) => !allowed.has(w));
}

function tagFor(message: string): string | null {
  const compactMsg = message.replace(/\s+/g, "").toLowerCase();
  if (compactMsg.includes("3x+4=") || compactMsg.includes("3x+4")) return "expands-bracket-partially";
  if (compactMsg.includes("3x=31") || compactMsg.includes("3x=39")) return "sign-error-moving-terms";
  if (compactMsg.includes("x=15")) return "divides-only-one-side";
  return null;
}

const SOCRATIC_STEPS = [
  "Good place to start. Before moving anything, look at the bracket: 3(x + 4). The 3 multiplies both terms inside. What do you get when you expand it?",
  "That gives you 3x + 12 = 27. Now the aim is to leave 3x on its own. What could you do to both sides so the 12 disappears?",
  "Right, subtracting 12 from both sides leaves 3x = 15. One step left: what do you divide both sides by? Then substitute your value back into 3(x + 4) to check it makes 27.",
  "You have everything you need now. Write your final line and the check, and I will look at it.",
];

const TAG_REPLIES: Record<string, string> = {
  "expands-bracket-partially": "Nearly. The 3 outside the bracket multiplies the 4 as well as the x. Try 3 times x and 3 times 4 separately, then add them.",
  "sign-error-moving-terms": "Careful with the sign. When 12 moves across the equals sign it changes from +12 to -12. What is 27 - 12?",
  "divides-only-one-side": "Whatever you do to one side you must do to the other. If you divide the left side by 3, what happens to the 15 on the right?",
};

export function fallback(input: TutorInput): TutorOutput {
  const space = spaceById.get(input.spaceId);
  const last = [...input.messages].reverse().find((m) => m.role === "student")?.text ?? "";
  const teacher = space ? (teacherById.get(space.teacherId)?.name ?? "your teacher") : "your teacher";
  const misconceptionTag = tagFor(last);

  if (URDU_RE.test(last) || /\burdu\b/i.test(last)) {
    if (space?.tutorRules.language === "en") return { reply: `This space is English only; ${teacher} can change that in the tutor rules.`, misconceptionTag, live: false };
    return { reply: URDU_REPLY, misconceptionTag, live: false };
  }
  if (space) {
    const hit = lockedKeywords(space).find((w) => last.toLowerCase().includes(w));
    if (hit) return { reply: `That topic is not unlocked in this space yet; ${teacher} has not opened it for the tutor. Ask about it in class, or we can keep going with the current topics.`, misconceptionTag: null, live: false };
  }
  if (ANSWER_RE.test(last)) {
    const policy = space?.tutorRules.answerPolicy ?? "hint-only";
    if (policy === "hint-only") return { reply: `I cannot give the final answer; ${teacher} set this space to hints only. Show me your last line and I will tell you whether the next step is right.`, misconceptionTag, live: false };
    return { reply: "Here is a similar one worked fully: 2(x + 3) = 16 becomes 2x + 6 = 16, then 2x = 10, so x = 5. Now apply the same three steps to yours.", misconceptionTag, live: false };
  }
  if (EQUATION_RE.test(last)) {
    const turns = input.messages.filter((m) => m.role === "student" && EQUATION_RE.test(m.text)).length;
    const step = SOCRATIC_STEPS[Math.min(Math.max(turns - 1, 0), SOCRATIC_STEPS.length - 1)];
    const reply = misconceptionTag ? TAG_REPLIES[misconceptionTag] : step;
    return { reply, misconceptionTag, live: false };
  }
  return { reply: "What have you tried so far? Paste your working, even if it is wrong, and I will point to the first step worth looking at.", misconceptionTag, live: false };
}

export async function run(input: TutorInput): Promise<TutorOutput> {
  const space = spaceById.get(input.spaceId);
  if (!space) return fallback(input);
  const transcript = input.messages.slice(-12).map((m) => `${m.role === "student" ? "Student" : "Tutor"}: ${m.text}`).join("\n");
  const res = await askGemini({
    system: buildSystemPrompt(space, input.firstName, input.grade),
    parts: [{ text: `TRANSCRIPT:\n${transcript}\n\nWrite the tutor's next reply.` }],
    temperature: 0.5,
    maxOutputTokens: 400,
  });
  if (!res.text) return fallback(input);
  const { reply, tag } = parseReply(res.text);
  if (!reply) return fallback(input);
  return { reply, misconceptionTag: tag, live: true };
}
