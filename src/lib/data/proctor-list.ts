/**
 * One listing of proctor sessions for a teacher, shared by the console page
 * and the proctor API route so both agree on scope and shape. A teacher sees
 * only the sessions of tests that belong to their own spaces.
 */
import { studentById } from "./mock/people";
import { spacesForTeacher } from "./repo";
import { sessionsForTests } from "./mock/proctor";
import { testsForSpace, testById } from "./mock/tests";
import { spaceById } from "./mock/spaces";
import { summariseEvents, type GuardMode, type ProctorStatus } from "@/lib/domain/proctor";

export interface ProctorRow {
  attemptId: string;
  testId: string;
  testTitle: string;
  spaceId: string;
  subject: string;
  studentId: string;
  studentName: string;
  mode: GuardMode;
  status: ProctorStatus;
  lockedReason: string | null;
  startedAt: number;
  endedAt: number | null;
  events: ReturnType<typeof summariseEvents>;
  unlockRequest: { at: number; note: string } | null;
  unlock: { by: string; at: number; note: string } | null;
  snapshots: { id: string; at: number; reason: string }[];
}

/** Newest session first. Sessions whose test has since been removed are dropped. */
export function proctorRowsForTeacher(teacherId: string): ProctorRow[] {
  const testIds = spacesForTeacher(teacherId).flatMap((space) => testsForSpace(space.id).map((t) => t.id));
  return sessionsForTests(testIds).flatMap((s): ProctorRow[] => {
    const test = testById.get(s.testId);
    if (!test) return [];
    const space = spaceById.get(test.spaceId);
    return [
      {
        attemptId: s.attemptId,
        testId: s.testId,
        testTitle: test.title,
        spaceId: test.spaceId,
        subject: space?.subject ?? test.spaceId,
        studentId: s.studentId,
        studentName: studentById.get(s.studentId)?.name ?? s.studentId,
        mode: s.mode,
        status: s.status,
        lockedReason: s.lockedReason,
        startedAt: s.startedAt,
        endedAt: s.endedAt,
        events: summariseEvents(s.events),
        unlockRequest: s.unlockRequest,
        unlock: s.unlock,
        snapshots: s.snapshots.map((x) => ({ id: x.id, at: x.at, reason: x.reason })),
      },
    ];
  });
}
