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
    // Persian/Urdu letter forms first. ASR returns these for Quranic text, and
    // they sit outside the ء-ي range the punctuation rule below keeps, so
    // without this they are replaced by a space: "قدیر" split into "قد ر" and
    // "کل" silently lost its kaf. Both corrupted the word-level alignment.
    .replace(/ی/g, "ي") // farsi yeh -> ya
    .replace(/ک/g, "ك") // keheh -> kaf
    .replace(/ھ/g, "ه") // heh doachashmee -> ha
    .replace(/ے/g, "ي") // yeh barree -> ya
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
