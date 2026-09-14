import { BarChart, type BarDatum } from "@/components/charts/bar-chart";
import { Sparkline } from "@/components/charts/sparkline";
import { fmtDay, humanTag } from "@/components/teach/helpers";
import { Card, Chip, SectionTitle } from "@/components/ui/primitives";
import { buildKpi } from "@/lib/data/kpi";
import { lessonsForClass, marksForLesson } from "@/lib/data/mock/attendance";
import { classById } from "@/lib/data/mock/people";
import { attemptsForTest, questionsOf, testsForSpace } from "@/lib/data/mock/tests";
import { attendancePercent } from "@/lib/domain/attendance";
import { facility } from "@/lib/domain/assessment";
import type { SubjectSpace } from "@/lib/domain/types";

const ATTENDANCE_DAYS = 10;
const RANK_ROWS = 5;

export interface TestFacility {
  testId: string;
  title: string;
  attempts: number;
  bars: BarDatum[];
  hardest: { label: string; stem: string; value: number } | null;
}

export interface RankRow {
  studentId: string;
  name: string;
  composite: number;
  rankClass: number;
}

export interface SpaceAnalytics {
  space: SubjectSpace;
  className: string;
  students: number;
  mastery: BarDatum[];
  masteryAvg: number | null;
  tests: TestFacility[];
  attendance: { days: string[]; values: number[] };
  top: RankRow[];
  bottom: RankRow[];
}

/** Percent present across each of the class's last ten school days, oldest first. */
function attendanceTrend(classId: string): { days: string[]; values: number[] } {
  const byDate = new Map<string, string[]>();
  for (const lesson of lessonsForClass(classId)) {
    if (lesson.status !== "closed") continue;
    const statuses = marksForLesson(lesson.id).map((m) => m.status);
    if (!statuses.length) continue;
    byDate.set(lesson.date, [...(byDate.get(lesson.date) ?? []), ...statuses]);
  }
  const days = [...byDate.keys()].sort().slice(-ATTENDANCE_DAYS);
  const values: number[] = [];
  const kept: string[] = [];
  for (const date of days) {
    const pct = attendancePercent(byDate.get(date) ?? []);
    if (pct === null) continue;
    kept.push(date);
    values.push(pct);
  }
  return { days: kept, values };
}

function facilities(space: SubjectSpace): TestFacility[] {
  return testsForSpace(space.id).flatMap((test): TestFacility[] => {
    const attempts = attemptsForTest(test.id).filter((a) => a.submittedAt);
    if (!attempts.length) return [];
    const questions = questionsOf(test);
    const bars: BarDatum[] = [];
    let hardest: TestFacility["hardest"] = null;
    questions.forEach((q, i) => {
      const f = facility(q, attempts);
      if (f === null) return;
      const value = Math.round(f * 100);
      const label = `Q${i + 1} · ${q.topicCode}`;
      bars.push({ label, value });
      if (!hardest || value < hardest.value) hardest = { label, stem: q.stem, value };
    });
    if (!bars.length) return [];
    return [{ testId: test.id, title: test.title, attempts: attempts.length, bars, hardest }];
  });
}

function rankRows(space: SubjectSpace): { top: RankRow[]; bottom: RankRow[] } {
  const rows = buildKpi(space.branchId)
    .students.filter((s) => s.classId === space.classId)
    .map((s): RankRow => ({ studentId: s.studentId, name: s.name, composite: s.composite, rankClass: s.rankClass }))
    .sort((a, b) => b.composite - a.composite || a.name.localeCompare(b.name));
  return { top: rows.slice(0, RANK_ROWS), bottom: rows.slice(-RANK_ROWS).reverse() };
}

/** Gathers everything the panels draw for one space. Server-only; reads the mock stores directly. */
export function spaceAnalytics(space: SubjectSpace): SpaceAnalytics {
  const klass = classById.get(space.classId);
  const mastery: BarDatum[] = space.masteryByTopic.map((t) => ({ label: `${t.code} · ${t.title}`, value: t.classAvg }));
  const masteryAvg = mastery.length ? Math.round(mastery.reduce((a, b) => a + b.value, 0) / mastery.length) : null;
  const { top, bottom } = rankRows(space);
  return {
    space,
    className: klass?.name ?? space.classId,
    students: klass?.studentIds.length ?? 0,
    mastery,
    masteryAvg,
    tests: facilities(space),
    attendance: attendanceTrend(space.classId),
    top,
    bottom,
  };
}

function RankList({ title, hint, rows, tone }: { title: string; hint: string; rows: RankRow[]; tone: "ok" | "warn" }) {
  return (
    <Card>
      <SectionTitle title={title} hint={hint} />
      {rows.length ? (
        <ol className="divide-y divide-line">
          {rows.map((r) => (
            <li key={r.studentId} className="flex items-center gap-3 py-2.5">
              <span className="num w-7 shrink-0 text-xs font-semibold text-ink-3">{r.rankClass}</span>
              <span className="min-w-0 flex-1 truncate text-sm text-ink">{r.name}</span>
              <Chip tone={tone}>
                <span className="num">{r.composite}</span>
              </Chip>
            </li>
          ))}
        </ol>
      ) : (
        <p className="text-xs text-ink-3">No ranked students in this class yet.</p>
      )}
    </Card>
  );
}

/** One space: topic mastery, question facility, attendance, class ranks and misconceptions. */
export function SpacePanels({ data }: { data: SpaceAnalytics }) {
  const { space, className, attendance, tests } = data;
  const latest = attendance.values[attendance.values.length - 1] ?? null;

  return (
    <section className="space-y-4">
      <SectionTitle
        title={`${space.subject} · ${className}`}
        hint={`${data.students} student${data.students === 1 ? "" : "s"}${data.masteryAvg === null ? "" : ` · class mastery ${data.masteryAvg}%`}`}
      />

      <div className="grid gap-4 lg:grid-cols-2 lg:gap-6">
        <Card>
          <SectionTitle title="Class average by topic" hint="Rolling topic mastery across the whole class." />
          {data.mastery.length ? <BarChart bars={data.mastery} unit="%" highlight="min" /> : <p className="text-xs text-ink-3">No topic mastery recorded yet.</p>}
        </Card>

        <Card>
          <SectionTitle title="Attendance" hint={`Percent present over the last ${ATTENDANCE_DAYS} school days.`} />
          {attendance.values.length > 1 ? (
            <>
              <div className="flex items-end justify-between gap-4">
                <p className="num text-2xl font-semibold leading-none text-ink">{latest}%</p>
                <p className="text-xs text-ink-3">{fmtDay(attendance.days[attendance.days.length - 1])}</p>
              </div>
              <Sparkline values={attendance.values} className="mt-3 text-accent" label={`Attendance for ${className}`} />
              <p className="mt-2 text-2xs text-ink-3">
                {fmtDay(attendance.days[0])} to {fmtDay(attendance.days[attendance.days.length - 1])}
              </p>
            </>
          ) : (
            <p className="text-xs text-ink-3">Not enough closed registers to draw a trend.</p>
          )}
        </Card>
      </div>

      {tests.length ? (
        <div className="grid gap-4 lg:gap-6">
          {tests.map((t) => (
            <Card key={t.testId}>
              <SectionTitle title={t.title} hint={`Facility per question across ${t.attempts} submitted attempt${t.attempts === 1 ? "" : "s"}. Lower means harder.`} />
              <BarChart bars={t.bars} unit="%" highlight="min" />
              {t.hardest ? (
                <p className="mt-3 rounded-xl bg-warn-soft px-3 py-2 text-xs text-ink-2">
                  Hardest: <span className="font-medium text-ink">{t.hardest.label}</span> at <span className="num">{t.hardest.value}%</span>. {t.hardest.stem}
                </p>
              ) : null}
            </Card>
          ))}
        </div>
      ) : (
        <p className="card-quiet px-4 py-3 text-xs text-ink-3">No test in this space has submitted attempts yet, so there is no question-level facility to show.</p>
      )}

      <div className="grid gap-4 lg:grid-cols-2 lg:gap-6">
        <RankList title="Top five" hint="Performance Index, this class." rows={data.top} tone="ok" />
        <RankList title="Bottom five" hint="Lowest Performance Index; start here." rows={data.bottom} tone="warn" />
      </div>

      <Card>
        <SectionTitle title="Misconceptions" hint="Patterns the marker has seen most often in this space." />
        {space.misconceptions.length ? (
          <ul className="divide-y divide-line">
            {space.misconceptions.map((m) => (
              <li key={m.tag} className="flex items-start gap-3 py-2.5">
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium text-ink">{humanTag(m.tag)}</span>
                  <span className="num mt-0.5 block text-xs text-ink-3">{m.example}</span>
                </span>
                <Chip tone={m.count >= 15 ? "danger" : m.count >= 8 ? "warn" : "neutral"}>
                  <span className="num">{m.count}</span>
                </Chip>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-xs text-ink-3">Nothing recorded for this space yet.</p>
        )}
      </Card>
    </section>
  );
}
