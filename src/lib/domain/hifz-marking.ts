/**
 * Human marking of a recited passage: the rubric a qari marks on, and the
 * shape of a submission waiting for him.
 *
 * The rubric follows the criteria a madrasa examiner or a musabaqah judging
 * panel actually uses, not invented categories:
 *
 *   - Dabt (الضبط) — precision of the memorisation itself. Counted as
 *     omissions, substitutions, additions and the prompts the listener had to
 *     give. In an Urdu-medium madrasa the prompt is the "luqmah" (لقمہ), and
 *     the number of luqmas is the number every ustadh actually quotes about a
 *     sabaq, so it is marked as a count alongside the band.
 *   - Tajwid (التجويد) — makharij (articulation points), sifat (letter
 *     attributes), the madd lengths, the nun-sakinah/tanwin rules
 *     (ghunnah, ikhfa, idgham, iqlab) and qalqalah.
 *   - Waqf wa ibtida (الوقف والابتداء) — stopping on a complete meaning and
 *     resuming correctly. Judged separately from tajwid in every serious
 *     assessment because a fluent reciter can still break the meaning.
 *   - Talaqah (الطلاقة) — fluency, breath control and a steady tartil pace:
 *     neither rushed (hadr) nor stalling and restarting.
 *   - Adab at-tilawah (آداب التلاوة) — ta'awwudh and basmalah, composure and
 *     posture, and a voice used without a melody that distorts the letters.
 *
 * Bands use the grading vocabulary of the madrasa itself (mumtaz, jayyid
 * jiddan, jayyid, maqbul, da'if) rather than a bare 1-5.
 *
 * Pure: no IO, no React. The rubric is data so the marking desk renders it
 * rather than hardcoding criteria in JSX.
 */
import type { HifzUnit, HifzUnitKind } from "./types";

export type HifzBandId = "mumtaz" | "jayyid-jiddan" | "jayyid" | "maqbul" | "daif";

export interface HifzRubricBand {
  id: HifzBandId;
  /** English label shown on the band control. */
  label: string;
  /** The term the ustadh would actually say. */
  term: string;
  arabic: string;
  /** Share of the criterion's weight this band earns. */
  fraction: number;
}

export const HIFZ_BANDS: HifzRubricBand[] = [
  { id: "mumtaz", label: "Excellent", term: "Mumtaz", arabic: "ممتاز", fraction: 1 },
  { id: "jayyid-jiddan", label: "Very good", term: "Jayyid jiddan", arabic: "جيد جدا", fraction: 0.85 },
  { id: "jayyid", label: "Good", term: "Jayyid", arabic: "جيد", fraction: 0.7 },
  { id: "maqbul", label: "Acceptable", term: "Maqbul", arabic: "مقبول", fraction: 0.55 },
  { id: "daif", label: "Weak", term: "Da'if", arabic: "ضعيف", fraction: 0.3 },
];

export type HifzCriterionId = "dabt" | "tajwid" | "waqf" | "talaqah" | "adab";

export interface HifzRubricCriterion {
  id: HifzCriterionId;
  label: string;
  term: string;
  arabic: string;
  /** Points out of 100; the five weights sum to 100. */
  weight: number;
  /** What the qari is listening for. */
  hint: string;
  descriptors: Record<HifzBandId, string>;
}

/**
 * Weights put memorisation first, as a daily hearing does: dabt alone is 40
 * and the two tajwid-family criteria together are 35. A musabaqah panel
 * typically splits hifz 60 / tajwid 30 / sawt 10, which over-weights
 * performance for a classroom sabaq; fluency and adab are kept at 15 and 10 so
 * a child who has genuinely memorised the passage is not failed on delivery.
 */
export const HIFZ_RUBRIC: HifzRubricCriterion[] = [
  {
    id: "dabt",
    label: "Memorisation accuracy",
    term: "Dabt",
    arabic: "الضبط",
    weight: 40,
    hint: "Omissions, substitutions, additions, hesitation and prompts needed",
    descriptors: {
      mumtaz: "Recited end to end with no prompt, no omission and no substitution.",
      "jayyid-jiddan": "One slip, self-corrected without a prompt; the text is otherwise exact.",
      jayyid: "One or two prompts needed, or a word substituted and corrected on the prompt.",
      maqbul: "Several prompts or a repeated ayah confusion, but the passage was completed.",
      daif: "Could not continue without being fed the text, or whole ayat were missing.",
    },
  },
  {
    id: "tajwid",
    label: "Tajwid",
    term: "Tajwid",
    arabic: "التجويد",
    weight: 25,
    hint: "Makharij, sifat, madd lengths, ghunnah and the nun-sakinah rules, qalqalah",
    descriptors: {
      mumtaz: "Letters from their correct makhraj, madd held to its measure, ghunnah and qalqalah applied throughout.",
      "jayyid-jiddan": "One or two rules slipped in isolated words; nothing systematic.",
      jayyid: "A rule is applied inconsistently — usually madd length or ghunnah on ikhfa.",
      maqbul: "Clear recurring faults in makharij or madd, but the words remain recognisable.",
      daif: "Letters routinely substituted at the makhraj, or the rules are not being applied.",
    },
  },
  {
    id: "waqf",
    label: "Stopping and starting",
    term: "Waqf wa ibtida",
    arabic: "الوقف والابتداء",
    weight: 10,
    hint: "Stops on a complete meaning; resumes from a correct starting point",
    descriptors: {
      mumtaz: "Every stop on a sound place, every resumption from the start of the meaning.",
      "jayyid-jiddan": "One stop taken for breath in a workable but not ideal place.",
      jayyid: "Stops for breath mid-phrase and resumes from the same word rather than the phrase.",
      maqbul: "Stops break the meaning more than once, or resumes mid-phrase.",
      daif: "Stopping and starting is arbitrary and changes the sense of the ayah.",
    },
  },
  {
    id: "talaqah",
    label: "Fluency and pace",
    term: "Talaqah",
    arabic: "الطلاقة",
    weight: 15,
    hint: "Steady tartil pace, controlled breath, no stalling or unnecessary repetition",
    descriptors: {
      mumtaz: "Even tartil pace from beginning to end, breath well placed, no repetition.",
      "jayyid-jiddan": "Fluent with one pause to gather the next ayah.",
      jayyid: "Noticeably uneven: rushes the familiar parts and slows at the joins.",
      maqbul: "Frequent stalling or repeating of a phrase to find the thread.",
      daif: "Halting throughout; the passage does not hold together as a recitation.",
    },
  },
  {
    id: "adab",
    label: "Adab of recitation",
    term: "Adab at-tilawah",
    arabic: "آداب التلاوة",
    weight: 10,
    hint: "Ta'awwudh and basmalah, composure and posture, voice used without distorting the letters",
    descriptors: {
      mumtaz: "Ta'awwudh and basmalah given, composed throughout, voice serves the letters.",
      "jayyid-jiddan": "Correct and attentive; a small lapse in composure or the opening.",
      jayyid: "Ta'awwudh or basmalah omitted, or the tone wanders from the recitation.",
      maqbul: "Restless or distracted, or a melody that begins to stretch the letters.",
      daif: "Recited without adab; the delivery works against the text.",
    },
  },
];

export const HIFZ_RUBRIC_TOTAL = HIFZ_RUBRIC.reduce((sum, c) => sum + c.weight, 0);

export interface HifzRubricMark {
  criterionId: HifzCriterionId;
  bandId: HifzBandId;
}

export type HifzMarkOutcome = "pass" | "repeat" | "needs-work";

export const HIFZ_OUTCOMES: HifzMarkOutcome[] = ["pass", "repeat", "needs-work"];

export const OUTCOME_LABEL: Record<HifzMarkOutcome, string> = {
  pass: "Pass",
  repeat: "Repeat",
  "needs-work": "Needs work",
};

export const OUTCOME_HINT: Record<HifzMarkOutcome, string> = {
  pass: "Accepted; the next lesson may be set",
  repeat: "Recite this same passage again at the next hearing",
  "needs-work": "Back to learning before it is heard again",
};

export interface HifzMark {
  marks: HifzRubricMark[];
  /** Prompts the ustadh had to give during the hearing. */
  luqmas: number;
  /** Weighted rubric total, 0-100. Derived; never entered by hand. */
  score: number;
  outcome: HifzMarkOutcome;
  comment: string;
  markedById: string;
  markedByName: string;
  /** ISO datetime. */
  markedAt: string;
}

export type HifzSubmissionStatus = "pending" | "marked";

export interface HifzSubmission {
  id: string;
  studentId: string;
  unitId: string;
  unitKind: HifzUnitKind;
  surah: number;
  fromAyah: number;
  toAyah: number;
  /** ISO datetime. */
  submittedAt: string;
  /** 0 when the client could not measure the clip. */
  durationSeconds: number;
  /** False for the seeded row and for clips evicted from the memory store. */
  audioAvailable: boolean;
  /** Why the recording cannot be played, when it cannot. Shown to the user verbatim. */
  audioNote: string | null;
  status: HifzSubmissionStatus;
  mark: HifzMark | null;
  /** SRS state the mark wrote, so both seats can see what it changed. */
  unitAfterMark: HifzUnit | null;
}

export const MAX_LUQMAS = 30;
export const MAX_COMMENT_CHARS = 600;

export function criterionById(id: string): HifzRubricCriterion | undefined {
  return HIFZ_RUBRIC.find((c) => c.id === id);
}

export function bandById(id: string): HifzRubricBand | undefined {
  return HIFZ_BANDS.find((b) => b.id === id);
}

export function isCriterionId(value: unknown): value is HifzCriterionId {
  return typeof value === "string" && criterionById(value) !== undefined;
}

export function isBandId(value: unknown): value is HifzBandId {
  return typeof value === "string" && bandById(value) !== undefined;
}

export function isOutcome(value: unknown): value is HifzMarkOutcome {
  return typeof value === "string" && (HIFZ_OUTCOMES as string[]).includes(value);
}

/** Points this band earns on this criterion, rounded for display. */
export function criterionPoints(criterion: HifzRubricCriterion, band: HifzRubricBand): number {
  return Math.round(criterion.weight * band.fraction * 10) / 10;
}

export function bandFor(marks: HifzRubricMark[], criterionId: HifzCriterionId): HifzRubricBand | undefined {
  const mark = marks.find((m) => m.criterionId === criterionId);
  return mark ? bandById(mark.bandId) : undefined;
}

/** Criteria still unmarked; the desk cannot submit while any remain. */
export function missingCriteria(marks: HifzRubricMark[]): HifzRubricCriterion[] {
  return HIFZ_RUBRIC.filter((c) => bandFor(marks, c.id) === undefined);
}

/** Weighted total out of 100. An unmarked criterion contributes nothing. */
export function rubricScore(marks: HifzRubricMark[]): number {
  const earned = HIFZ_RUBRIC.reduce((sum, criterion) => {
    const band = bandFor(marks, criterion.id);
    return band ? sum + criterion.weight * band.fraction : sum;
  }, 0);
  return Math.round((earned / HIFZ_RUBRIC_TOTAL) * 100);
}

/**
 * What the rubric points to, shown to the qari as a suggestion only; the
 * outcome he records is his own and is what the record is written from.
 * A sabaq is held to a tighter line than revision because a new lesson is
 * expected near-exact before the next one is set, and a sabaq that needed
 * more than one luqmah is repeated whatever the bands say.
 */
export function suggestedOutcome(kind: HifzUnitKind, score: number, luqmas: number): HifzMarkOutcome {
  const strict = kind === "sabaq";
  const passScore = strict ? 90 : 85;
  const passLuqmas = strict ? 1 : 3;
  if (score >= passScore && luqmas <= passLuqmas) return "pass";
  if (score >= (strict ? 70 : 65)) return "repeat";
  return "needs-work";
}

/** Normalises an untrusted marks payload; null when anything is unusable. */
export function parseRubricMarks(value: unknown): HifzRubricMark[] | null {
  if (!Array.isArray(value)) return null;
  const marks: HifzRubricMark[] = [];
  for (const entry of value) {
    if (!entry || typeof entry !== "object") return null;
    const { criterionId, bandId } = entry as { criterionId?: unknown; bandId?: unknown };
    if (!isCriterionId(criterionId) || !isBandId(bandId)) return null;
    if (marks.some((m) => m.criterionId === criterionId)) return null;
    marks.push({ criterionId, bandId });
  }
  return marks;
}
