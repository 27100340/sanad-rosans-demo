import { Card, Chip, SectionTitle, type Tone } from "@/components/ui/primitives";
import { relativeDay } from "@/components/leadership/format";
import { branchName } from "@/lib/config/school";
import { ACTIVITY, type ActivityItem } from "@/lib/data/mock/stats";

const MAX_ROWS = 6;

const KIND_TONE: Record<ActivityItem["kind"], Tone> = {
  attendance: "ok",
  marking: "info",
  hifz: "gold",
  parent: "accent",
  risk: "warn",
  resource: "neutral",
};

/** Live feed across campuses; capped at six rows by the density budget. */
export function ActivityFeed() {
  const rows = ACTIVITY.slice(0, MAX_ROWS);
  return (
    <Card className="h-full">
      <SectionTitle title="Activity" hint="Across all campuses" />
      <ul className="divide-y divide-line">
        {rows.map((item) => (
          <li key={item.id} className="flex gap-3 py-3 first:pt-0 last:pb-0">
            <Chip tone={KIND_TONE[item.kind]} className="mt-0.5 shrink-0 capitalize">
              {item.kind}
            </Chip>
            <div className="min-w-0 flex-1">
              <p className="text-sm leading-5 text-ink">{item.text}</p>
              <p className="mt-0.5 text-xs text-ink-3">
                {item.branchId ? branchName(item.branchId) : "All campuses"} · {relativeDay(item.when)}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}
