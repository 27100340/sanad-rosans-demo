import { test } from "node:test";
import assert from "node:assert/strict";
import {
  expenseTransition,
  netPay,
  money,
  csv,
  type Expense,
} from "../src/lib/domain/finance.ts";
import { appraisalScore, validateReview } from "../src/lib/domain/hr.ts";
import {
  stageFor,
  lessonTemplate,
  STAGES,
} from "../src/lib/domain/teaching.ts";
const pending: Expense = {
  id: "e1",
  branchId: "gulberg",
  vendor: "Books",
  category: "Learning materials",
  description: "Reading books",
  amount: 100,
  date: "2026-09-14",
  status: "pending",
  createdBy: "finance",
};
test("expenditure requires an independent approver and cannot be paid twice", () => {
  assert.throws(
    () => expenseTransition(pending, "approve", "finance", true),
    /different person/,
  );
  assert.throws(
    () => expenseTransition(pending, "approve", "teacher", false),
    /principal/,
  );
  assert.throws(
    () => expenseTransition(pending, "pay", "finance", false),
    /Approve/,
  );
  const approved = expenseTransition(pending, "approve", "principal", true);
  const paid = expenseTransition(approved, "pay", "finance", false);
  assert.equal(paid.status, "paid");
  assert.ok(paid.paymentRef);
  assert.throws(() => expenseTransition(paid, "pay", "finance", false));
  assert.equal(
    pending.status,
    "pending",
    "domain transition does not mutate source",
  );
});
test("finance rejects invalid numbers and negative payroll", () => {
  for (const n of [-1, Infinity, NaN, 0.25, "100", 100000001])
    assert.throws(() => money(n));
  assert.equal(
    netPay({ basic: 60000, allowance: 5000, deduction: 2000 }),
    63000,
  );
  assert.throws(() => netPay({ basic: 100, allowance: 0, deduction: 101 }));
});
test("spreadsheet export neutralises formula injection and escapes quotes", () => {
  assert.equal(
    csv([["=HYPERLINK(x)", 'A "quoted" supplier']]),
    '"\'=HYPERLINK(x)","A ""quoted"" supplier"',
  );
  assert.match(csv([["  +1"]]), /'  \+1/);
});
test("appraisal rubric is weighted and evidence is required", () => {
  assert.equal(
    appraisalScore({
      planning: 5,
      practice: 5,
      feedback: 5,
      professional: 5,
      development: 5,
    }),
    100,
  );
  assert.equal(
    appraisalScore({
      planning: 3,
      practice: 3,
      feedback: 3,
      professional: 3,
      development: 3,
    }),
    60,
  );
  assert.throws(() =>
    appraisalScore({
      planning: 9,
      practice: 3,
      feedback: 3,
      professional: 3,
      development: 3,
    }),
  );
  assert.throws(() => validateReview("fine", "improve", "2026-10-15"));
  assert.throws(() =>
    validateReview(
      "Observed independent work in class.",
      "Bring three marked samples.",
      "2026-02-31",
    ),
  );
});
test("school stages stop at O Levels and keep Hifz separate", () => {
  assert.equal(
    stageFor({ name: "Montessori A", year: 0, section: "Montessori" }),
    "early-years",
  );
  for (let year = 1; year <= 6; year++)
    assert.equal(
      stageFor({ name: `Grade ${year}`, year, section: "Junior" }),
      "primary",
    );
  assert.equal(
    stageFor({ name: "Grade 7", year: 7, section: "Junior" }),
    "lower-secondary",
  );
  assert.equal(
    stageFor({ name: "O Level 3", year: 12, section: "Senior" }),
    "o-level",
  );
  assert.throws(() => stageFor({ name: "Hifz", year: 0, section: "Hifz" }));
  assert.match(STAGES["early-years"].assessment, /No timed exams/);
  assert.notEqual(
    lessonTemplate("primary", 1).objective,
    lessonTemplate("primary", 6).objective,
  );
});
