/**
 * Read helpers over the bundled verse subset.
 *
 * Scoring runs against the SIMPLE text (`canonicalText`): transcripts from
 * ASR and browser speech arrive in plain orthography, and the normaliser
 * cannot map Uthmani dagger-alef spellings (سَمَٰوَٰتٍ) onto them. Display
 * uses the Uthmani words: `segmentsFor` drops standalone pause marks and the
 * basmala some editions prepend to ayah 1, then falls back to the simple
 * words for any ayah whose Uthmani word count still differs (only 109:1 in
 * the subset, where يَٰٓأَيُّهَا is one Uthmani word but two plain words). The
 * result: `segmentsFor(...).words` always index-aligns with the diff.
 */
import type { Ayah, Surah } from "@/lib/domain/types";
import { SURAHS, VERSES } from "@/content/quran/verses";
import { normalizeArabic, tokenizeArabic } from "./normalize";

const BASMALA = "بسم الله الرحمن الرحيم";
const BASMALA_WORDS = 4;
const ARABIC_DIGITS = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];

export function surahMeta(n: number): Surah | undefined {
  return SURAHS.find((s) => s.number === n);
}

export function versesFor(surah: number, from: number, to: number): Ayah[] {
  return VERSES.filter((v) => v.surah === surah && v.ayah >= from && v.ayah <= to).sort((a, b) => a.ayah - b.ayah);
}

export function findAyah(surah: number, ayah: number): Ayah | undefined {
  return VERSES.find((v) => v.surah === surah && v.ayah === ayah);
}

/** Uthmani words for display: pause marks dropped, a prepended basmala removed outside Al-Fatihah. */
export function uthmaniWords(ayah: Ayah): string[] {
  const words = ayah.textUthmani.split(/\s+/).filter((w) => normalizeArabic(w).length > 0);
  const prefixed = normalizeArabic(words.slice(0, BASMALA_WORDS).join(" ")) === BASMALA;
  const simpleHasBasmala = normalizeArabic(ayah.textSimple).startsWith(BASMALA);
  return prefixed && !simpleHasBasmala ? words.slice(BASMALA_WORDS) : words;
}

/** Plain-script words of the ayah; the token stream the diff scores against. */
export function simpleWords(ayah: Ayah): string[] {
  return tokenizeArabic(ayah.textSimple);
}

export interface AyahSegment {
  ayah: number;
  words: string[]; // display words, one per canonical token
  uthmani: boolean; // false when the ayah fell back to plain script
  audioUrl: string;
  translationEn: string;
}

export function segmentsFor(surah: number, from: number, to: number): AyahSegment[] {
  return versesFor(surah, from, to).map((v) => {
    const uth = uthmaniWords(v);
    const simple = simpleWords(v);
    const uthmani = uth.length === simple.length;
    return { ayah: v.ayah, words: uthmani ? uth : simple, uthmani, audioUrl: v.audioUrl, translationEn: v.translationEn };
  });
}

/** Text the recitation diff runs against (plain orthography, one token per display word). */
export function canonicalText(surah: number, from: number, to: number): string {
  return simpleText(surah, from, to);
}

export function uthmaniText(surah: number, from: number, to: number): string {
  return versesFor(surah, from, to)
    .flatMap((v) => uthmaniWords(v))
    .join(" ");
}

export function simpleText(surah: number, from: number, to: number): string {
  return versesFor(surah, from, to)
    .map((v) => v.textSimple)
    .join(" ");
}

/** True when the Uthmani display words and the canonical tokens line up for every ayah in the range. */
export function wordsAligned(surah: number, from: number, to: number): boolean {
  return segmentsFor(surah, from, to).every((s) => s.uthmani);
}

/** Ayah number for a canonical word index within the range. */
export function ayahAtWordIndex(segments: AyahSegment[], index: number): number | undefined {
  let cursor = 0;
  for (const seg of segments) {
    cursor += seg.words.length;
    if (index < cursor) return seg.ayah;
  }
  return undefined;
}

export function ayahLabel(surah: number, from: number, to: number): string {
  const name = surahMeta(surah)?.nameTransliterated ?? `Surah ${surah}`;
  return from === to ? `${name} ${surah}:${from}` : `${name} ${surah}:${from}–${to}`;
}

export function arabicNumeral(n: number): string {
  return String(n)
    .split("")
    .map((d) => ARABIC_DIGITS[Number(d)] ?? d)
    .join("");
}
