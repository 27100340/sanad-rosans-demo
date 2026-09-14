import { Avatar, Chip, Trend } from "@/components/ui/primitives";
import type { SubjectSpace } from "@/lib/domain/types";
import { studentsInClass } from "@/lib/data/mock/people";
import { RETEACH_MAP } from "@/lib/data/mock/learn-extra";

export interface ReteachRow {
  studentId: string;
  name: string;
  avgMark: number;
  markTrend: number;
  topicCode: string;
  topicTitle: string;
  note: string;
}

const BAND = 65;

export function reteachRows(space: SubjectSpace): ReteachRow[] {
  const weakest = [...space.masteryByTopic].sort((a, b) => a.classAvg - b.classAvg)[0];
  return studentsInClass(space.classId)
    .filter((s) => s.avgMark < BAND)
    .sort((a, b) => a.avgMark - b.avgMark)
    .map((s) => {
      const mapped = RETEACH_MAP[s.id];
      const code = mapped?.topicCode ?? weakest?.code ?? "";
      const topic = space.syllabus.find((t) => t.code === code);
      return {
        studentId: s.id,
        name: s.name,
        avgMark: s.avgMark,
        markTrend: s.markTrend,
        topicCode: code,
        topicTitle: topic?.title.replace(/^[^:]+:\s*/, "") ?? code,
        note: mapped?.note ?? "Below the class band; start with the weakest class topic.",
      };
    });
}

export function ReteachList({ rows }: { rows: ReteachRow[] }) {
  if (!rows.length) return <p className="text-sm text-ink-3">Everyone is above the class band.</p>;
  return (
    <div className="card divide-y divide-line">
      {rows.map((r) => (
        <div key={r.studentId} className="flex items-start gap-3 p-4">
          <Avatar name={r.name} tone={r.avgMark < 50 ? "danger" : "warn"} size="sm" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <p className="text-sm font-medium text-ink">{r.name}</p>
              <p className="num text-xs text-ink-3">
                {r.avgMark}% <Trend value={r.markTrend} suffix="" />
              </p>
            </div>
            <p className="mt-1 text-xs text-ink-2">{r.note}</p>
          </div>
          <Chip tone="accent" className="shrink-0">
            <span className="num">{r.topicCode}</span> · {r.topicTitle}
          </Chip>
        </div>
      ))}
    </div>
  );
}
