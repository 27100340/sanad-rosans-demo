// Regenerates src/content/quran/verses.ts from the Al Quran Cloud API.
// Usage: node scripts/fetch-quran.mjs
import { writeFileSync } from "node:fs";

const SURAHS = [1, 67, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114];
const LIMIT = { 67: 15 };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function get(u) {
  for (let t = 0; t < 6; t++) {
    const r = await fetch(u);
    if (r.ok) return (await r.json()).data;
    await sleep(1500 * (t + 1));
  }
  throw new Error("failed " + u);
}

const meta = [];
const verses = [];
for (const s of SURAHS) {
  const uth = await get(`https://api.alquran.cloud/v1/surah/${s}/quran-uthmani`);
  await sleep(500);
  const simple = await get(`https://api.alquran.cloud/v1/surah/${s}/quran-simple-clean`);
  await sleep(500);
  const en = await get(`https://api.alquran.cloud/v1/surah/${s}/en.sahih`);
  await sleep(500);
  meta.push({
    number: s,
    nameArabic: uth.name,
    nameEnglish: uth.englishNameTranslation,
    nameTransliterated: uth.englishName,
    ayahCount: uth.numberOfAyahs,
    juz: uth.ayahs[0].juz,
  });
  const cap = LIMIT[s] ?? uth.numberOfAyahs;
  for (let i = 0; i < cap; i++) {
    const a = uth.ayahs[i];
    verses.push({
      surah: s,
      ayah: a.numberInSurah,
      textUthmani: a.text,
      textSimple: simple.ayahs[i].text,
      translationEn: en.ayahs[i].text,
      audioUrl: `https://cdn.islamic.network/quran/audio/128/ar.husary/${a.number}.mp3`,
    });
  }
  console.log("fetched surah", s);
}

const out = `/**
 * Genuine Quran text and audio for the demo subset.
 * Generated from the Al Quran Cloud API (Uthmani + simple-clean editions, Sahih International translation).
 * Audio: per-ayah recitation by Shaykh Mahmoud Khalil Al-Husary via cdn.islamic.network.
 * Production uses the Quran Foundation Content API v4 (see general-spec/06-hifz-engine.md).
 * Do not edit by hand; regenerate with scripts/fetch-quran.mjs.
 */
import type { Ayah, Surah } from "@/lib/domain/types";

export const SURAHS: Surah[] = ${JSON.stringify(meta, null, 2)};

export const VERSES: Ayah[] = ${JSON.stringify(verses, null, 2)};
`;
writeFileSync(new URL("../src/content/quran/verses.ts", import.meta.url), out);
console.log("surahs", meta.length, "verses", verses.length);
