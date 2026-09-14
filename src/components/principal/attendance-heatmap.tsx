import { HeatCell } from "@/components/ui/primitives";
import { lastDayLabels } from "@/components/leadership/format";
import { cn } from "@/lib/utils";

export interface HeatRow {
  classId: string;
  className: string;
  days: number[];
}

/**
 * HeatCell colours a 0..100 scale (accent above 85, warn above 50). School
 * attendance lives in a narrow 85..98 band, so map it onto that scale:
 * 95.5%+ strong, 91%+ fine, 85%+ warn, below that danger.
 */
function heatValue(attendancePct: number): number {
  if (attendancePct >= 95.5) return 90;
  if (attendancePct >= 91) return 75;
  if (attendancePct >= 85) return 55;
  return 40;
}

/** Seven-day attendance by class. Each cell is a HeatCell; the last column is the class average. */
export function AttendanceHeatmap({ rows, className }: { rows: HeatRow[]; className?: string }) {
  const dayCount = rows[0]?.days.length ?? 0;
  const labels = lastDayLabels(dayCount);
  return (
    <div className={cn("overflow-x-auto", className)}>
      <table className="table min-w-[24rem]">
        <thead>
          <tr>
            <th>Class</th>
            {labels.map((d, i) => (
              <th key={i} className="text-center">
                {d}
              </th>
            ))}
            <th className="text-right">Avg</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const avg = r.days.reduce((a, b) => a + b, 0) / r.days.length;
            return (
              <tr key={r.classId}>
                <td className="whitespace-nowrap font-medium">{r.className}</td>
                {r.days.map((v, i) => (
                  <td key={i} className="text-center">
                    <div className="grid place-items-center">
                      <HeatCell value={heatValue(v)} label={`${r.className} · ${labels[i]} · ${v}%`} />
                    </div>
                  </td>
                ))}
                <td className={cn("num text-right", avg < 90 && "font-semibold text-warn")}>{avg.toFixed(0)}%</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
