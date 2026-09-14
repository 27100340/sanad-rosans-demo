import { Award, CheckCircle2, Hourglass, ListChecks } from "lucide-react";
import { PageHeader, Stat } from "@/components/ui/primitives";
import { getViewer } from "@/lib/auth/viewer";
import { studentById } from "@/lib/data/mock/people";
import { spaceById } from "@/lib/data/mock/spaces";
import { allocationsForStudent, attemptById, testById } from "@/lib/data/mock/tests";
import { pctOf } from "@/lib/domain/assessment";
import type { AllocationStatus } from "@/lib/domain/assessment";
import { todayISO } from "@/lib/utils";
import { Denied, isLearner } from "@/components/teach/guard";
import { TestList, type TestRow } from "@/components/assess/test-list";

const ORDER: Record<AllocationStatus, number> = { "in-progress": 0, "not-started": 1, submitted: 2, published: 3 };

function rowsFor(studentId: string): TestRow[] {
  return allocationsForStudent(studentId)
    .flatMap((a): TestRow[] => {
      const test = testById.get(a.testId);
      if (!test) return [];
      const attempt = a.attemptId ? attemptById.get(a.attemptId) : undefined;
      return [
        {
          testId: test.id,
          title: test.title,
          subject: spaceById.get(test.spaceId)?.subject ?? "",
          mode: test.mode,
          durationMin: test.durationMin,
          opensAt: test.opensAt,
          closesAt: test.closesAt,
          attemptsAllowed: test.attemptsAllowed,
          status: a.status,
          attemptId: a.attemptId,
          total: attempt?.total,
          maxMarks: attempt?.maxMarks,
        },
      ];
    })
    .sort((x, y) => ORDER[x.status] - ORDER[y.status] || x.closesAt.localeCompare(y.closesAt));
}

export default async function TestsPage() {
  const viewer = await getViewer();
  const student = isLearner(viewer) && viewer.studentId ? studentById.get(viewer.studentId) : undefined;
  if (!student) return <Denied />;

  const rows = rowsFor(student.id);
  const today = todayISO();
  const toDo = rows.filter((r) => (r.status === "not-started" || r.status === "in-progress") && r.closesAt >= today).length;
  const awaiting = rows.filter((r) => r.status === "submitted").length;
  const marked = rows.filter((r) => r.status === "published").length;
  const best = rows.filter((r) => r.status === "published" && r.total !== undefined && r.maxMarks).map((r) => pctOf(r.total ?? 0, r.maxMarks ?? 0));
  const bestPct = best.length ? Math.max(...best) : null;

  return (
    <>
      <PageHeader eyebrow="Tests" title="Your tests" description="Quizzes and timed tests set by your teachers." />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-6">
        <Stat label="To do" value={toDo} trend="open right now" icon={<ListChecks size={18} />} tone={toDo ? "warn" : "ok"} />
        <Stat label="Awaiting review" value={awaiting} trend="with your teacher" icon={<Hourglass size={18} />} tone="info" />
        <Stat label="Marked" value={marked} trend="results published" icon={<CheckCircle2 size={18} />} tone="ok" />
        {bestPct !== null ? <Stat label="Best recent" value={`${bestPct}%`} trend="across marked tests" icon={<Award size={18} />} tone="accent" /> : null}
      </div>

      <TestList rows={rows} />
    </>
  );
}
