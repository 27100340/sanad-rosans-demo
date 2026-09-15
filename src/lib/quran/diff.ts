/**
 * Word-level alignment of a recitation transcript against canonical text.
 * Levenshtein over token sequences with backtrace, so every canonical word
 * gets a state: ok / sub / miss, and extra spoken words become ins.
 */
import type { RecitationResult, WordDiff } from "@/lib/domain/types";
import { tokenizeArabic } from "./normalize.ts";

/**
 * Connected-speech tolerance. Quranic orthography and what a reciter actually
 * says differ in two regular ways, and marking them as mistakes made a correct
 * recitation of Al-Mulk 11-15 score 95 and fail:
 *
 *   hamzat al-wasl  "أَوِ ٱجْهَرُوا" is said "awi-jharu", so ASR writes جهروا
 *                   where the text has اجهروا.
 *   final ha        the pronoun suffix in وَإِلَيْهِ is routinely elided, so
 *                   والي is heard where the text has واليه.
 *
 * Neither is a memorisation error, so both count as correct. This is only
 * about the leading alif and the trailing ha; every other difference, including
 * any change to the root letters, still marks as a substitution.
 */
const WASL_ALIF = "ا";
const SUFFIX_HA = "ه";

function droppedPrefix(longer: string, shorter: string, letter: string): boolean {
  return longer.length > 1 && longer.startsWith(letter) && longer.slice(1) === shorter;
}

function droppedSuffix(longer: string, shorter: string, letter: string): boolean {
  return longer.length > 1 && longer.endsWith(letter) && longer.slice(0, -1) === shorter;
}

export function equivalentWord(expected: string, heard: string): boolean {
  if (expected === heard) return true;
  if (droppedPrefix(expected, heard, WASL_ALIF) || droppedPrefix(heard, expected, WASL_ALIF)) return true;
  if (droppedSuffix(expected, heard, SUFFIX_HA) || droppedSuffix(heard, expected, SUFFIX_HA)) return true;
  return false;
}

export function alignWords(expectedWords: string[], heardWords: string[]): WordDiff[] {
  const n = expectedWords.length;
  const m = heardWords.length;
  const dp: number[][] = Array.from({ length: n + 1 }, () => new Array<number>(m + 1).fill(0));
  for (let i = 0; i <= n; i++) dp[i][0] = i;
  for (let j = 0; j <= m; j++) dp[0][j] = j;
  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      const cost = equivalentWord(expectedWords[i - 1], heardWords[j - 1]) ? 0 : 1;
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost);
    }
  }
  const out: WordDiff[] = [];
  let i = n;
  let j = m;
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && dp[i][j] === dp[i - 1][j - 1] + (equivalentWord(expectedWords[i - 1], heardWords[j - 1]) ? 0 : 1)) {
      const same = equivalentWord(expectedWords[i - 1], heardWords[j - 1]);
      out.push({ expected: expectedWords[i - 1], heard: heardWords[j - 1], state: same ? "ok" : "sub", index: i - 1 });
      i--; j--;
    } else if (i > 0 && dp[i][j] === dp[i - 1][j] + 1) {
      out.push({ expected: expectedWords[i - 1], heard: null, state: "miss", index: i - 1 });
      i--;
    } else {
      out.push({ expected: null, heard: heardWords[j - 1], state: "ins", index: i });
      j--;
    }
  }
  return out.reverse();
}

export interface CompareOptions {
  passThreshold?: number; // default 100 for sabaq
  source: RecitationResult["source"];
  surah: number;
  fromAyah: number;
  toAyah: number;
  tajweedNotes?: string[];
}

export function compareRecitation(canonicalText: string, transcript: string, opts: CompareOptions): RecitationResult {
  const expected = tokenizeArabic(canonicalText);
  const heard = tokenizeArabic(transcript);
  const words = alignWords(expected, heard);
  const correct = words.filter((w) => w.state === "ok").length;
  const substituted = words.filter((w) => w.state === "sub").length;
  const omitted = words.filter((w) => w.state === "miss").length;
  const inserted = words.filter((w) => w.state === "ins").length;
  const score = expected.length === 0 ? 0 : Math.round((correct / (expected.length + inserted)) * 100);
  const threshold = opts.passThreshold ?? 100;
  return {
    surah: opts.surah,
    fromAyah: opts.fromAyah,
    toAyah: opts.toAyah,
    transcript,
    words,
    correct,
    substituted,
    omitted,
    inserted,
    score,
    passed: score >= threshold,
    tajweedNotes: opts.tajweedNotes ?? [],
    source: opts.source,
  };
}
