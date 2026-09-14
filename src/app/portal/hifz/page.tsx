import { AlertTriangle, BookMarked, CalendarCheck, Flame, ShieldCheck } from "lucide-react";
import Link from "next/link";
import type { HifzUnit, HifzUnitKind } from "@/lib/domain/types";
import { todaysQueue } from "@/lib/domain/srs";
import { getViewer } from "@/lib/auth/viewer";
import { planForStudent, unitsForStudent } from "@/lib/data/mock/hifz";
import { studentById } from "@/lib/data/mock/people";
import { pct, todayISO } from "@/lib/utils";
import { EmptyState, PageHeader, SectionTitle, Stat } from "@/components/ui/primitives";
import { DeniedState, HIFZ_STUDENT_ID, canSeeStudentHifz } from "@/components/hifz/access";
import { KIND_LABEL, STREAK_DAYS, securePct, unitLabel, weakRetention } from "@/components/hifz/derive";
import { QueueCard } from "@/components/hifz/queue-card";

const SECTION_HINT: Record<HifzUnitKind, string> = {
  sabaq: "Today's new lesson",
  sabqi: "This week's lessons, quick recite-back",
  manzil: "Long-term revision chosen by the scheduler",
};

function QueueSection({ kind, units, today, overdue }: { kind: HifzUnitKind; units: HifzUnit[]; today: string; overdue?: number }) {
  return (
    <section>
      <SectionTitle title={KIND_LABEL[kind]} hint={SECTION_HINT[kind]} action={overdue ? <span className="text-xs text-warn">+{overdue} more overdue</span> : null} />
      {units.length ? (
        <div className="space-y-2">
          {units.map((u) => (
            <QueueCard key={u.id} unit={u} kind={kind} today={today} />
          ))}
        </div>
      ) : (
        <EmptyState title={`No ${KIND_LABEL[kind].toLowerCase()} due`} body="Nothing scheduled in this block today." />
      )}
    </section>
  );
}

export default async function HifzTodayPage() {
  const viewer = await getViewer();
  if (!canSeeStudentHifz(viewer)) return <DeniedState />;

  const today = todayISO();
  const student = studentById.get(HIFZ_STUDENT_ID);
  const units = unitsForStudent(HIFZ_STUDENT_ID);
  const plan = planForStudent(HIFZ_STUDENT_ID);
  const queue = todaysQueue(units, today);
  const dueToday = queue.sabaq.length + queue.sabqi.length + queue.manzil.length;
  const weak = weakRetention(units, today);

  return (
    <>
      <PageHeader
        eyebrow="Hifz · Halaqa 2"
        title={`Assalamu alaikum, ${student?.firstName ?? "Zaid"}`}
        description={plan ? `Juz ${plan.currentJuz} in progress · ${plan.dailySabaqAyat} ayat of sabaq a day · target ${plan.targetCompletionYear}` : undefined}
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Juz completed" value={plan?.juzCompleted.length ?? 0} tone="gold" icon={<BookMarked size={18} />} trend={plan ? `Now on juz ${plan.currentJuz}` : undefined} />
        <Stat label="Secure" value={pct(securePct(units))} tone="ok" icon={<ShieldCheck size={18} />} trend="of started units" />
        <Stat label="Streak" value={`${STREAK_DAYS} days`} tone="accent" icon={<Flame size={18} />} trend="home recitation logged" />
        <Stat label="Due today" value={dueToday} tone={dueToday ? "warn" : "neutral"} icon={<CalendarCheck size={18} />} trend={queue.overdueManzil ? `${queue.overdueManzil} manzil overdue` : "all on schedule"} />
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <QueueSection kind="sabaq" units={queue.sabaq} today={today} />
        <QueueSection kind="sabqi" units={queue.sabqi} today={today} />
        <QueueSection kind="manzil" units={queue.manzil} today={today} overdue={queue.overdueManzil} />
      </div>

      {weak.length ? (
        <section>
          <SectionTitle title="Slipping" hint="Retention estimate below 60%; recite these before they lapse" />
          <ul className="card divide-y divide-line">
            {weak.map(({ unit, retention: r }) => (
              <li key={unit.id} className="flex items-center gap-3 px-5 py-3">
                <span className="tile-warn h-8 w-8 rounded-lg">
                  <AlertTriangle size={14} />
                </span>
                <p className="min-w-0 flex-1 text-sm text-ink">
                  {unitLabel(unit)} <span className="num text-ink-3">· retention {pct(r * 100)}</span>
                </p>
                <Link href={`/portal/hifz/recite?unit=${unit.id}`} className="btn-soft btn-sm">
                  Recite
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </>
  );
}
