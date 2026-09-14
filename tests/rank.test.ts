import { test } from "node:test";
import assert from "node:assert/strict";
import { bandOf, compositeScore, effortPct, rankStudents } from "../src/lib/domain/rank.ts";
import { isOverdue, nextTaskStatus, pointsEarned } from "../src/lib/domain/tasks.ts";

test("composite weights marks 50, attendance 30, effort 20", () => {
  assert.equal(compositeScore({ marks: 80, attendance: 90, effort: 50 }), 77);
  assert.equal(compositeScore({ marks: 100, attendance: 100, effort: 100 }), 100);
});

test("a missing component shares its weight instead of counting as zero", () => {
  assert.equal(compositeScore({ marks: null, attendance: 90, effort: 60 }), 78);
  assert.equal(compositeScore({ marks: 70, attendance: 100, effort: null }), 81);
  assert.equal(compositeScore({ marks: null, attendance: 0, effort: null }), 0);
});

test("ranking shares a rank on ties and skips the next place", () => {
  const rows = rankStudents([
    { studentId: "a", marks: 60, attendance: 60, effort: 60 },
    { studentId: "b", marks: 90, attendance: 90, effort: 90 },
    { studentId: "c", marks: 90, attendance: 90, effort: 90 },
    { studentId: "d", marks: 75, attendance: 75, effort: 75 },
  ]);
  assert.deepEqual(rows.map((r) => [r.studentId, r.rank]), [["b", 1], ["c", 1], ["d", 3], ["a", 4]]);
  assert.equal(rows[0].band, "distinction");
  assert.equal(rows[3].band, "pass");
});

test("bands and effort percentage", () => {
  assert.equal(bandOf(85), "distinction");
  assert.equal(bandOf(69), "pass");
  assert.equal(bandOf(49), "support");
  assert.equal(effortPct(25, 50), 50);
  assert.equal(effortPct(60, 50), 100);
  assert.equal(effortPct(0, 0), null);
});

test("task helpers: next status, overdue and points", () => {
  assert.equal(nextTaskStatus("assigned"), "in_progress");
  assert.equal(nextTaskStatus("in_progress"), "done");
  assert.equal(nextTaskStatus("done"), "done");
  assert.equal(isOverdue({ dueAt: "2026-09-10", status: "assigned" }, "2026-09-14"), true);
  assert.equal(isOverdue({ dueAt: "2026-09-10", status: "done" }, "2026-09-14"), false);
  assert.equal(pointsEarned([{ points: 10, status: "done" }, { points: 25, status: "assigned" }]), 10);
});
