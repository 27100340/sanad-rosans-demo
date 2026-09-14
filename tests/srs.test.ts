import { test } from "node:test";
import assert from "node:assert/strict";
import { qualityFromScore, reviewUnit, todaysQueue, classifyUnit } from "../src/lib/domain/srs.ts";
import type { HifzUnit } from "../src/lib/domain/types.ts";

const base: HifzUnit = {
  id: "u", studentId: "s", surah: 67, fromAyah: 1, toAyah: 5,
  ease: 2.3, intervalDays: 1, dueDate: "2026-09-14", lastScore: null, reviews: 0, lapses: 0, status: "new",
};

test("score maps to quality grades", () => {
  assert.equal(qualityFromScore(100), 5);
  assert.equal(qualityFromScore(96), 4);
  assert.equal(qualityFromScore(80), 2);
  assert.equal(qualityFromScore(10), 0);
});

test("a perfect first review schedules the unit for tomorrow, then grows", () => {
  const r1 = reviewUnit(base, 100, "2026-09-14");
  assert.equal(r1.intervalDays, 1);
  assert.equal(r1.dueDate, "2026-09-15");
  const r2 = reviewUnit(r1, 100, "2026-09-15");
  assert.equal(r2.intervalDays, 3);
  const r3 = reviewUnit(r2, 100, "2026-09-18");
  assert.ok(r3.intervalDays > 3);
  assert.ok(r3.ease > base.ease);
});

test("a lapse resets the interval and lowers ease", () => {
  const secure = { ...base, reviews: 6, intervalDays: 30, ease: 2.6, status: "secure" as const };
  const r = reviewUnit(secure, 60, "2026-09-14");
  assert.equal(r.intervalDays, 1);
  assert.equal(r.lapses, 1);
  assert.ok(r.ease < 2.6);
  assert.equal(r.status, "weak");
});

test("queue splits due units into sabaq, sabqi and manzil", () => {
  const today = "2026-09-14";
  const units: HifzUnit[] = [
    { ...base, id: "new" },
    { ...base, id: "recent", reviews: 2, intervalDays: 3 },
    { ...base, id: "old", reviews: 8, intervalDays: 30 },
    { ...base, id: "future", reviews: 8, intervalDays: 30, dueDate: "2026-12-01" },
  ];
  const q = todaysQueue(units, today);
  assert.deepEqual(q.sabaq.map((u) => u.id), ["new"]);
  assert.deepEqual(q.sabqi.map((u) => u.id), ["recent"]);
  assert.deepEqual(q.manzil.map((u) => u.id), ["old"]);
  assert.equal(classifyUnit(units[3], today), "manzil");
});
