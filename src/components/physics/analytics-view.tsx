import { Chip, Progress } from "@/components/ui/primitives";
import type { Analytics, Misconception, TopicStat } from "@/lib/domain/physics";
import { LEVEL_LABEL, RETEACH_THRESHOLD, THINKING_LEVELS, misconceptionTitle, pct, scoreTone } from "@/lib/domain/physics";
import { topicGroup } from "@/content/physics/topics";
import { cn } from "@/lib/utils";

const RANKING_MAX = 10;

/** The reference's 1-10 ranking, which blends accuracy with how much has been attempted. */
export function LevelBadge({ analytics }: { analytics: Analytics }) {
  return (
    <div className="card flex flex-col gap-3 p-5">
      <div className="flex items-baseline justify-between gap-3">
        <div>
          <p className="eyebrow">Ranking</p>
          <p className="mt-1 text-lg font-semibold leading-none text-ink">{analytics.levelLabel}</p>
        </div>
        <p className="num text-3xl font-semibold leading-none text-accent">
          {analytics.level}
          <span className="text-base text-ink-3">/{RANKING_MAX}</span>
        </p>
      </div>
      <div className="flex gap-1">
        {Array.from({ length: RANKING_MAX }, (_unused, i) => (
          <span key={i} className={cn("h-1.5 flex-1 rounded-full", i < analytics.level ? "bg-accent" : "bg-surface-3")} />
        ))}
      </div>
      <p className="text-xs leading-5 text-ink-3">{analytics.nextLevelHint}</p>
    </div>
  );
}

/** Accuracy split by thinking level. The gap between the two is the whole point. */
export function LevelSplit({ analytics }: { analytics: Analytics }) {
  return (
    <div className="card space-y-3 p-5">
      <p className="eyebrow">By thinking level</p>
      {THINKING_LEVELS.map((level) => (
        <div key={level}>
          <div className="mb-1 flex items-baseline justify-between gap-2">
            <span className="text-xs text-ink-2">
              {level} · {LEVEL_LABEL[level]}
            </span>
            <span className="num text-xs font-medium text-ink">{analytics.byLevel[level]}%</span>
          </div>
          <Progress value={analytics.byLevel[level]} tone={scoreTone(analytics.byLevel[level])} />
        </div>
      ))}
      <p className="text-2xs leading-5 text-ink-3">
        Lower-order questions test whether the definition is known. Higher-order questions put the marks in the reasoning, and they are where papers are won.
      </p>
    </div>
  );
}

/** Every strand attempted, strongest first, with the marks behind each figure. */
export function TopicAccuracyTable({ topics, caption }: { topics: TopicStat[]; caption?: string }) {
  return (
    <div className="card overflow-x-auto">
      <table className="table min-w-[34rem]">
        <thead>
          <tr>
            <th>Strand</th>
            <th className="text-right">Questions</th>
            <th className="text-right">Marks</th>
            <th className="w-36">Accuracy</th>
          </tr>
        </thead>
        <tbody>
          {topics.map((row) => (
            <tr key={row.topic}>
              <td>
                <span className="font-medium text-ink">{row.topic}</span>
                <span className="num ml-2 text-2xs text-ink-3">{topicGroup(row.topic)}</span>
              </td>
              <td className="num text-right text-ink-2">{row.attempted}</td>
              <td className="num text-right text-ink-2">
                {row.earned}/{row.available}
              </td>
              <td>
                <div className="flex items-center gap-2">
                  <Progress value={row.accuracy} tone={scoreTone(row.accuracy)} className="w-16" />
                  <span className={cn("num text-xs font-medium", row.accuracy < RETEACH_THRESHOLD ? "text-danger" : "text-ink")}>{row.accuracy}%</span>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {caption ? <p className="border-t border-line px-3 py-2 text-2xs leading-5 text-ink-3">{caption}</p> : null}
    </div>
  );
}

/** One misconception, with the correction a teacher would give at the board. */
export function MisconceptionCard({ misconception, bankCount }: { misconception: Misconception; bankCount: number }) {
  return (
    <div className="card flex flex-col gap-2.5 p-5">
      <div className="flex flex-wrap items-center gap-1.5">
        <Chip tone="accent">{misconception.topic}</Chip>
        <Chip tone={misconception.count >= 10 ? "danger" : "warn"}>
          <span className="num">{misconception.count}</span> students
        </Chip>
        {bankCount ? (
          <Chip tone="neutral">
            <span className="num">{bankCount}</span> bank question{bankCount === 1 ? "" : "s"}
          </Chip>
        ) : null}
      </div>
      <p className="text-sm font-semibold leading-6 text-ink">{misconceptionTitle(misconception.tag)}</p>
      <p className="rounded-lg bg-surface-2 px-3 py-2 text-xs italic leading-5 text-ink-3">{misconception.example}</p>
      <p className="text-xs leading-6 text-ink-2">{misconception.correction}</p>
    </div>
  );
}

/** What the analytics say to do next. Ported from the reference's recommendation rules. */
export function Recommendations({ items }: { items: string[] }) {
  return (
    <div className="card space-y-2 p-5">
      <p className="eyebrow">What to do next</p>
      <ul className="space-y-2">
        {items.map((item, i) => (
          <li key={i} className="flex gap-2.5">
            <span className="num mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-md bg-accent-soft text-2xs font-semibold text-accent">{i + 1}</span>
            <span className="min-w-0 text-sm leading-6 text-ink-2">{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Accuracy over the term, one bar per sitting, oldest on the left. */
export function AccuracyTimeline({ points }: { points: { ts: number; accuracy: number; label: string }[] }) {
  if (!points.length) return null;
  return (
    <div className="card space-y-3 p-5">
      <p className="eyebrow">Every sitting this term</p>
      <div className="flex h-24 items-end gap-1.5">
        {points.map((point, i) => (
          <div
            key={`${point.ts}-${i}`}
            title={`${point.label}: ${point.accuracy}%`}
            className={cn(
              "min-w-1.5 flex-1 rounded-t",
              point.accuracy >= 75 ? "bg-ok" : point.accuracy >= RETEACH_THRESHOLD ? "bg-warn" : "bg-danger",
            )}
            style={{ height: `${Math.max(4, point.accuracy)}%` }}
          />
        ))}
      </div>
      <div className="flex justify-between text-2xs text-ink-3">
        <span>{new Date(points[0].ts).toISOString().slice(0, 10)}</span>
        <span>{new Date(points[points.length - 1].ts).toISOString().slice(0, 10)}</span>
      </div>
    </div>
  );
}

/** Strongest and weakest strands side by side, which is how a teacher reads a class. */
export function StrengthsAndWeaknesses({ analytics }: { analytics: Analytics }) {
  const columns: { title: string; rows: TopicStat[]; empty: string }[] = [
    { title: "Strongest strands", rows: analytics.strengths, empty: "Not enough attempts yet to call a strand strong." },
    { title: "Weakest strands", rows: analytics.weaknesses, empty: "Not enough attempts yet to call a strand weak." },
  ];
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:gap-6">
      {columns.map((column) => (
        <div key={column.title} className="card space-y-2.5 p-5">
          <p className="eyebrow">{column.title}</p>
          {column.rows.length ? (
            column.rows.map((row) => (
              <div key={row.topic} className="flex items-center justify-between gap-3">
                <span className="min-w-0 truncate text-xs text-ink-2">{row.topic}</span>
                <div className="flex shrink-0 items-center gap-2">
                  <span className="num text-2xs text-ink-3">{pct(row.earned, row.available)}%</span>
                  <Progress value={row.accuracy} tone={scoreTone(row.accuracy)} className="w-14" />
                </div>
              </div>
            ))
          ) : (
            <p className="text-xs text-ink-3">{column.empty}</p>
          )}
        </div>
      ))}
    </div>
  );
}
