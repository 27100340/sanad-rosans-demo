import { Avatar, Card, LinkButton, SectionTitle } from "@/components/ui/primitives";
import type { BranchId } from "@/lib/config/school";
import { TEACHERS } from "@/lib/data/mock/people";
import { cn } from "@/lib/utils";

const MAX_ROWS = 6;
const HEAVY_BACKLOG = 10;

/** Teacher load for one campus: periods, marking backlog, spaces. Six rows, then "view all". */
export function TeacherLoadTable({ branchId }: { branchId: BranchId }) {
  const teachers = TEACHERS.filter((t) => t.branchId === branchId).sort((a, b) => b.markingBacklog - a.markingBacklog);
  const rows = teachers.slice(0, MAX_ROWS);
  return (
    <Card className="p-0">
      <div className="px-5 pt-5">
        <SectionTitle title="Teacher load" hint={`${teachers.length} teaching staff`} action={<LinkButton href="/portal/principal/teachers" variant="ghost" className="btn-sm">View all</LinkButton>} />
      </div>
      <div className="overflow-x-auto">
        <table className="table min-w-[32rem]">
          <thead>
            <tr>
              <th>Teacher</th>
              <th>Subjects</th>
              <th className="text-right">Periods / week</th>
              <th className="text-right">Backlog</th>
              <th className="text-right">Spaces</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((t) => (
              <tr key={t.id}>
                <td>
                  <span className="flex items-center gap-2.5">
                    <Avatar name={t.name} tone={t.avatarTone ?? "accent"} size="sm" />
                    <span className="whitespace-nowrap font-medium">{t.name}</span>
                  </span>
                </td>
                <td className="text-ink-2">{t.subjects.join(", ")}</td>
                <td className="num text-right">{t.weeklyPeriods}</td>
                <td className={cn("num text-right", t.markingBacklog >= HEAVY_BACKLOG && "font-semibold text-warn")}>{t.markingBacklog}</td>
                <td className="num text-right">{t.spaceIds.length}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
