import { test } from "node:test";
import assert from "node:assert/strict";
import { autoMark, facility, parseNumeric, pctOf, rollMastery, secondsLeft } from "../src/lib/domain/assessment.ts";
import type { Attempt, Question } from "../src/lib/domain/assessment.ts";

const base: Omit<Question, "id" | "type" | "answer"> = {
  subjectId: "ls-maths",
  topicCode: "8Ae",
  stem: "Solve.",
  markScheme: ["A1 correct"],
  marks: 1,
  difficulty: "core",
  source: "authored",
};

const mcq: Question = { ...base, id: "q-mcq", type: "mcq", options: ["1", "2", "3"], answer: "1" };
const numeric: Question = { ...base, id: "q-num", type: "numeric", answer: "12.5", marks: 2 };
const structured: Question = { ...base, id: "q-str", type: "structured", answer: "x = 6", marks: 3 };

function attempt(id: string, awarded: Record<string, number>): Attempt {
  return {
    id,
    testId: "t",
    studentId: id,
    startedAt: "2026-09-14T10:00:00",
    submittedAt: "2026-09-14T10:20:00",
    answers: [],
    marking: Object.entries(awarded).map(([questionId, n]) => ({ questionId, awarded: n, points: [], feedback: "", status: "auto" as const })),
    maxMarks: 3,
    guardEvents: 0,
  };
}

test("parseNumeric reads plain numbers, equations, fractions and rejects text", () => {
  assert.equal(parseNumeric("5"), 5);
  assert.equal(parseNumeric("x = 5"), 5);
  assert.equal(parseNumeric("7/2"), 3.5);
  assert.equal(parseNumeric("12.5"), 12.5);
  assert.equal(parseNumeric("abc"), null);
  assert.equal(parseNumeric("1/0"), null);
});

test("autoMark scores an mcq by option index", () => {
  const right = autoMark(mcq, "1");
  assert.ok(right);
  assert.equal(right.awarded, 1);
  assert.equal(right.status, "auto");
  assert.equal(right.points[0]?.earned, true);
  const wrong = autoMark(mcq, "2");
  assert.ok(wrong);
  assert.equal(wrong.awarded, 0);
  assert.equal(wrong.points[0]?.earned, false);
});

test("autoMark accepts a numeric answer within tolerance and rejects text", () => {
  const close = autoMark(numeric, "12.50");
  assert.ok(close);
  assert.equal(close.awarded, 2);
  const off = autoMark(numeric, "12.7");
  assert.ok(off);
  assert.equal(off.awarded, 0);
  const text = autoMark(numeric, "twelve and a half");
  assert.ok(text);
  assert.equal(text.awarded, 0);
  assert.match(text.feedback, /as a number/);
});

test("autoMark leaves structured questions to the marker", () => {
  assert.equal(autoMark(structured, "x = 6"), null);
});

test("rollMastery seeds from the first result and then weights 70/30", () => {
  assert.equal(rollMastery(undefined, 80), 80);
  assert.equal(rollMastery(60, 100), 72);
});

test("pctOf rounds and guards a zero maximum", () => {
  assert.equal(pctOf(2, 3), 67);
  assert.equal(pctOf(3, 3), 100);
  assert.equal(pctOf(0, 0), 0);
});

test("facility averages the fraction of marks earned across attempts", () => {
  const attempts = [attempt("a", { "q-num": 2 }), attempt("b", { "q-num": 0 })];
  assert.equal(facility(numeric, attempts), 0.5);
  assert.equal(facility(mcq, attempts), null);
});

test("secondsLeft counts down a timed attempt and is null when untimed", () => {
  const started = { startedAt: "2026-09-14T10:00:00" };
  const now = new Date("2026-09-14T10:10:00");
  assert.equal(secondsLeft(started, 25, now), 15 * 60);
  assert.equal(secondsLeft(started, 5, now), 0);
  assert.equal(secondsLeft(started, undefined, now), null);
});
