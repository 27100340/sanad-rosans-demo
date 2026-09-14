import Link from "next/link";
import { AlertTriangle, CalendarCheck, ClipboardList, Inbox } from "lucide-react";
import { LESSON_STATUS, summaryLine } from "@/components/attend/lesson-list";
import { canSeeBranchStaff, SeatDenied } from "@/components/leadership/seat-guard";
import { branchRiskRows } from "@/components/principal/risk";
import { ComposeMessage, type ComposeClass } from "@/components/teach/compose-message";
import { fmtDay } from "@/components/teach/helpers";
import { Avatar, Chip, PageHeader, SectionTitle, Stat, type Tone } from "@/components/ui/primitives";
import { getViewer } from "@/lib/auth/viewer";
import { branchName, type BranchId } from "@/lib/config/school";
import { lessonsForClass, marksForLesson } from "@/lib/data/mock/attendance";
import { PARENT_MESSAGES } from "@/lib/data/mock/comms";
import { personName } from "@/lib/data/mock/notify";
import { studentsInClass, teacherById } from "@/lib/data/mock/people";
import { classesForBranch } from "@/lib/data/repo";
import type { RiskLevel } from "@/lib/domain/types";
import { todayISO } from "@/lib/utils";

const DEMO_BRANCH: BranchId = "gulberg";
const RISK_ROWS = 6;
const MESSAGE_ROWS = 4;

const LEVEL_TONE: Record<RiskLevel, Tone> = { high: "danger", medium: "warn", watch: "neutral" };
const LEVEL_LABEL: Record<RiskLevel, string> = { high: "High", medium: "Medium", watch: "Watch" };

export default async function CoordinatorPage() {
  const viewer = await getViewer();
  if (!canSeeBranchStaff(viewer)) return <SeatDenied home={viewer.home} />;

  const branchId = viewer.branchId ?? DEMO_BRANCH;
  const today = todayISO();
  const classes = classesForBranch(branchId);

  const registers = classes.map((c) => ({
    id: c.id,
    name: c.name,
    lessons: lessonsForClass(c.id)
      .filter((l) => l.date === today)
      .map((l) => ({ ...l, statuses: marksForLesson(l.id).map((m) => m.status) })),
  }));
  const lessons = registers.flatMap((r) => r.lessons);
  const stillOpen = lessons.filter((l) => l.status !== "closed").length;

  const risks = branchRiskRows(branchId);
  const urgent = PARENT_MESSAGES.filter((m) => m.branchId === branchId && m.triage === "urgent");

  const composeClasses: ComposeClass[] = classes.map((c) => ({
    id: c.id,
    name: c.name,
    students: studentsInClass(c.id).map((s) => ({ id: s.id, name: s.name })),
  }));

  return (
    <>
      <PageHeader
        eyebrow={`Coordinator · ${branchName(branchId)}`}
        title="Desk"
        description={`${fmtDay(today)}. Today's registers, the students who need chasing, and the parents still waiting for an answer.`}
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-6">
        <Stat label="Lessons today" value={lessons.length} trend={`across ${classes.length} classes`} icon={<CalendarCheck size={18} />} tone="accent" />
        <Stat label="Registers still open" value={stillOpen} icon={<ClipboardList size={18} />} tone={stillOpen ? "warn" : "ok"} />
        <Stat label="At-risk students" value={risks.length} trend="this campus" icon={<AlertTriangle size={18} />} tone={risks.length ? "danger" : "ok"} />
        <Stat label="Urgent parent messages" value={urgent.length} icon={<Inbox size={18} />} tone={urgent.length ? "warn" : "ok"} />
      </div>

      <section>
        <SectionTitle title="Today's registers" hint="Class by class, with what each closed register recorded." />
        {lessons.length ? (
          <div className="space-y-4">
            {registers.map((r) => (
              <div key={r.id}>
                <p className="mb-2 text-sm font-semibold text-ink">{r.name}</p>
                {r.lessons.length ? (
                  <div className="card divide-y divide-line">
                    {r.lessons.map((l) => {
                      const st = LESSON_STATUS[l.status];
                      return (
                        <div key={l.id} className="flex items-center gap-3 p-4">
                          <span className="tile-neutral num text-sm font-semibold">P{l.period}</span>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-ink">
                              {l.subject} <span className="font-normal text-ink-3">· {teacherById.get(l.teacherId)?.name ?? l.teacherId}</span>
                            </p>
                            <p className="mt-0.5 truncate text-xs text-ink-3">Room {l.room}{l.statuses.length ? ` · ${summaryLine(l.statuses)}` : ""}</p>
                          </div>
                          <Chip tone={st.tone}>{st.label}</Chip>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="card-quiet px-4 py-3 text-xs text-ink-3">No lessons timetabled today.</p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="card-quiet px-4 py-3 text-xs text-ink-3">Nothing is timetabled for today at this campus.</p>
        )}
      </section>

      <section>
        <SectionTitle title="Needs chasing" hint="The early-warning engine's top cases. Open a student to see the whole record." />
        {risks.length ? (
          <div className="card divide-y divide-line">
            {risks.slice(0, RISK_ROWS).map((r) => (
              <Link key={r.student.id} href={`/portal/principal/students/${r.student.id}`} className="flex items-center gap-3 p-4 transition-colors hover:bg-surface-2">
                <Avatar name={r.student.name} size="sm" tone={LEVEL_TONE[r.flag.level]} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-ink">{r.student.name}</p>
                  <p className="truncate text-xs text-ink-3">{r.className || "Hifz"} · owner {r.ownerName}</p>
                  <p className="mt-1 truncate text-xs text-ink-3">{r.flag.reasons.join(" · ")}</p>
                </div>
                <Chip tone={LEVEL_TONE[r.flag.level]}>{LEVEL_LABEL[r.flag.level]}</Chip>
              </Link>
            ))}
          </div>
        ) : (
          <p className="card-quiet px-4 py-3 text-xs text-ink-3">Nobody is flagged at this campus today.</p>
        )}
      </section>

      <section>
        <SectionTitle title="Urgent from parents" hint="Answer these first; the full inbox is under Parent inbox." />
        {urgent.length ? (
          <div className="card divide-y divide-line">
            {urgent.slice(0, MESSAGE_ROWS).map((m) => (
              <div key={m.id} className="p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="truncate text-sm font-medium text-ink">{personName(m.guardianId)}</p>
                  <span className="shrink-0 text-2xs text-ink-3">{fmtDay(m.date)}</span>
                </div>
                <p className="mt-1 text-xs text-ink-2">{m.text}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="card-quiet px-4 py-3 text-xs text-ink-3">No urgent parent messages waiting.</p>
        )}
      </section>

      <section>
        <SectionTitle title="Write to a class" hint="Every class at this campus. Students see it in their inbox; guardians in the family portal." />
        <ComposeMessage classes={composeClasses} teacherName={personName(viewer.personId)} />
      </section>
    </>
  );
}
