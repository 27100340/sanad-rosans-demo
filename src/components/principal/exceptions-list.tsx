import { Card, Chip, SectionTitle, type Tone } from "@/components/ui/primitives";
import type { BranchId } from "@/lib/config/school";
import { TODAY_EXCEPTIONS, type TimetableException } from "@/lib/data/mock/leadership-extra";

const KIND_TONE: Record<TimetableException["kind"], Tone> = { substitution: "warn", facility: "danger", event: "info" };
const KIND_LABEL: Record<TimetableException["kind"], string> = { substitution: "Substitution", facility: "Facility", event: "Event" };

/** Today's timetable exceptions for one campus. */
export function ExceptionsList({ branchId }: { branchId: BranchId }) {
  const rows = TODAY_EXCEPTIONS.filter((e) => e.branchId === branchId);
  return (
    <Card className="h-full">
      <SectionTitle title="Today's exceptions" hint="Substitutions, closures, events" />
      <ul className="divide-y divide-line">
        {rows.map((e) => (
          <li key={e.id} className="flex gap-3 py-3 first:pt-0 last:pb-0">
            <Chip tone={KIND_TONE[e.kind]} className="mt-0.5 shrink-0">
              {KIND_LABEL[e.kind]}
            </Chip>
            <div className="min-w-0 flex-1">
              <p className="text-sm leading-5 text-ink">{e.text}</p>
              <p className="mt-0.5 text-xs text-ink-3">{e.period}</p>
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}
