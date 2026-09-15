/**
 * What this child has been practising. Shown to the child as a gentle record
 * and to a guardian as the answer to "what did they actually do?".
 *
 * Deliberately not a mark book: stars and a phrase, never a percentage, and
 * with the practice-only note attached wherever it appears.
 */
import { Chip, EmptyState, Stat } from "@/components/ui/primitives";
import { activityById } from "@/content/play";
import type { PlaySummary } from "@/lib/data/play";
import { PRACTICE_NOTE, resultLabel, starsFor, STRANDS, type PlaySession } from "@/lib/domain/play";
import { Stars } from "./shared";
import { STRAND_TONE } from "./activity-card";
import { cn } from "@/lib/utils";

function when(at: string): string {
  const date = new Date(at);
  return date.toLocaleDateString("en-PK", { weekday: "short", day: "numeric", month: "short" });
}

export function PlaySummaryStats({ summary }: { summary: PlaySummary }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <Stat label="Activities played" value={summary.plays} />
      <Stat label="Stars collected" value={summary.stars} tone="gold" />
      <Stat label="Subjects touched" value={`${summary.strandsTouched} of ${Object.keys(STRANDS).length}`} />
      <Stat label="Days in a row" value={summary.dayStreak} trend={summary.dayStreak > 0 ? "Keep it going" : "Play today to start"} />
    </div>
  );
}

export function PlayHistory({ sessions, heading = "Recently practised" }: { sessions: PlaySession[]; heading?: string }) {
  if (sessions.length === 0) {
    return <EmptyState title="Nothing practised yet" body="Pick any activity above. Five minutes is a full session at this age." />;
  }
  return (
    <div className="space-y-3">
      <div className="flex items-end justify-between gap-3">
        <h2 className="text-base font-semibold text-ink">{heading}</h2>
        <p className="text-2xs text-ink-3">{PRACTICE_NOTE}</p>
      </div>
      <ul className="card divide-y divide-line/70">
        {sessions.map((session) => {
          const activity = activityById.get(session.activityId);
          if (!activity) return null;
          const stars = starsFor(session.correct, session.total);
          return (
            <li key={session.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-3.5">
              <div className="min-w-0 flex-1">
                <p className={cn("truncate text-sm font-medium text-ink", activity.script === "ur" && "urdu")}>{activity.title}</p>
                <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-2xs text-ink-3">
                  <span>{when(session.at)}</span>
                  <span aria-hidden>·</span>
                  <span>{resultLabel(stars)}</span>
                  {session.withAdult ? (
                    <>
                      <span aria-hidden>·</span>
                      <span>With an adult</span>
                    </>
                  ) : null}
                </p>
              </div>
              <Chip tone={STRAND_TONE[activity.strand]}>{STRANDS[activity.strand].label}</Chip>
              <Stars count={stars} size="sm" />
            </li>
          );
        })}
      </ul>
    </div>
  );
}
