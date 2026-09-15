/**
 * Play coach. Two small Groq seats for the younger stages:
 *
 *   nextRound()  — fresh items at the right level, so a child does not meet the
 *                  same four words twice.
 *   encourage()  — one warm line after a round.
 *
 * Both are optional. With no key, or on any failure, or when the model returns
 * something `validateRound` will not accept, the child plays the seeded pool
 * and hears a scripted line — and `live` says so honestly.
 *
 * Nothing generated here is an assessment, and no output reaches a child
 * without passing the domain validator first.
 */
import { VALUES_GUARDRAIL } from "./gemini";
import { askGroq } from "./groq";
import { stripLatex } from "./plain-maths";
import { BANDS, GLYPHS, roundSignature, semanticCheck, starsFor, validateRound, type PlayActivity, type PlayRound, type PlayStrand } from "@/lib/domain/play";
import { school } from "@/lib/config/school";

export interface RoundResult {
  round: PlayRound;
  /** True only when these items came from the model. */
  live: boolean;
}

export interface CoachResult {
  message: string;
  live: boolean;
}

/* ------------------------------------------------------------------ */
/* Round generation                                                    */
/* ------------------------------------------------------------------ */

const SHAPE_LINES: Record<PlayActivity["kind"], string> = {
  match: `{"prompt": "<short instruction>", "pairs": [{"left": "<thing>", "right": "<its partner>"}, ... exactly 4 pairs]}`,
  sort: `{"prompt": "<short instruction>", "bins": [<the exact bin names given below, in that order>], "items": [{"label": "<thing>", "bin": "<one of the bins>"}, ... exactly 6 items, two per bin]}`,
  sequence: `{"prompt": "<short instruction>", "steps": ["<first>", "<second>", ... 4 or 5 steps ALREADY IN THE CORRECT ORDER]}`,
  count: `{"prompt": "<short instruction>", "questions": [{"prompt": "<the question>", "glyph": <picture name or null>, "answer": <number>, "choices": [<3 numbers including the answer>]}, ... exactly 4 questions]}`,
  pattern: `{"prompt": "<short instruction>", "puzzles": [{"shown": ["<term>", ... 4 or 5 terms], "answer": "<next term>", "choices": ["<3 options including the answer>"]}, ... exactly 3 puzzles]}`,
};

function shapeNotes(activity: PlayActivity, template: PlayRound | null): string[] {
  const notes: string[] = [];
  if (activity.kind === "sort" && template?.kind === "sort") {
    notes.push(`The bins must be exactly these three strings, spelled identically: ${template.bins.map((b) => `"${b}"`).join(", ")}. Every bin must get at least one item.`);
  }
  if (activity.kind === "count") {
    notes.push(`"glyph" must be null, or one of these picture names: ${GLYPHS.join(", ")}. When you set a picture the answer must be between 1 and 12, because the board draws that many pictures.`);
  }
  if (activity.kind === "pattern" && activity.band === "early") {
    notes.push(`Every term and every choice must be one of these picture names: ${GLYPHS.join(", ")}.`);
  }
  if (activity.script === "ur") {
    notes.push("Write in Urdu script. Never Roman Urdu, never transliteration.");
  }
  return notes;
}

function buildRoundPrompt(activity: PlayActivity, avoid: string[]): string {
  const band = BANDS[activity.band];
  const template = activity.rounds[0] ?? null;
  return [
    `You write one short practice round for a child at ${school.schoolName}. Band: ${band.label}. Activity: "${activity.title}" — ${activity.blurb}`,
    VALUES_GUARDRAIL,
    `LEVEL: ${band.roundGoal}`,
    `TOPIC: ${activity.aiBrief}`,
    `OUTPUT: one JSON object and nothing else. No prose, no code fence, no explanation. Exactly this shape:\n${SHAPE_LINES[activity.kind]}`,
    ...shapeNotes(activity, template),
    template ? `A round of the right level and shape looks like this. Match its difficulty, not its items:\n${JSON.stringify(template)}` : "",
    avoid.length ? `ALREADY USED — do not use any of these again: ${avoid.join(", ")}` : "",
    "Write mathematics as plain text a young child can read, like 6 × 7 or 3/4. Never LaTeX, never backslashes, never $ delimiters.",
    "This is practice, never a test. Keep every label under eight words. No emoji. No HTML. No links.",
  ]
    .filter(Boolean)
    .join("\n\n");
}

/** Pull the first JSON object out of a reply, tolerating a stray code fence. */
function extractJson(text: string): unknown {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const body = (fenced ? fenced[1] : text).trim();
  const start = body.indexOf("{");
  const end = body.lastIndexOf("}");
  if (start === -1 || end <= start) return null;
  try {
    return JSON.parse(body.slice(start, end + 1));
  } catch {
    return null;
  }
}

/** Run every string in the parsed payload through stripLatex before it meets the validator. */
function deepStrip(value: unknown): unknown {
  if (typeof value === "string") return stripLatex(value).trim();
  if (Array.isArray(value)) return value.map(deepStrip);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value as Record<string, unknown>).map(([k, v]) => [k, deepStrip(v)]));
  }
  return value;
}

/** Generated items must actually be new, or the point of generating them is lost. */
function isFresh(round: PlayRound, avoid: string[]): boolean {
  if (avoid.length === 0) return true;
  const used = new Set(avoid.map((a) => a.toLowerCase()));
  const signature = roundSignature(round);
  const repeats = signature.filter((s) => used.has(s.toLowerCase())).length;
  return repeats <= Math.floor(signature.length / 2);
}

export async function nextRound(input: { activity: PlayActivity; fallback: PlayRound; avoid: string[] }): Promise<RoundResult> {
  const { activity, fallback, avoid } = input;
  const res = await askGroq({
    system: buildRoundPrompt(activity, avoid),
    parts: [{ text: `Write the next round for "${activity.title}". Return only the JSON object.` }],
    temperature: 0.9,
    maxOutputTokens: 700,
  });
  if (!res.text) return { round: fallback, live: false };

  const parsed = deepStrip(extractJson(res.text));
  const round = validateRound(activity.kind, parsed);
  if (!round) {
    console.warn(`[play-coach] ${activity.id}: generated round failed validation; using seeded pool`);
    return { round: fallback, live: false };
  }
  if (!isFresh(round, avoid)) {
    console.warn(`[play-coach] ${activity.id}: generated round repeated seen items; using seeded pool`);
    return { round: fallback, live: false };
  }
  // Well-formed is not the same as true: the model has paired an Urdu letter
  // with a word that does not start with it. Where the relation is checkable,
  // a wrong round is thrown away rather than taught.
  if (!semanticCheck(activity.id, round)) {
    console.warn(`[play-coach] ${activity.id}: generated round failed its semantic check; using seeded pool`);
    return { round: fallback, live: false };
  }
  return { round, live: true };
}

/* ------------------------------------------------------------------ */
/* Encouragement                                                       */
/* ------------------------------------------------------------------ */

export interface EncourageInput {
  activity: PlayActivity;
  firstName: string;
  correct: number;
  total: number;
  withAdult: boolean;
}

const STRAND_WORD: Record<PlayStrand, string> = {
  literacy: "sounds and words",
  numeracy: "numbers",
  shapes: "shapes and patterns",
  islamic: "Islamic studies",
  urdu: "Urdu",
};

/** Two scripted lines per outcome, so the same child does not read the same words twice in a row. */
const SCRIPTED: Record<1 | 2 | 3, ((name: string, strand: string) => string)[]> = {
  3: [
    (name, strand) => `Every single one, ${name}. That was quick work with ${strand} — pick another when you are ready.`,
    (name, strand) => `All of them right, ${name}. Practice with ${strand} is clearly paying off. Well done.`,
  ],
  2: [
    (name, strand) => `Most of them, ${name}. The ones you missed are exactly the ones worth trying again tomorrow.`,
    (name) => `Good going, ${name}. You got the hang of it partway through — that is how it is supposed to work.`,
  ],
  1: [
    (name) => `You finished the whole thing, ${name}, and that is the part that counts. Try it again tomorrow and it will feel easier.`,
    (name, strand) => `A good try, ${name}. This bit of ${strand} is new, so give it another go later with someone beside you.`,
  ],
};

export function scriptedEncouragement(input: EncourageInput): string {
  const stars = starsFor(input.correct, input.total);
  const variants = SCRIPTED[stars];
  const line = variants[(input.correct + input.total) % variants.length];
  const base = line(input.firstName, STRAND_WORD[input.activity.strand]);
  return input.withAdult ? `${base} Thank you for sitting with them.` : base;
}

/** Language that would turn practice into a verdict. If the model reaches for it, we do not use the line. */
const GRADE_WORDS = /\b(grade|score|marks?|percent|exam|test|report card|fail|failed|pass(?:ed)?|rank|level up|assessment)\b/i;
const UNSAFE_REPLY = /[<>{}\\]|https?:|www\./i;

function validateMessage(text: string): string | null {
  const cleaned = stripLatex(text)
    .replace(/[*_`#]/g, "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .join(" ")
    .trim();
  if (!cleaned || cleaned.length > 240) return null;
  if (GRADE_WORDS.test(cleaned) || UNSAFE_REPLY.test(cleaned)) return null;
  return cleaned;
}

export async function encourage(input: EncourageInput): Promise<CoachResult> {
  const { activity, firstName, correct, total, withAdult } = input;
  const band = BANDS[activity.band];
  const system = [
    `You speak to a child at ${school.schoolName} who has just finished a short practice activity called "${activity.title}" (${STRAND_WORD[activity.strand]}). Band: ${band.label}.`,
    VALUES_GUARDRAIL,
    `The child's first name is ${firstName}. They got ${correct} of ${total} right.${withAdult ? " A parent played alongside them; you may thank the adult in one short clause." : ""}`,
    "Write ONE encouraging sentence, two at most, under 35 words total. Warm, specific and calm.",
    "This is practice, never a test. Never mention grades, marks, scores, percentages, passing, failing, ranking or reports. Never promise a reward.",
    "Name one concrete next step only if it is gentle, for example trying it again tomorrow. Plain text. No emoji, no markdown, no headings.",
  ].join("\n\n");

  const res = await askGroq({
    system,
    parts: [{ text: `Write the line for ${firstName}.` }],
    temperature: 0.7,
    maxOutputTokens: 120,
  });
  const message = res.text ? validateMessage(res.text) : null;
  if (!message) return { message: scriptedEncouragement(input), live: false };
  return { message, live: true };
}
