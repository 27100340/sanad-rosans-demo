import { Chip, KeyValue, Progress } from "@/components/ui/primitives";
import { masteryTone } from "@/components/teach/helpers";
import { branchName, school } from "@/lib/config/school";
import type { StudentDetail } from "@/lib/data/student-detail";
import { TARBIYAH_LABEL } from "@/lib/data/mock/tarbiyah";
import { HALAQA_2 } from "@/lib/data/mock/hifz";
import { teacherById } from "@/lib/data/mock/people";
import { TERM } from "@/lib/data/mock/fees";
import { pctOf } from "@/lib/domain/assessment";
import { pointsEarned } from "@/lib/domain/tasks";

interface SubjectLine {
  subject: string;
  teacher: string;
  assignments: string;
  tests: string;
  mastery: number | null;
}

function subjectLines(d: StudentDetail): SubjectLine[] {
  return d.subjects.map((s) => {
    const subs = d.submissions.filter((x) => x.subject === s.subject);
    const marked = subs.filter((x) => x.awarded !== undefined);
    const tests = d.results.filter((r) => r.kind === "test" && r.subject === s.subject);
    const m = d.mastery.filter((x) => d.subjects.find((y) => y.subject === s.subject) && x.code.startsWith(s.subject === "Mathematics" ? "8N" : "")).map((x) => x.score);
    const masteryAvg = m.length ? Math.round(m.reduce((a, b) => a + b, 0) / m.length) : null;
    return {
      subject: s.subject,
      teacher: s.teacher,
      assignments: subs.length ? `${subs.filter((x) => x.status !== "missing" && x.status !== "not submitted").length}/${subs.length} submitted${marked.length ? ` · ${pctOf(marked.reduce((a, x) => a + (x.awarded ?? 0), 0), marked.reduce((a, x) => a + x.maxMarks, 0))}%` : ""}` : "—",
      tests: tests.length ? `${tests.length} · ${Math.round(tests.reduce((a, t) => a + t.pct, 0) / tests.length)}%` : "—",
      mastery: masteryAvg,
    };
  });
}

/** Printable term report for one child: one sheet per child. */
export function ReportCard({ d }: { d: StudentDetail }) {
  const s = d.student;
  const hifz = s.hifz ? HALAQA_2.find((r) => r.studentId === s.id) : undefined;
  const lines = s.hifz ? [] : subjectLines(d);
  const tasksDone = d.tasks.filter((t) => t.status === "done").length;

  return (
    <article className="print-page card p-6 sm:p-8">
      <header className="flex flex-wrap items-start justify-between gap-4 border-b border-line pb-4">
        <div>
          <p className="eyebrow">{school.schoolName} · {branchName(s.branchId)}</p>
          <h2 className="mt-1 text-xl font-semibold text-ink">{s.name}</h2>
          <p className="text-sm text-ink-2">
            {d.className} · class teacher {d.classTeacher}
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm font-medium text-ink">Progress report</p>
          <p className="text-xs text-ink-3">{TERM}</p>
        </div>
      </header>

      <div className="mt-5 grid gap-6 sm:grid-cols-2">
        <KeyValue
          items={[
            { k: "Attendance", v: `${d.attendance.pct ?? s.attendancePct}%` },
            ...(s.hifz ? [] : [{ k: "Term average", v: `${s.avgMark}%` }, { k: "Change since last term", v: `${s.markTrend > 0 ? "+" : ""}${s.markTrend}` }]),
            ...(d.kpi ? [{ k: "Performance Index", v: `${Math.round(d.kpi.composite)} · #${d.kpi.rankClass} of ${d.kpi.outOfClass}` }] : []),
            { k: "Tasks completed", v: `${tasksDone} of ${d.tasks.length} · ${pointsEarned(d.tasks)} points` },
          ]}
        />
        {hifz ? (
          <div>
            <p className="text-2xs font-semibold uppercase tracking-[0.08em] text-ink-3">Hifz</p>
            <KeyValue items={[{ k: "Juz completed", v: hifz.juzCompleted }, { k: "Current surah", v: hifz.currentSurah }, { k: "Manzil secure", v: `${hifz.securePct}%` }, { k: "Weak units", v: hifz.weakUnits }, { k: "Last sabaq", v: `${hifz.lastSabaqScore}%` }, { k: "Home recitations", v: `${hifz.homeRecitationsThisWeek} this week` }]} />
            <div className="mt-3">
              <Progress value={hifz.securePct} tone={masteryTone(hifz.securePct) === "ok" ? "gold" : masteryTone(hifz.securePct)} />
            </div>
          </div>
        ) : (
          <div>
            <p className="text-2xs font-semibold uppercase tracking-[0.08em] text-ink-3">Mastery by topic</p>
            {d.mastery.length ? (
              <ul className="mt-2 space-y-2">
                {d.mastery.slice(0, 5).map((m) => (
                  <li key={m.code}>
                    <div className="mb-0.5 flex justify-between text-xs">
                      <span className="truncate text-ink-2">{m.code} · {m.title}</span>
                      <span className="num font-medium text-ink">{m.score}%</span>
                    </div>
                    <Progress value={m.score} tone={masteryTone(m.score)} />
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-xs text-ink-3">Assessed topics appear here after the first published test.</p>
            )}
          </div>
        )}
      </div>

      {lines.length ? (
        <div className="mt-6 overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Subject</th>
                <th>Teacher</th>
                <th>Assignments</th>
                <th>Tests</th>
                <th className="text-right">Mastery</th>
              </tr>
            </thead>
            <tbody>
              {lines.map((l) => (
                <tr key={l.subject}>
                  <td className="whitespace-nowrap font-medium">{l.subject}</td>
                  <td className="whitespace-nowrap text-ink-2">{l.teacher}</td>
                  <td className="text-xs">{l.assignments}</td>
                  <td className="text-xs">{l.tests}</td>
                  <td className="num text-right">{l.mastery === null ? <span className="text-ink-3">—</span> : `${l.mastery}%`}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      <div className="mt-6 grid gap-6 sm:grid-cols-2">
        <div>
          <p className="text-2xs font-semibold uppercase tracking-[0.08em] text-ink-3">Tarbiyah</p>
          {d.tarbiyah.length ? (
            <ul className="mt-2 space-y-2">
              {d.tarbiyah.slice(0, 5).map((l) => (
                <li key={l.id} className="flex items-start gap-2 text-xs text-ink-2">
                  <Chip tone={l.positive ? "ok" : "warn"} className="mt-0.5 shrink-0">{TARBIYAH_LABEL[l.kind]}</Chip>
                  <span>
                    {l.note} <span className="text-ink-3">· {teacherById.get(l.teacherId)?.name ?? ""}</span>
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-xs text-ink-3">No observations this term.</p>
          )}
        </div>
        <div>
          <p className="text-2xs font-semibold uppercase tracking-[0.08em] text-ink-3">Next steps</p>
          <ol className="mt-2 list-decimal space-y-1 pl-5 text-xs text-ink-2">
            {d.recommendations.slice(0, 4).map((r) => <li key={r}>{r}</li>)}
          </ol>
        </div>
      </div>

      <footer className="mt-8 grid grid-cols-2 gap-8 border-t border-line pt-4 text-xs text-ink-3">
        <div>
          <div className="h-8 border-b border-line-strong" />
          <p className="mt-1">Class teacher · {d.classTeacher}</p>
        </div>
        <div>
          <div className="h-8 border-b border-line-strong" />
          <p className="mt-1">Principal · {branchName(s.branchId)}</p>
        </div>
      </footer>
    </article>
  );
}
