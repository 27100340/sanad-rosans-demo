import { test } from "node:test";
import assert from "node:assert/strict";
import { attendancePercent, nextStatus, summarise, validateMark, ATTENDANCE_STATUSES } from "../src/lib/domain/attendance.ts";
import { applyEvents, newSession, requestUnlock, resumeSession, unlockSession, type ProctorEvent } from "../src/lib/domain/proctor.ts";

test("attendance percent drops excused, leave and exempt from the denominator", () => {
  assert.equal(attendancePercent(["present", "late", "absent", "excused", "leave", "exempt"]), 67);
  assert.equal(attendancePercent(["online", "present"]), 100);
  assert.equal(attendancePercent(["excused"]), null);
});

test("status cycle follows the declared order and wraps", () => {
  assert.equal(nextStatus("present"), "late");
  assert.equal(nextStatus(ATTENDANCE_STATUSES[ATTENDANCE_STATUSES.length - 1]), "present");
});

test("an exemption needs an official reason; leave does not", () => {
  assert.match(validateMark("exempt", "  ") ?? "", /reason/i);
  assert.equal(validateMark("exempt", "Medical appointment"), null);
  assert.equal(validateMark("leave", ""), null);
  assert.ok(validateMark("holiday", ""));
});

test("summarise counts every status", () => {
  const s = summarise([{ status: "present" }, { status: "present" }, { status: "absent" }]);
  assert.equal(s.present, 2);
  assert.equal(s.absent, 1);
  assert.equal(s.exempt, 0);
});

const ev = (terminal: boolean, type: ProctorEvent["type"] = "hidden"): ProctorEvent => ({ type, reason: "test", terminal, at: 1, source: "guard" });

test("a terminal event locks a strict session and cancels a standard one", () => {
  const strict = newSession({ attemptId: "a", studentId: "s", testId: "t", mode: "strict", cameraConsent: true }, 0);
  assert.equal(applyEvents(strict, [ev(true)], 5).status, "locked");
  const standard = newSession({ attemptId: "b", studentId: "s", testId: "t", mode: "standard", cameraConsent: false }, 0);
  assert.equal(applyEvents(standard, [ev(true)], 5).status, "cancelled");
  const off = newSession({ attemptId: "c", studentId: "s", testId: "t", mode: "off", cameraConsent: false }, 0);
  assert.equal(applyEvents(off, [ev(true)], 5).status, "active");
});

test("locked sessions freeze until unlocked, then resume fresh", () => {
  let s = applyEvents(newSession({ attemptId: "a", studentId: "s", testId: "t", mode: "strict", cameraConsent: true }, 0), [ev(false, "paste"), ev(true)], 5);
  assert.equal(s.events.length, 2);
  assert.equal(applyEvents(s, [ev(false)], 6).events.length, 2);
  assert.equal(unlockSession(s, "teacher", "ok", 7)?.status, "unlocked");
  assert.equal(requestUnlock(s, "I dropped my phone", 7)?.unlockRequest?.note, "I dropped my phone");
  s = resumeSession(unlockSession(s, "teacher", "ok", 7)!, 8);
  assert.equal(s.status, "active");
  assert.equal(s.events.length, 0);
});
