import { Chip, Progress } from "@/components/ui/primitives";
import type { SubjectSpace } from "@/lib/domain/types";
import { masteryTone } from "./helpers";

export function SyllabusMap({ space }: { space: SubjectSpace }) {
  const mastery = new Map(space.masteryByTopic.map((m) => [m.code, m.classAvg]));
  const unlocked = new Set(space.tutorRules.allowedTopics);
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {space.syllabus.map((topic) => {
        const avg = mastery.get(topic.code);
        return (
          <div key={topic.code} className="card p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="num text-2xs font-semibold uppercase tracking-wide text-ink-3">{topic.code}</p>
                <h3 className="mt-0.5 text-sm font-semibold text-ink">{topic.title}</h3>
              </div>
              {unlocked.has(topic.code) ? <Chip tone="accent">Tutor unlocked</Chip> : <Chip tone="neutral">Locked</Chip>}
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {topic.subtopics.map((s) => (
                <span key={s} className="rounded-md bg-surface-2 px-2 py-0.5 text-2xs text-ink-2">
                  {s}
                </span>
              ))}
            </div>
            {avg !== undefined ? (
              <div className="mt-4">
                <div className="mb-1.5 flex items-center justify-between text-xs">
                  <span className="text-ink-3">Class mastery</span>
                  <span className="num font-medium text-ink">{avg}%</span>
                </div>
                <Progress value={avg} tone={masteryTone(avg)} />
              </div>
            ) : (
              <p className="mt-4 text-xs text-ink-3">Not yet assessed</p>
            )}
          </div>
        );
      })}
    </div>
  );
}
