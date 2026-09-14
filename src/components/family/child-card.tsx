import { Avatar, Chip, KeyValue, Progress, Trend } from "@/components/ui/primitives";
import type { Student, TarbiyahLog } from "@/lib/domain/types";
import { classById, teacherById } from "@/lib/data/mock/people";
import { spacesForClass } from "@/lib/data/mock/spaces";
import { TARBIYAH_LOGS } from "@/lib/data/mock/comms";
import { HALAQA_2 } from "@/lib/data/mock/hifz";
import { masteryTone } from "@/components/teach/helpers";

export interface WardSummary {
  studentId: string;
  name: string;
  className: string;
  hifz: boolean;
  attendancePct: number;
  attendanceTrend: number;
  avgMark: number | null;
  markTrend: number;
  hifzRow: { juzCompleted: number; currentSurah: string; securePct: number; homeRecitations: number } | null;
  highlights: { kind: TarbiyahLog["kind"]; positive: boolean; note: string; teacher: string }[];
  teachers: { name: string; subject: string }[];
}

export function wardSummary(student: Student): WardSummary {
  const cls = classById.get(student.classId);
  const row = HALAQA_2.find((r) => r.studentId === student.id);
  const classTeacher = cls ? teacherById.get(cls.classTeacherId) : undefined;
  const subjectTeachers = spacesForClass(student.classId).map((s) => ({ name: teacherById.get(s.teacherId)?.name ?? "", subject: s.subject }));
  const teachers = subjectTeachers.length ? subjectTeachers : classTeacher ? [{ name: classTeacher.name, subject: classTeacher.subjects[0] ?? "" }] : [];
  return {
    studentId: student.id,
    name: student.name,
    className: cls?.name ?? "",
    hifz: Boolean(student.hifz),
    attendancePct: student.attendancePct,
    attendanceTrend: student.attendanceTrend,
    avgMark: student.hifz ? null : student.avgMark,
    markTrend: student.markTrend,
    hifzRow: row ? { juzCompleted: row.juzCompleted, currentSurah: row.currentSurah, securePct: row.securePct, homeRecitations: row.homeRecitationsThisWeek } : null,
    highlights: TARBIYAH_LOGS.filter((l) => l.studentId === student.id).slice(0, 3).map((l) => ({ kind: l.kind, positive: l.positive, note: l.note, teacher: teacherById.get(l.teacherId)?.name ?? "" })),
    teachers,
  };
}

export function ChildCard({ ward }: { ward: WardSummary }) {
  return (
    <article className="card p-5">
      <div className="flex items-center gap-3">
        <Avatar name={ward.name} tone={ward.hifz ? "gold" : "accent"} size="lg" />
        <div className="min-w-0">
          <h3 className="text-base font-semibold text-ink">{ward.name}</h3>
          <p className="text-xs text-ink-3">{ward.className}</p>
        </div>
      </div>

      <div className="mt-5">
        <KeyValue
          items={[
            { k: "Attendance", v: <span>{ward.attendancePct}% <Trend value={ward.attendanceTrend} /></span> },
            ...(ward.avgMark !== null ? [{ k: "Average mark", v: <span>{ward.avgMark}% <Trend value={ward.markTrend} suffix="" /></span> }] : []),
            ...(ward.hifzRow ? [{ k: "Juz completed", v: ward.hifzRow.juzCompleted }, { k: "Current surah", v: ward.hifzRow.currentSurah }, { k: "Home recitations", v: `${ward.hifzRow.homeRecitations} this week` }] : []),
          ]}
        />
      </div>

      {ward.hifzRow ? (
        <div className="mt-4">
          <div className="mb-1.5 flex items-center justify-between text-xs">
            <span className="text-ink-3">Manzil secure</span>
            <span className="num font-medium text-ink">{ward.hifzRow.securePct}%</span>
          </div>
          <Progress value={ward.hifzRow.securePct} tone={masteryTone(ward.hifzRow.securePct) === "ok" ? "gold" : masteryTone(ward.hifzRow.securePct)} />
        </div>
      ) : null}

      <div className="mt-5">
        <p className="text-2xs font-semibold uppercase tracking-[0.08em] text-ink-3">Tarbiyah highlights</p>
        <ul className="mt-2 space-y-2">
          {ward.highlights.map((h, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-ink-2">
              <Chip tone={h.positive ? "ok" : "warn"} className="mt-0.5 shrink-0 capitalize">
                {h.kind}
              </Chip>
              <span>
                {h.note} <span className="text-ink-3">· {h.teacher}</span>
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-5">
        <p className="text-2xs font-semibold uppercase tracking-[0.08em] text-ink-3">Teachers</p>
        <ul className="mt-2 grid grid-cols-1 gap-1 text-sm sm:grid-cols-2">
          {ward.teachers.map((t) => (
            <li key={`${t.name}-${t.subject}`} className="flex justify-between gap-2 text-ink">
              <span className="truncate">{t.name}</span>
              <span className="shrink-0 text-xs text-ink-3">{t.subject}</span>
            </li>
          ))}
        </ul>
      </div>
    </article>
  );
}
