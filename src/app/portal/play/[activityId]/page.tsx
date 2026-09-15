/**
 * One activity, playing. The round itself is fetched by the runner because it
 * may be generated fresh; everything around it renders on the server.
 */
import { getViewer } from "@/lib/auth/viewer";
import { activityById } from "@/content/play";
import { learnerById, playLearners, sessionsForActivity } from "@/lib/data/play";
import { BANDS, PRACTICE_NOTE, STRANDS } from "@/lib/domain/play";
import { Card, Chip, EmptyState, LinkButton, PageHeader } from "@/components/ui/primitives";
import { SeatDenied } from "@/components/leadership/seat-guard";
import { PlayRunner } from "@/components/play/play-runner";
import { PlayHistory } from "@/components/play/play-history";
import { STRAND_TONE } from "@/components/play/activity-card";
import { cn } from "@/lib/utils";

export default async function PlayActivityPage({ params, searchParams }: { params: Promise<{ activityId: string }>; searchParams: Promise<{ child?: string }> }) {
  const viewer = await getViewer();
  if (viewer.role !== "student" && viewer.role !== "parent") return <SeatDenied home={viewer.home} />;

  const [{ activityId }, { child }] = await Promise.all([params, searchParams]);
  const learner = learnerById(viewer, child);
  const activity = activityById.get(activityId);
  const learners = playLearners(viewer);
  const shelfHref = `/portal/play${learner && learners.length > 1 ? `?child=${learner.student.id}` : ""}`;

  if (!learner || !activity || activity.band !== learner.band) {
    return (
      <>
        <PageHeader eyebrow="Play & practise" title="Not available here" />
        <EmptyState
          title="This activity is not for this learner's stage"
          body="Every activity is written for one band, so the shelf only ever shows the right ones."
          action={
            <LinkButton href="/portal/play" variant="soft">
              Back to activities
            </LinkButton>
          }
        />
      </>
    );
  }

  const isParent = viewer.role === "parent";
  const history = sessionsForActivity(learner.student.id, activity.id).slice(0, 5);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={<span className="inline-flex items-center gap-2">Play & practise · {BANDS[learner.band].label}</span>}
        title={<span className={cn(activity.script === "ur" && "urdu")}>{activity.title}</span>}
        description={`${activity.blurb} ${PRACTICE_NOTE}`}
        actions={
          <>
            <Chip tone={STRAND_TONE[activity.strand]}>{STRANDS[activity.strand].label}</Chip>
            <LinkButton href={shelfHref} variant="ghost">
              Back to activities
            </LinkButton>
          </>
        }
      />

      {isParent || learner.band === "early" ? (
        <Card className="border-gold/30 bg-gold-soft/40">
          <p className="eyebrow-gold">For the grown-up</p>
          <p className="mt-1.5 max-w-prose text-sm leading-relaxed text-ink-2">{activity.adultNote}</p>
        </Card>
      ) : null}

      <PlayRunner activity={{ id: activity.id, title: activity.title, script: activity.script }} studentId={learner.student.id} playAgainHref={shelfHref} />

      {history.length > 0 ? <PlayHistory sessions={history} heading="Earlier tries at this one" /> : null}
    </div>
  );
}
