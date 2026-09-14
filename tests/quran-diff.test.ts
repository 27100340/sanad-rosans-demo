import { test } from "node:test";
import assert from "node:assert/strict";
import { normalizeArabic, tokenizeArabic } from "../src/lib/quran/normalize.ts";
import { alignWords, compareRecitation } from "../src/lib/quran/diff.ts";

// Canonical comparison text is the simple (Imlaei) edition; Uthmani is display-only
// because its dagger alef (U+0670) does not map one-to-one onto modern orthography.
const FATIHA_2_UTHMANI = "ٱلْحَمْدُ لِلَّهِ رَبِّ ٱلْعَٰلَمِينَ";
const FATIHA_2_SIMPLE = "الحمد لله رب العالمين";
const RAHMAN_UTHMANI = "ٱلرَّحْمَٰنِ ٱلرَّحِيمِ";

test("normalisation strips diacritics, keeps word count, unifies alef wasla", () => {
  assert.equal(tokenizeArabic(FATIHA_2_UTHMANI).length, 4);
  assert.equal(tokenizeArabic(FATIHA_2_SIMPLE).length, 4);
  assert.equal(normalizeArabic(RAHMAN_UTHMANI), "الرحمن الرحيم");
  assert.equal(normalizeArabic(FATIHA_2_SIMPLE), FATIHA_2_SIMPLE);
});

test("perfect recitation scores 100 and passes", () => {
  const r = compareRecitation(FATIHA_2_SIMPLE, "الحمد لله رب العالمين", { source: "simulated", surah: 1, fromAyah: 2, toAyah: 2 });
  assert.equal(r.score, 100);
  assert.equal(r.passed, true);
  assert.equal(r.omitted, 0);
});

test("an omitted word is marked miss and fails a sabaq", () => {
  const r = compareRecitation(FATIHA_2_SIMPLE, "الحمد لله العالمين", { source: "simulated", surah: 1, fromAyah: 2, toAyah: 2 });
  assert.equal(r.omitted, 1);
  assert.equal(r.words.find((w) => w.state === "miss")?.expected, "رب");
  assert.equal(r.passed, false);
});

test("a substituted word is marked sub with the heard word", () => {
  const r = compareRecitation(FATIHA_2_SIMPLE, "الحمد لله ملك العالمين", { source: "simulated", surah: 1, fromAyah: 2, toAyah: 2 });
  assert.equal(r.substituted, 1);
  const sub = r.words.find((w) => w.state === "sub");
  assert.equal(sub?.expected, "رب");
  assert.equal(sub?.heard, "ملك");
});

test("an inserted word is marked ins and lowers the score", () => {
  const r = compareRecitation(FATIHA_2_SIMPLE, "الحمد لله رب رب العالمين", { source: "simulated", surah: 1, fromAyah: 2, toAyah: 2 });
  assert.equal(r.inserted, 1);
  assert.ok(r.score < 100);
});

test("a diacritised transcript still matches after normalisation", () => {
  const r = compareRecitation(FATIHA_2_SIMPLE, "الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ", { source: "browser-speech", surah: 1, fromAyah: 2, toAyah: 2 });
  assert.equal(r.score, 100);
});

test("alignWords keeps canonical order and indexes", () => {
  const d = alignWords(["a", "b", "c"], ["a", "c"]);
  assert.deepEqual(d.map((w) => w.state), ["ok", "miss", "ok"]);
  assert.deepEqual(d.map((w) => w.index), [0, 1, 2]);
});
