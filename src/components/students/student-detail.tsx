import Link from "next/link";
import { AlertTriangle, ArrowLeft, BookOpen, ClipboardList, GraduationCap, Mail, ShieldCheck } from "lucide-react";
import { relativeDay, relativeStamp } from "@/components/leadership/format";
import { ActivityTimeline } from "@/components/students/activity-timeline";
import { ProgressEmail } from "@/components/students/progress-email";
import { TarbiyahForm } from "@/components/students/tarbiyah-form";
import { VisualReport } from "@/components/students/visual-report";
import { statusTone } from "@/components/attend/lesson-list";
import { attendanceClass } from "@/components/attend/roster-table";
import { fmtDay, SUBMISSION_STATUS } from "@/components/teach/helpers";
import { TaskForm } from "@/components/teach/task-form";
import { Avatar, Chip, KeyValue, LinkButton, PageHeader, type Tone } from "@/components/ui/primitives";
import { branchName, school } from "@/lib/config/school";
import type { StudentDetail as Detail } from "@/lib/data/student-detail";
import { TARBIYAH_LABEL } from "@/lib/data/mock/tarbiyah";
import { teacherById } from "@/lib/data/mock/people";
import { ATTENDANCE_LABEL } from "@/lib/domain/attendance";
import { ACTIVITY_LABEL, STATUS_LABEL, isOverdue } from "@/lib/domain/tasks";
import type { RiskLevel } from "@/lib/domain/types";
import { cn, daysAgoISO, todayISO } from "@/lib/utils";

const LEVEL_TONE: Record<RiskLevel, Tone> = { high: "danger", medium: "warn", watch: "neutral" };
const DEFAULT_DUE_DAYS = 3;

const SQUARE: Record<Tone, string> = { accent: "bg-accent", gold: "bg-gold", ok: "bg-ok", warn: "bg-warn", danger: "bg-danger", info: "bg-info", neutral: "bg-surface-3" };

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="card p-5">
      <h2 className="mb-3 flex items-center gap-2 text-2xs font-semibold uppercase tracking-[0.08em] text-ink-3">
        <span className="text-accent">{icon}</span>
        {title}
      </h2>
      {children}
    </section>
  );
}

/**
 * One student, everything a teacher or principal needs: identity, access,
 * the visual report, activity, work, tasks, tarbiyah and outreach.
 * `basePath` decides where "All students" and the task form return to;
 * `messagesHref` is the seat's compose page.
 */
export function StudentDetailView({ d, basePath, messagesHref, spaceIdForTasks, restriction }: { d: Detail; basePath: string; messagesHref: string | null; spaceIdForTasks: string | null; restriction: { mode: string; message: string } | null }) {
  const s = d.student;
  const today = todayISO();
  const openTasks = d.tasks.filter((t) => t.status !== "done");
  const whenFor = (items: { when: string }[]) => items.map((it) => (it.when.length > 10 ? relativeStamp(it.when) : relativeDay(it.when)));

  return (
    <>
      <Link href={basePath} className="inline-flex items-center gap-1 text-xs text-ink-3 hover:text-accent">
        <ArrowLeft size={13} /> All students
      </Link>

      <PageHeader
        eyebrow={`${d.className} · ${branchName(s.branchId)}`}
        title={
          <span className="flex items-center gap-3">
            <Avatar name={s.name} size="lg" tone={d.risk ? LEVEL_TONE[d.risk.level] : "accent"} />
            {s.name}
          </span>
        }
        description={`Class teacher ${d.classTeacher}${d.guardian ? ` · guardian ${d.guardian.name} (${d.guardian.phoneMasked}, prefers ${d.guardian.language === "ur" ? "Urdu" : "English"})` : ""}`}
        actions={
          <>
            {restriction ? <Chip tone="danger">{restriction.mode === "suspended" ? "Suspended" : "Locked"}</Chip> : <Chip tone="ok">Active</Chip>}
            {d.risk ? <Chip tone={LEVEL_TONE[d.risk.level]}>{d.risk.level} risk · {d.risk.score}</Chip> : null}
            {messagesHref ? (
              <LinkButton href={`${messagesHref}?student=${encodeURIComponent(s.id)}`} variant="outline">
                <Mail size={14} /> Message
              </LinkButton>
            ) : null}
          </>
        }
      />

      {restriction ? (
        <p className="chip-danger w-full justify-start whitespace-normal rounded-xl px-4 py-3 text-xs">
          Portal access is {restriction.mode}: “{restriction.message}”
        </p>
      ) : null}

      {d.risk ? (
        <div className="card flex items-start gap-3 border-warn/40 p-4">
          <span className="tile-warn">
            <AlertTriangle size={18} />
          </span>
          <div>
            <p className="text-sm font-medium text-ink">Early-warning flags</p>
            <ul className="mt-1 list-disc space-y-0.5 pl-5 text-xs text-ink-2">
              {d.risk.reasons.map((r) => <li key={r}>{r}</li>)}
            </ul>
          </div>
        </div>
      ) : null}

      <VisualReport d={d} branchName={branchName(s.branchId)} schoolName={school.shortName} />

      <ActivityTimeline data={d.activity} when={{ past: whenFor(d.activity.past), present: whenFor(d.activity.present), future: whenFor(d.activity.future) }} />

      <div className="grid gap-5 lg:grid-cols-3">
        <Section title="Attendance" icon={<ShieldCheck size={13} />}>
          <p className={cn("num text-2xl font-semibold", attendanceClass(d.attendance.pct ?? 100))}>{d.attendance.pct ?? "—"}%</p>
          <p className="text-xs text-ink-3">
            {d.attendance.present + d.attendance.online} present · {d.attendance.late} late · {d.attendance.absent} absent{d.attendance.excluded ? ` · ${d.attendance.excluded} approved leave` : ""}
          </p>
          <div className="mt-3 flex items-center gap-1" aria-label="Recent register">
            {d.attendance.recent.map((m, i) => (
              <span key={i} title={ATTENDANCE_LABEL[m]} className={cn("h-3 w-3 rounded-[3px]", SQUARE[statusTone(m)])} />
            ))}
          </div>
        </Section>
        <Section title="Results" icon={<BookOpen size={13} />}>
          {d.results.length ? (
            <ul className="space-y-1 text-xs">
              {d.results.slice(0, 8).map((r, i) => (
                <li key={i} className="flex justify-between gap-2 text-ink">
                  <span className="min-w-0 truncate">{r.title}</span>
                  <span className="num shrink-0 text-ink-3">
                    {r.score}/{r.total} · {r.pct}%
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-ink-3">No published results yet.</p>
          )}
        </Section>
        <Section title="Assignments" icon={<ClipboardList size={13} />}>
          {d.submissions.length ? (
            <ul className="space-y-1 text-xs">
              {d.submissions.slice(0, 8).map((x) => {
                const st = x.status in SUBMISSION_STATUS ? SUBMISSION_STATUS[x.status as keyof typeof SUBMISSION_STATUS] : { label: x.status, tone: (x.status === "missing" ? "danger" : "neutral") as Tone };
                return (
                  <li key={x.assignmentId} className="flex items-center justify-between gap-2 text-ink">
                    <span className="min-w-0 truncate">{x.title}</span>
                    <span className="flex shrink-0 items-center gap-2">
                      {x.awarded !== undefined ? <span className="num text-ink-3">{x.awarded}/{x.maxMarks}</span> : null}
                      <Chip tone={st.tone}>{st.label}</Chip>
                    </span>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-xs text-ink-3">Nothing set for this class yet.</p>
          )}
        </Section>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="space-y-5">
          <Section title={`Tasks and challenges · ${openTasks.length} open`} icon={<ClipboardList size={13} />}>
            {d.tasks.length ? (
              <ul className="space-y-1.5">
                {d.tasks.slice(0, 10).map((t) => (
                  <li key={t.id} className="flex items-center justify-between gap-2 rounded-lg bg-surface-2 px-3 py-2 text-xs">
                    <span className="min-w-0">
                      <span className="block truncate font-medium text-ink">{t.title}</span>
                      <span className="text-ink-3">
                        {ACTIVITY_LABEL[t.activityType]} · due {fmtDay(t.dueAt)} · {t.points} pts · {teacherById.get(t.teacherId)?.name ?? ""}
                      </span>
                    </span>
                    <Chip tone={t.status === "done" ? "ok" : isOverdue(t, today) ? "danger" : t.status === "in_progress" ? "info" : "neutral"}>{isOverdue(t, today) && t.status !== "done" ? "Overdue" : STATUS_LABEL[t.status]}</Chip>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-ink-3">No personal tasks yet.</p>
            )}
          </Section>
          {spaceIdForTasks ? (
            <div>
              <p className="mb-2 text-2xs font-semibold uppercase tracking-[0.08em] text-ink-3">Set an individual task</p>
              <TaskForm spaceId={spaceIdForTasks} classId={s.classId} students={[{ id: s.id, name: s.name }]} defaultDue={daysAgoISO(-DEFAULT_DUE_DAYS)} defaultStudentId={s.id} />
            </div>
          ) : null}
        </div>
        <div className="space-y-5">
          <Section title="Tarbiyah" icon={<GraduationCap size={13} />}>
            {d.tarbiyah.length ? (
              <ul className="space-y-2">
                {d.tarbiyah.slice(0, 6).map((l) => (
                  <li key={l.id} className="flex items-start gap-2 text-xs text-ink-2">
                    <Chip tone={l.positive ? "ok" : "warn"} className="mt-0.5 shrink-0">{TARBIYAH_LABEL[l.kind]}</Chip>
                    <span>
                      {l.note} <span className="text-ink-3">· {teacherById.get(l.teacherId)?.name ?? ""} · {relativeDay(l.date)}</span>
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-ink-3">No observations yet.</p>
            )}
          </Section>
          <TarbiyahForm studentId={s.id} studentFirstName={s.firstName} />
          <ProgressEmail studentId={s.id} guardianName={d.guardian?.name ?? null} guardianLanguage={d.guardian?.language ?? "en"} studentFirstName={s.firstName} />
        </div>
      </div>

      <Section title="Subjects and teachers" icon={<BookOpen size={13} />}>
        <KeyValue items={d.subjects.map((x) => ({ k: x.subject, v: x.teacher }))} />
      </Section>
    </>
  );
}
