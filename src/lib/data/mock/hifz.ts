/**
 * Hifz mock state. Units reference the genuine verse subset in
 * src/content/quran/verses.ts. Dates are relative to today so the queue
 * always has sabaq, sabqi and manzil items.
 */
import type { HifzPlan, HifzUnit, MutashabihPair, RecitationAttempt } from "@/lib/domain/types";
import { daysAgoISO } from "@/lib/utils";

function unit(id: string, studentId: string, surah: number, from: number, to: number, state: Partial<HifzUnit>): HifzUnit {
  return {
    id,
    studentId,
    surah,
    fromAyah: from,
    toAyah: to,
    ease: 2.3,
    intervalDays: 1,
    dueDate: daysAgoISO(0),
    lastScore: null,
    reviews: 0,
    lapses: 0,
    status: "new",
    ...state,
  };
}

const Z = "s-zaid-hassan";

export const ZAID_UNITS: HifzUnit[] = [
  // Juz 30 (completed): secure manzil units, a few due today, one weak.
  unit("u-114", Z, 114, 1, 6, { reviews: 9, intervalDays: 30, ease: 2.6, dueDate: daysAgoISO(-12), lastScore: 100, status: "secure" }),
  unit("u-113", Z, 113, 1, 5, { reviews: 9, intervalDays: 30, ease: 2.6, dueDate: daysAgoISO(0), lastScore: 100, status: "secure" }),
  unit("u-112", Z, 112, 1, 4, { reviews: 10, intervalDays: 35, ease: 2.7, dueDate: daysAgoISO(-20), lastScore: 100, status: "secure" }),
  unit("u-111", Z, 111, 1, 5, { reviews: 8, intervalDays: 21, ease: 2.4, dueDate: daysAgoISO(1), lastScore: 95, status: "secure" }),
  unit("u-110", Z, 110, 1, 3, { reviews: 8, intervalDays: 28, ease: 2.5, dueDate: daysAgoISO(-9), lastScore: 100, status: "secure" }),
  unit("u-109", Z, 109, 1, 6, { reviews: 7, intervalDays: 4, ease: 1.9, dueDate: daysAgoISO(3), lastScore: 78, lapses: 2, status: "weak" }),
  unit("u-108", Z, 108, 1, 3, { reviews: 8, intervalDays: 28, ease: 2.5, dueDate: daysAgoISO(-15), lastScore: 100, status: "secure" }),
  unit("u-107", Z, 107, 1, 7, { reviews: 7, intervalDays: 21, ease: 2.4, dueDate: daysAgoISO(-3), lastScore: 100, status: "secure" }),
  unit("u-106", Z, 106, 1, 4, { reviews: 8, intervalDays: 28, ease: 2.5, dueDate: daysAgoISO(-18), lastScore: 100, status: "secure" }),
  unit("u-105", Z, 105, 1, 5, { reviews: 7, intervalDays: 21, ease: 2.4, dueDate: daysAgoISO(2), lastScore: 92, status: "secure" }),
  // Juz 29, Al-Mulk in progress.
  unit("u-67a", Z, 67, 1, 5, { reviews: 4, intervalDays: 6, ease: 2.3, dueDate: daysAgoISO(0), lastScore: 100, status: "learning" }),
  unit("u-67b", Z, 67, 6, 10, { reviews: 2, intervalDays: 3, ease: 2.2, dueDate: daysAgoISO(0), lastScore: 90, status: "learning" }),
  unit("u-67c", Z, 67, 11, 15, { reviews: 0, status: "new" }),
];

export const PLANS: HifzPlan[] = [
  { studentId: Z, ustadhId: "t-qari-abdul-rehman", currentJuz: 29, currentSurah: 67, dailySabaqAyat: 5, juzCompleted: [30], targetCompletionYear: 2029 },
];

export const ZAID_ATTEMPTS: RecitationAttempt[] = [
  {
    id: "att-1",
    studentId: Z,
    unitId: "u-109",
    date: daysAgoISO(1),
    surah: 109,
    fromAyah: 1,
    toAyah: 6,
    transcript: "قل يا ايها الكافرون لا اعبد ما تعبدون ولا انتم عابدون ما اعبد ولا عابد ما عبدتم ولا انتم عابدون ما اعبد لكم دينكم ولي دين",
    words: [],
    correct: 26,
    substituted: 0,
    omitted: 1,
    inserted: 0,
    score: 96,
    passed: false,
    tajweedNotes: ["Madd in عَابِدُونَ shortened (suggested)"],
    source: "gemini",
  },
];

/** Halaqa-level summaries for the ustadh board (other students are summarised, not fully modelled). */
export interface HalaqaRow {
  studentId: string;
  juzCompleted: number;
  currentSurah: string;
  securePct: number;
  weakUnits: number;
  overdueManzil: number;
  lastSabaqScore: number;
  homeRecitationsThisWeek: number;
}

export const HALAQA_2: HalaqaRow[] = [
  { studentId: "s-zaid-hassan", juzCompleted: 1, currentSurah: "Al-Mulk", securePct: 82, weakUnits: 1, overdueManzil: 0, lastSabaqScore: 90, homeRecitationsThisWeek: 5 },
  { studentId: "s-ibrahim-khalid", juzCompleted: 3, currentSurah: "Al-Muzzammil", securePct: 88, weakUnits: 2, overdueManzil: 1, lastSabaqScore: 100, homeRecitationsThisWeek: 6 },
  { studentId: "s-yahya-anwar", juzCompleted: 2, currentSurah: "Al-Haqqah", securePct: 61, weakUnits: 6, overdueManzil: 5, lastSabaqScore: 72, homeRecitationsThisWeek: 1 },
  { studentId: "s-musa-rafiq", juzCompleted: 5, currentSurah: "Al-Mujadila", securePct: 91, weakUnits: 1, overdueManzil: 0, lastSabaqScore: 100, homeRecitationsThisWeek: 7 },
  { studentId: "s-hassan-nadeem", juzCompleted: 1, currentSurah: "Al-Qalam", securePct: 54, weakUnits: 7, overdueManzil: 8, lastSabaqScore: 65, homeRecitationsThisWeek: 0 },
  { studentId: "s-abdullah-saleem", juzCompleted: 4, currentSurah: "At-Tahrim", securePct: 85, weakUnits: 2, overdueManzil: 1, lastSabaqScore: 95, homeRecitationsThisWeek: 4 },
  { studentId: "s-talha-mehmood", juzCompleted: 2, currentSurah: "Al-Maarij", securePct: 77, weakUnits: 3, overdueManzil: 2, lastSabaqScore: 88, homeRecitationsThisWeek: 3 },
  { studentId: "s-hamdan-riaz", juzCompleted: 3, currentSurah: "Al-Jinn", securePct: 80, weakUnits: 2, overdueManzil: 1, lastSabaqScore: 92, homeRecitationsThisWeek: 5 },
];

/** Genuine look-alike verse pairs within the demo subset (and one classic pair outside it). */
export const MUTASHABIHAT: MutashabihPair[] = [
  { a: { surah: 109, ayah: 3 }, b: { surah: 109, ayah: 5 }, sharedPhrase: "وَلَآ أَنتُمْ عَٰبِدُونَ مَآ أَعْبُدُ", difference: "Ayah 3 and 5 are identical; the slip is usually jumping from ayah 3 straight to ayah 6. Anchor: ayah 4 (وَلَآ أَنَا۠ عَابِدٌ مَّا عَبَدتُّمْ) sits between them." },
  { a: { surah: 109, ayah: 2 }, b: { surah: 109, ayah: 4 }, sharedPhrase: "لَآ أَعْبُدُ … / وَلَآ أَنَا۠ عَابِدٌ …", difference: "Ayah 2 is present tense (أَعْبُدُ … تَعْبُدُونَ); ayah 4 is the noun form with past tense (عَابِدٌ … عَبَدتُّمْ)." },
  { a: { surah: 113, ayah: 1 }, b: { surah: 114, ayah: 1 }, sharedPhrase: "قُلْ أَعُوذُ بِرَبِّ", difference: "Al-Falaq continues ٱلْفَلَقِ; An-Nas continues ٱلنَّاسِ. Both surahs open identically for three words." },
  { a: { surah: 67, ayah: 1 }, b: { surah: 25, ayah: 1 }, sharedPhrase: "تَبَٰرَكَ ٱلَّذِى", difference: "Al-Mulk continues بِيَدِهِ ٱلْمُلْكُ; Al-Furqan continues نَزَّلَ ٱلْفُرْقَانَ." },
];

export function unitsForStudent(studentId: string): HifzUnit[] {
  return ZAID_UNITS.filter((u) => u.studentId === studentId);
}

export function planForStudent(studentId: string): HifzPlan | undefined {
  return PLANS.find((p) => p.studentId === studentId);
}
