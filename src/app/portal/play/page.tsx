/**
 * Play & practise — the activity shelf for Montessori and primary.
 *
 * Students open their own; a guardian opens it for a ward and, in the early
 * years band, plays it alongside them, which is what "adult-guided" means in
 * the teaching pathway. Senior students never see this route.
 */
import Link from "next/link";
import { getViewer } from "@/lib/auth/viewer";
import { groqIsLive } from "@/lib/ai/groq";
import { activityQueue, learnerById, playLearners, playSummary, sessionsFor } from "@/lib/data/play";
import { shelvesForBand } from "@/content/play";
import { BANDS, PRACTICE_NOTE, STRANDS } from "@/lib/domain/play";
import { AiPill, Card, EmptyState, LinkButton, PageHeader, SectionTitle } from "@/components/ui/primitives";
import { SeatDenied } from "@/components/leadership/seat-guard";
import { ActivityCard } from "@/components/play/activity-card";
import { PlayHistory, PlaySummaryStats } from "@/components/play/play-history";
import { cn } from "@/lib/utils";

export default async function PlayPage({ searchParams }: { searchParams: Promise<{ child?: string }> }) {
  const viewer = await getViewer();
  if (viewer.role !== "student" && viewer.role !== "parent") return <SeatDenied home={viewer.home} />;

  const learners = playLearners(viewer);
  const { child } = await searchParams;
  const learner = learnerById(viewer, child);

  if (!learner) {
    return (
      <>
        <PageHeader eyebrow="Play & practise" title="Nothing to practise here yet" description="These activities are for Montessori and primary classes." />
        <EmptyState
          title="No early or primary learner on this seat"
          body="Older students practise through their subject spaces and past papers instead."
          action={
            <LinkButton href="/portal/learning" variant="soft">
              Go to My learning
            </LinkButton>
          }
        />
      </>
    );
  }

  const isParent = viewer.role === "parent";
  const band = BANDS[learner.band];
  const summary = playSummary(learner.student.id);
  const queue = activityQueue(learner);
  const playCounts = new Map(queue.map((q) => [q.activity.id, q.plays]));
  const shelves = shelvesForBand(learner.band);
  const href = (activityId: string) => `/portal/play/${activityId}${learners.length > 1 ? `?child=${learner.student.id}` : ""}`;

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Play & practise"
        title={isParent ? `Practise with ${learner.student.firstName}` : `Let's practise, ${learner.student.firstName}`}
        description={`${band.label} · ${learner.className}. Short activities, about ${band.minutes} minutes. ${PRACTICE_NOTE}`}
        actions={<AiPill live={groqIsLive()} />}
      />

      {learners.length > 1 ? (
        <div className="flex flex-wrap gap-2">
          {learners.map((option) => (
            <Link
              key={option.student.id}
              href={`/portal/play?child=${option.student.id}`}
              className={cn("btn btn-sm", option.student.id === learner.student.id ? "btn-primary" : "btn-outline")}
            >
              {option.student.firstName} · {option.className}
            </Link>
          ))}
        </div>
      ) : null}

      <PlaySummaryStats summary={summary} />

      {isParent || learner.band === "early" ? (
        <Card className="border-gold/30 bg-gold-soft/40">
          <p className="eyebrow-gold">For the grown-up</p>
          <p className="mt-1.5 max-w-prose text-sm leading-relaxed text-ink-2">{band.adultNote}</p>
        </Card>
      ) : null}

      {shelves.map((shelf) => (
        <section key={shelf.strand}>
          <SectionTitle title={STRANDS[shelf.strand].label} hint={STRANDS[shelf.strand].blurb} />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {shelf.activities.map((activity) => (
              <ActivityCard key={activity.id} activity={activity} href={href(activity.id)} plays={playCounts.get(activity.id) ?? 0} />
            ))}
          </div>
        </section>
      ))}

      <PlayHistory sessions={sessionsFor(learner.student.id).slice(0, 8)} heading={isParent ? `What ${learner.student.firstName} has practised` : "What you have practised"} />
    </div>
  );
}
