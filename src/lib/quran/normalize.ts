/**
 * Arabic normalisation for recitation comparison. Strips tashkeel and
 * orthographic variants so that "what was said" can be aligned with the
 * canonical text at the word level. Pure; used on server and client.
 */

// Tashkeel, Quranic annotation marks, tatweel.
const DIACRITICS = /[ؐ-ًؚ-ٰٟۖ-ۭـ࣓-ࣿ]/g;

export function normalizeArabic(text: string): string {
  return text
    .replace(DIACRITICS, "")
    .replace(/[آأإٱ]/g, "ا") // alef variants -> alef
    .replace(/ة/g, "ه") // ta marbuta -> ha
    .replace(/ى/g, "ي") // alef maqsura -> ya
    .replace(/[ؤ]/g, "و") // waw hamza -> waw
    .replace(/[ئ]/g, "ي") // ya hamza -> ya
    .replace(/[ء]/g, "") // lone hamza
    .replace(/[^ء-ي\s]/g, " ") // drop punctuation, ayah markers, digits
    .replace(/\s+/g, " ")
    .trim();
}

export function tokenizeArabic(text: string): string[] {
  const n = normalizeArabic(text);
  return n ? n.split(" ") : [];
}
