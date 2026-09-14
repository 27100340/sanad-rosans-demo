import { ClipboardCheck, Clock, Inbox, Percent } from "lucide-react";
import { canSeePrincipal, SeatDenied } from "@/components/leadership/seat-guard";
import { AssessmentBoard, type AssessmentTestRow, type MarkingBacklogRow } from "@/components/principal/assessment-board";
import { PageHeader, Stat } from "@/components/ui/primitives";
import { getViewer } from "@/lib/auth/viewer";
import { branchName, type BranchId } from "@/lib/config/school";
import { classById, teacherById } from "@/lib/data/mock/people";
import { allocationsForTest, attemptsForTest, testsForSpace } from "@/lib/data/mock/tests";
import { listSpaces } from "@/lib/data/repo";
import type { Attempt } from "@/lib/domain/assessment";
import { pctOf } from "@/lib/domain/assessment";
import { daysAgoISO, todayISO } from "@/lib/utils";

const DEMO_BRANCH: BranchId = "gulberg";
const WEEK_DAYS = 7;

function awaitingReview(a: Attempt): boolean {
  return a.marking.some((m) => m.status === "ai-marked");
}

function isPublished(a: Attempt): boolean {
  return a.submittedAt !== undefined && a.marking.length > 0 && !awaitingReview(a);
}

function mean(values: number[]): number | null {
  return values.length ? Math.round(values.reduce((s, n) => s + n, 0) / values.length) : null;
}

interface Board {
  tests: AssessmentTestRow[];
  backlog: MarkingBacklogRow[];
  open: number;
  thisWeek: number;
  awaiting: number;
  meanPct: number | null;
}

function buildBoard(branchId: BranchId): Board {
  const today = todayISO();
  const weekStart = daysAgoISO(WEEK_DAYS - 1);
  const tests: AssessmentTestRow[] = [];
  const perTeacher = new Map<string, MarkingBacklogRow>();
  const testsPerTeacher = new Map<string, Set<string>>();
  const publishedPcts: number[] = [];
  let open = 0;
  let thisWeek = 0;
  let awaiting = 0;

  for (const space of listSpaces(branchId)) {
    const teacher = teacherById.get(space.teacherId);
    for (const test of testsForSpace(space.id)) {
      const allocations = allocationsForTest(test.id);
      const attempts = attemptsForTest(test.id).filter((a) => a.submittedAt !== undefined);
      const waiting = attempts.filter(awaitingReview);
      const published = attempts.filter(isPublished);
      const pcts = published.map((a) => pctOf(a.total ?? 0, a.maxMarks));
      publishedPcts.push(...pcts);
      if (test.closesAt >= today) open += 1;
      thisWeek += attempts.filter((a) => (a.submittedAt ?? "").slice(0, 10) >= weekStart).length;
      awaiting += waiting.length;

      tests.push({
        id: test.id,
        title: test.title,
        subject: space.subject,
        className: classById.get(space.classId)?.name ?? space.classId,
        teacher: teacher?.name ?? test.createdBy,
        mode: test.mode,
        opensAt: test.opensAt,
        closesAt: test.closesAt,
        allocated: allocations.length,
        submitted: allocations.filter((a) => a.status === "submitted" || a.status === "published").length,
        awaiting: waiting.length,
        meanPct: mean(pcts),
      });

      if (!teacher || !waiting.length) continue;
      const row = perTeacher.get(teacher.id) ?? { teacherId: teacher.id, name: teacher.name, tone: teacher.avatarTone ?? "accent", subjects: teacher.subjects, awaiting: 0, tests: 0, reviewed: 0, total: 0 };
      const testIds = testsPerTeacher.get(teacher.id) ?? new Set<string>();
      testIds.add(test.id);
      row.awaiting += waiting.length;
      row.reviewed += attempts.length - waiting.length;
      row.total += attempts.length;
      row.tests = testIds.size;
      perTeacher.set(teacher.id, row);
      testsPerTeacher.set(teacher.id, testIds);
    }
  }

  return { tests, backlog: [...perTeacher.values()], open, thisWeek, awaiting, meanPct: mean(publishedPcts) };
}

export default async function PrincipalAssessmentsPage() {
  const viewer = await getViewer();
  if (!canSeePrincipal(viewer)) return <SeatDenied home={viewer.home} />;
  const branchId = viewer.branchId ?? DEMO_BRANCH;
  const board = buildBoard(branchId);
  const teachersWaiting = board.backlog.length;

  return (
    <div className="space-y-8 sm:space-y-10">
      <PageHeader
        eyebrow={`Principal · ${branchName(branchId)}`}
        title="Assessments"
        description={`${board.tests.length} test${board.tests.length === 1 ? "" : "s"} set across the branch, ${board.awaiting} attempt${board.awaiting === 1 ? "" : "s"} waiting on ${teachersWaiting} teacher${teachersWaiting === 1 ? "" : "s"}.`}
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Open tests" value={board.open} tone="accent" icon={<Clock size={18} />} trend="Closing today or later" />
        <Stat label="Submissions this week" value={board.thisWeek} tone="info" icon={<Inbox size={18} />} trend={`Last ${WEEK_DAYS} days`} />
        <Stat label="Awaiting teacher review" value={board.awaiting} tone={board.awaiting > 0 ? "warn" : "ok"} icon={<ClipboardCheck size={18} />} trend="AI-marked, not yet approved" />
        <Stat label="Average score" value={board.meanPct === null ? "—" : `${board.meanPct}%`} tone="ok" icon={<Percent size={18} />} trend="Across published attempts" />
      </div>
      <AssessmentBoard tests={board.tests} backlog={board.backlog} />
    </div>
  );
}
