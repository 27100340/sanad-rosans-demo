import Link from "next/link";
import { AlertTriangle, FlaskConical, GraduationCap, ShieldCheck, TrendingDown } from "lucide-react";
import { Avatar, Card, Chip, EmptyState, PageHeader, Progress, SectionTitle, Stat } from "@/components/ui/primitives";
import { Denied } from "@/components/teach/guard";
import { AccuracyTimeline, LevelSplit, MisconceptionCard, Recommendations, StrengthsAndWeaknesses, TopicAccuracyTable } from "@/components/physics/analytics-view";
import { getViewer } from "@/lib/auth/viewer";
import { classById } from "@/lib/data/mock/people";
import {
  PHYSICS_CLASS_ID,
  PHYSICS_GROUP_NAME,
  PHYSICS_TERM,
  classAnalytics,
  classAttempts,
  classStandings,
  misconceptions,
  questionsForMisconception,
  reviewQueue,
} from "@/lib/data/physics";
import { SYLLABUS_NAME } from "@/content/physics/topics";
import { RETEACH_THRESHOLD, reteachList, scoreTone } from "@/lib/domain/physics";

const MISCONCEPTION_LIMIT = 6;

export default async function PhysicsOverviewPage() {
  const viewer = await getViewer();
  if (viewer.role !== "teacher") return <Denied />;

  const analytics = classAnalytics();
  const attempts = classAttempts();
  const standings = classStandings();
  const reteach = reteachList(analytics.byTopic);
  const tags = misconceptions();
  const className = classById.get(PHYSICS_CLASS_ID)?.name ?? PHYSICS_CLASS_ID;
  const pending = reviewQueue().length;

  return (
    <>
      <PageHeader
        eyebrow="Teacher · Physics"
        title={`${PHYSICS_GROUP_NAME} · ${className}`}
        description={`${SYLLABUS_NAME}, ${PHYSICS_TERM}. Every figure here is computed from the ${attempts.length} sittings this class has actually submitted — no standing figure is typed in.`}
        actions={
          <>
            <Link href="/portal/physics/exam-lab" className="btn-outline btn-sm">
              <FlaskConical size={14} /> Exam Lab
            </Link>
            <Link href="/portal/physics/review" className="btn-soft btn-sm">
              <ShieldCheck size={14} /> Review queue
              {pending ? <span className="num">{pending}</span> : null}
            </Link>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-6">
        <Stat
          label="Class accuracy"
          value={`${analytics.overallAccuracy}%`}
          trend={`${analytics.scoredQuestions} questions marked`}
          icon={<GraduationCap size={18} />}
          tone={scoreTone(analytics.overallAccuracy)}
        />
        <Stat label="Strands to reteach" value={reteach.length} trend={`below ${RETEACH_THRESHOLD}%`} icon={<AlertTriangle size={18} />} tone={reteach.length ? "warn" : "ok"} />
        <Stat label="Misconceptions logged" value={tags.reduce((sum, m) => sum + m.count, 0)} trend={`${tags.length} distinct`} icon={<TrendingDown size={18} />} tone="danger" />
        <Stat label="Waiting on review" value={pending} trend="studio answers" icon={<ShieldCheck size={18} />} tone={pending ? "warn" : "ok"} />
      </div>

      <section>
        <SectionTitle title="Where the marks go" hint="The same cohort, marked two ways. The gap between LOT and HOT is what a revision plan has to close." />
        <div className="grid gap-4 md:grid-cols-2 lg:gap-6">
          <LevelSplit analytics={analytics} />
          <Recommendations items={analytics.recommendations} />
        </div>
      </section>

      <section>
        <SectionTitle title="Strengths and weaknesses" hint="Strands with at least two attempts across the class." />
        <StrengthsAndWeaknesses analytics={analytics} />
      </section>

      <section>
        <SectionTitle title="Every strand attempted" hint="Accuracy is marks earned over marks available, not questions right over questions asked." />
        <TopicAccuracyTable
          topics={analytics.byTopic}
          caption={`${analytics.byTopic.length} strands attempted across ${analytics.totalAttempts} sittings. Strands not listed have not been set yet this term.`}
        />
      </section>

      <section>
        <SectionTitle title="What to reteach" hint={`Strands averaging below ${RETEACH_THRESHOLD}%, weakest first, with the misconception driving each one.`} />
        {reteach.length ? (
          <div className="grid gap-4 md:grid-cols-2 lg:gap-6">
            {reteach.slice(0, MISCONCEPTION_LIMIT).map((topic) => {
              const driver = tags.filter((m) => m.topic === topic.topic).sort((a, b) => b.count - a.count)[0];
              return (
                <Card key={topic.topic} className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-ink">{topic.topic}</p>
                    <Chip tone={scoreTone(topic.accuracy)}>{topic.accuracy}%</Chip>
                  </div>
                  <Progress value={topic.accuracy} tone={scoreTone(topic.accuracy)} />
                  <p className="num text-2xs text-ink-3">
                    {topic.earned} of {topic.available} marks across {topic.attempted} questions
                  </p>
                  <p className="text-xs leading-6 text-ink-2">
                    {driver ? driver.correction : "No single misconception dominates here; reteach the method end to end and reassess with HOT questions."}
                  </p>
                </Card>
              );
            })}
          </div>
        ) : (
          <EmptyState title="Nothing below the threshold" body={`Every attempted strand is averaging at or above ${RETEACH_THRESHOLD}%.`} />
        )}
      </section>

      <section>
        <SectionTitle title="Common misconceptions" hint="From this term's marking. The authored bank already holds HOT questions that expose each one." />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 lg:gap-6">
          {tags.slice(0, MISCONCEPTION_LIMIT).map((m) => (
            <MisconceptionCard key={m.tag} misconception={m} bankCount={questionsForMisconception(m.tag).length} />
          ))}
        </div>
      </section>

      <section>
        <SectionTitle title="Students" hint="Weakest first. The strand named is where each one loses most." />
        <div className="card overflow-x-auto">
          <table className="table min-w-[34rem]">
            <thead>
              <tr>
                <th>Student</th>
                <th className="text-right">Sittings</th>
                <th className="text-right">Accuracy</th>
                <th className="text-right">HOT</th>
                <th>Weakest strand</th>
                <th className="text-right">Level</th>
              </tr>
            </thead>
            <tbody>
              {standings.map((row) => (
                <tr key={row.student.id}>
                  <td>
                    <div className="flex items-center gap-2.5">
                      <Avatar name={row.student.name} size="sm" tone={row.accuracy < RETEACH_THRESHOLD ? "warn" : "accent"} />
                      <span className="font-medium text-ink">{row.student.name}</span>
                    </div>
                  </td>
                  <td className="num text-right text-ink-2">{row.attempts}</td>
                  <td className="num text-right">
                    <span className={row.accuracy < RETEACH_THRESHOLD ? "text-danger" : "text-ink"}>{row.accuracy}%</span>
                  </td>
                  <td className="num text-right">
                    <span className={row.byLevel.HOT < RETEACH_THRESHOLD ? "text-danger" : "text-ink-2"}>{row.byLevel.HOT}%</span>
                  </td>
                  <td className="text-ink-2">{row.weakest ?? "—"}</td>
                  <td className="num text-right text-ink-2">
                    {row.level} · {row.levelLabel}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <AccuracyTimeline points={analytics.timeline} />
    </>
  );
}
