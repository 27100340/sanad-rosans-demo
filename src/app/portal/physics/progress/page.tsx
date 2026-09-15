import Link from "next/link";
import { ClipboardList, FileStack, Percent, Target } from "lucide-react";
import { Card, Chip, EmptyState, PageHeader, SectionTitle, Stat } from "@/components/ui/primitives";
import { Denied, isLearner } from "@/components/teach/guard";
import { AccuracyTimeline, LevelBadge, LevelSplit, Recommendations, StrengthsAndWeaknesses, TopicAccuracyTable } from "@/components/physics/analytics-view";
import { getViewer } from "@/lib/auth/viewer";
import { studentById } from "@/lib/data/mock/people";
import { attemptsForStudent, studentAnalytics } from "@/lib/data/physics";
import { PAPER_CANON, pct, scoreTone } from "@/lib/domain/physics";
import { SYLLABUS_NAME } from "@/content/physics/topics";

const RECENT_LIMIT = 8;

export default async function PhysicsProgressPage() {
  const viewer = await getViewer();
  const student = isLearner(viewer) && viewer.studentId ? studentById.get(viewer.studentId) : undefined;
  if (!student) return <Denied />;

  const analytics = studentAnalytics(student.id);
  const attempts = attemptsForStudent(student.id);

  if (!attempts.length) {
    return (
      <>
        <PageHeader eyebrow="Physics" title="Your progress" description={`${SYLLABUS_NAME}. Sit a paper and this page fills in.`} />
        <EmptyState
          title="No sittings yet"
          body="Every paper you sit is marked question by question and shows up here, split by strand and by thinking level."
          action={
            <Link href="/portal/physics/assignments" className="btn-soft btn-sm">
              See what has been set
            </Link>
          }
        />
      </>
    );
  }

  return (
    <>
      <PageHeader
        eyebrow="Physics"
        title="Your progress"
        description={`${SYLLABUS_NAME}. Built from the ${analytics.totalAttempts} papers you have sat and the ${analytics.scoredQuestions} questions in them that were marked.`}
        actions={
          <Link href="/portal/physics/assignments" className="btn-outline btn-sm">
            <ClipboardList size={14} /> Papers set for you
          </Link>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-6">
        <Stat label="Overall accuracy" value={`${analytics.overallAccuracy}%`} trend="marks earned over marks available" icon={<Percent size={18} />} tone={scoreTone(analytics.overallAccuracy)} />
        <Stat label="Papers sat" value={analytics.totalAttempts} trend={`${analytics.papersSat} full past papers`} icon={<FileStack size={18} />} tone="accent" />
        <Stat label="Questions marked" value={analytics.scoredQuestions} icon={<ClipboardList size={18} />} tone="info" />
        <Stat label="Higher order" value={`${analytics.byLevel.HOT}%`} trend={`lower order ${analytics.byLevel.LOT}%`} icon={<Target size={18} />} tone={scoreTone(analytics.byLevel.HOT)} />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 lg:gap-6">
        <LevelBadge analytics={analytics} />
        <LevelSplit analytics={analytics} />
        <Recommendations items={analytics.recommendations} />
      </div>

      <section>
        <SectionTitle title="Strengths and weaknesses" hint="Strands you have attempted at least twice." />
        <StrengthsAndWeaknesses analytics={analytics} />
      </section>

      <section>
        <SectionTitle title="Every strand you have attempted" hint="Accuracy is marks earned over marks available." />
        <TopicAccuracyTable topics={analytics.byTopic} />
      </section>

      <AccuracyTimeline points={analytics.timeline} />

      <section>
        <SectionTitle title="Recent sittings" hint="Newest first." />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 lg:gap-6">
          {analytics.recentAttempts.slice(0, RECENT_LIMIT).map((attempt) => (
            <Card key={attempt.id} className="flex flex-col gap-2.5">
              <div className="flex flex-wrap items-center gap-1.5">
                <Chip tone={attempt.mode === "paper" ? "accent" : "info"}>{attempt.mode === "paper" ? "Past paper" : "Drill"}</Chip>
                {attempt.paperType !== "mixed" ? <Chip tone="neutral">{PAPER_CANON[attempt.paperType].short}</Chip> : null}
                <Chip tone={scoreTone(pct(attempt.score, attempt.total))}>
                  <span className="num">
                    {attempt.score}/{attempt.total}
                  </span>
                </Chip>
              </div>
              <p className="text-sm font-medium leading-6 text-ink">{attempt.ref ?? attempt.paperType}</p>
              <p className="num text-2xs text-ink-3">
                {new Date(attempt.ts).toISOString().slice(0, 10)} · {attempt.qCount} questions · {Math.round(attempt.durationSec / 60)} min
                {attempt.context.revealsUsed ? ` · ${attempt.context.revealsUsed} mark schemes revealed` : ""}
              </p>
            </Card>
          ))}
        </div>
      </section>
    </>
  );
}
