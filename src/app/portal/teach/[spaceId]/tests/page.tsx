import { ClipboardCheck, FileText, Send, Users } from "lucide-react";
import { PageHeader, SectionTitle, Stat } from "@/components/ui/primitives";
import { getViewer } from "@/lib/auth/viewer";
import { classById } from "@/lib/data/mock/people";
import { allocationsForTest, attemptsForTest, questionsOf, testsForSpace } from "@/lib/data/mock/tests";
import { maxMarksOf } from "@/lib/domain/assessment";
import { Denied, teacherSpace } from "@/components/teach/guard";
import { TestBuilder } from "@/components/assess/test-builder";
import { TestTable, type TestRow } from "@/components/assess/test-table";

export default async function TestsPage({ params }: { params: Promise<{ spaceId: string }> }) {
  const { spaceId } = await params;
  const viewer = await getViewer();
  const space = teacherSpace(viewer, spaceId);
  if (!space) return <Denied />;

  const className = classById.get(space.classId)?.name ?? space.classId;
  const base = `/portal/teach/${space.id}/tests`;
  const allocatedStudents = new Set<string>();
  let awaiting = 0;
  let published = 0;

  const rows: TestRow[] = testsForSpace(space.id).map((test) => {
    const allocations = allocationsForTest(test.id);
    const toReview = attemptsForTest(test.id).filter((a) => a.submittedAt && a.marking.some((m) => m.status === "ai-marked")).length;
    for (const a of allocations) allocatedStudents.add(a.studentId);
    awaiting += toReview;
    published += allocations.filter((a) => a.status === "published").length;
    return {
      id: test.id,
      href: `${base}/${test.id}`,
      title: test.title,
      mode: test.mode,
      questions: test.questionIds.length,
      maxMarks: maxMarksOf(questionsOf(test)),
      opensAt: test.opensAt,
      closesAt: test.closesAt,
      durationMin: test.durationMin,
      submitted: allocations.filter((a) => a.status === "submitted" || a.status === "published").length,
      allocated: allocations.length,
      awaiting: toReview,
    };
  });

  const topics = space.syllabus.map((t) => ({ code: t.code, title: t.title }));

  return (
    <>
      <PageHeader
        eyebrow={`${space.subject} · ${className}`}
        title="Tests"
        description={`${rows.length} ${rows.length === 1 ? "test" : "tests"} in this space · ${awaiting} ${awaiting === 1 ? "attempt" : "attempts"} awaiting review`}
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-6">
        <Stat label="Tests" value={rows.length} icon={<FileText size={18} />} tone="accent" />
        <Stat label="Students allocated" value={allocatedStudents.size} icon={<Users size={18} />} tone="info" />
        <Stat label="Awaiting review" value={awaiting} icon={<ClipboardCheck size={18} />} tone={awaiting ? "warn" : "neutral"} />
        <Stat label="Published results" value={published} icon={<Send size={18} />} tone="ok" />
      </div>

      <section>
        <SectionTitle title="Tests in this space" hint="Open a test for results, the question list and the review queue." />
        <TestTable rows={rows} />
      </section>

      <section>
        <TestBuilder spaceId={space.id} topics={topics} />
      </section>
    </>
  );
}
