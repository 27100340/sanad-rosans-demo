/**
 * Register state that lives outside the seeded mock: the seat gate both
 * attendance routes share, the roster shape the marking agent resolves names
 * against, and the pending-proposal store.
 *
 * The proposal store is the safety boundary for AI marking. The agent never
 * writes; it parks a change set here, the teacher is shown the diff, and only
 * `applyProposal` — reached from an explicit confirmation carrying the
 * proposal's id — touches a mark. The client may drop lines from a proposal
 * but can never add one, because the server applies the stored copy rather
 * than anything the browser sends back.
 *
 * Production replaces the store with a short-lived row in edu_attendance_draft;
 * the guards and the shapes stay as they are.
 */
import type { Persona } from "@/lib/auth/personas";
import type { BranchId } from "@/lib/config/school";
import { lessonById, lessonsForClass, marksForLesson, marksForLessons, setMark } from "@/lib/data/mock/attendance";
import { audit, notify } from "@/lib/data/mock/notify";
import { classById, studentById, studentsInClass, teacherById } from "@/lib/data/mock/people";
import { classesForBranch } from "@/lib/data/repo";
import { ATTENDANCE_LABEL, attendancePercent, isUnauthorised, summarise, type AttendanceMark, type AttendanceStatus, type Lesson } from "@/lib/domain/attendance";
import { singleton } from "./store";

/** Oldest proposals fall off the back; a register only ever has one in flight. */
const PROPOSAL_CAP = 200;

// --------------------------------------------------------------- seat gate

/** A teacher owns their own periods; branch leadership reads and corrects any period on their campus. */
export function canTouchLesson(viewer: Persona, lesson: Lesson): boolean {
  if (viewer.role === "teacher") return lesson.teacherId === viewer.personId;
  if (viewer.role === "principal" || viewer.role === "chairman") {
    const cls = classById.get(lesson.classId);
    return Boolean(cls) && (viewer.branchId === null || cls?.branchId === viewer.branchId);
  }
  return false;
}

/** The lesson, or null when it does not exist or sits outside this seat. */
export function lessonForViewer(viewer: Persona, lessonId: string | null | undefined): Lesson | null {
  const lesson = lessonId ? lessonById.get(lessonId) : undefined;
  return lesson && canTouchLesson(viewer, lesson) ? lesson : null;
}

// ----------------------------------------------------------------- roster

export interface RosterEntry {
  studentId: string;
  name: string;
  firstName: string;
}

export interface RegisterRowState {
  studentId: string;
  name: string;
  status: AttendanceStatus | null;
  note: string;
}

export function rosterFor(lesson: Lesson): RosterEntry[] {
  return studentsInClass(lesson.classId).map((s) => ({ studentId: s.id, name: s.name, firstName: s.firstName }));
}

/** Current mark per student, for the diff and for the register payload. */
export function currentMarks(lesson: Lesson): Map<string, { status: AttendanceStatus; note: string }> {
  return new Map(marksForLesson(lesson.id).map((m) => [m.studentId, { status: m.status, note: m.note }]));
}

/** The shape both routes return, so the client always reloads from one place. */
export function registerPayload(lesson: Lesson): { lesson: Lesson; rows: RegisterRowState[] } {
  const marks = currentMarks(lesson);
  return {
    lesson,
    rows: rosterFor(lesson).map((r) => ({ studentId: r.studentId, name: r.name, status: marks.get(r.studentId)?.status ?? null, note: marks.get(r.studentId)?.note ?? "" })),
  };
}

// --------------------------------------------------------------- proposals

export type ProposalSource = "groq" | "local";

export interface ProposedChange {
  studentId: string;
  studentName: string;
  from: AttendanceStatus | null;
  to: AttendanceStatus;
  note: string;
  /** The words in the teacher's own message this line came from, quoted back in the diff. */
  evidence: string;
  /** Set when the line would overwrite an authorised absence somebody already recorded. */
  warning?: string;
}

export interface ProposalQuestion {
  id: string;
  /** Exactly what the teacher wrote, so the question can quote it. */
  query: string;
  status: AttendanceStatus;
  reason: string;
  /** Empty when the name matched nobody; two or more when it matched several. */
  candidates: { studentId: string; name: string }[];
  question: string;
}

export interface RegisterProposal {
  id: string;
  lessonId: string;
  authorId: string;
  createdAt: string;
  /** The teacher's request, kept verbatim for the audit trail. Data, never instructions. */
  request: string;
  source: ProposalSource;
  /** Status the teacher asked for "everyone else"; kept so answering a question can re-run it. */
  blanket: AttendanceStatus | null;
  headline: string;
  changes: ProposedChange[];
  questions: ProposalQuestion[];
}

/** What the agent hands back; the store owns identity and ownership. */
export type ProposalDraft = Pick<RegisterProposal, "request" | "source" | "blanket" | "headline" | "changes" | "questions">;

function proposalStore(): Map<string, RegisterProposal> {
  return singleton("attendanceProposals", () => new Map<string, RegisterProposal>());
}

export function putProposal(viewer: Persona, lesson: Lesson, draft: ProposalDraft): RegisterProposal {
  const store = proposalStore();
  const proposal: RegisterProposal = {
    ...draft,
    id: `prop-${lesson.id}-${Date.now().toString(36)}-${store.size.toString(36)}`,
    lessonId: lesson.id,
    authorId: viewer.personId,
    createdAt: new Date().toISOString(),
  };
  store.set(proposal.id, proposal);
  while (store.size > PROPOSAL_CAP) {
    const oldest = store.keys().next();
    if (oldest.done) break;
    store.delete(oldest.value);
  }
  return proposal;
}

/** A proposal belongs to the person who asked for it, on the register it was made against. */
export function getProposal(viewer: Persona, lesson: Lesson, proposalId: string): RegisterProposal | null {
  const proposal = proposalStore().get(proposalId);
  if (!proposal || proposal.lessonId !== lesson.id || proposal.authorId !== viewer.personId) return null;
  return proposal;
}

export function dropProposal(proposalId: string): void {
  proposalStore().delete(proposalId);
}

// ------------------------------------------------------------------ writes

/**
 * The guardian hears about an unexplained absence and about a bunk, because a
 * child on the premises who is not in the room is the more urgent of the two.
 * Silent on a repeat of the same status, so a correction does not re-alarm.
 */
export function notifyGuardian(lesson: Lesson, studentId: string, status: AttendanceStatus, previous: AttendanceStatus | null, fromId: string): void {
  if (!isUnauthorised(status) || previous === status) return;
  const student = studentById.get(studentId);
  if (!student) return;
  const where = `${lesson.subject}, period ${lesson.period}, ${lesson.date}.`;
  notify(
    { personIds: [student.guardianId] },
    {
      kind: "attendance",
      title: status === "bunk" ? `${student.firstName} missed a period in school` : `${student.firstName} was marked absent`,
      body:
        status === "bunk"
          ? `${where} Signed in this morning but was not in the room. The class teacher is following it up.`
          : `${where} Reply to the class teacher if this is unexpected.`,
      href: "/portal/family",
      fromId,
    },
  );
}

/**
 * The single AI write path. Applies the stored proposal minus whatever the
 * teacher unticked, audits the batch and each line, and returns what landed.
 */
export function applyProposal(viewer: Persona, lesson: Lesson, proposal: RegisterProposal, skipped: Set<string>): ProposedChange[] {
  const roster = new Set(rosterFor(lesson).map((r) => r.studentId));
  const before = currentMarks(lesson);
  const now = new Date().toISOString();
  const applied: ProposedChange[] = [];

  for (const change of proposal.changes) {
    if (skipped.has(change.studentId) || !roster.has(change.studentId)) continue;
    const previous = before.get(change.studentId)?.status ?? null;
    setMark(lesson, change.studentId, change.to, change.note, viewer.personId, now);
    audit(viewer.personId, "attendance.agent-mark", "lesson", lesson.id, {
      proposalId: proposal.id,
      studentId: change.studentId,
      from: previous,
      to: change.to,
      source: proposal.source,
    });
    notifyGuardian(lesson, change.studentId, change.to, previous, viewer.personId);
    applied.push({ ...change, from: previous });
  }

  audit(viewer.personId, "attendance.agent-apply", "lesson", lesson.id, {
    proposalId: proposal.id,
    source: proposal.source,
    request: proposal.request,
    applied: applied.length,
    skipped: proposal.changes.length - applied.length,
  });
  dropProposal(proposal.id);
  return applied;
}

/** "Ahmed Hassan: present to absent" — one line of the applied summary. */
export function describeChange(change: ProposedChange): string {
  return `${change.studentName}: ${change.from ? ATTENDANCE_LABEL[change.from].toLowerCase() : "unmarked"} to ${ATTENDANCE_LABEL[change.to].toLowerCase()}`;
}

// --------------------------------------------------------------- roll-ups

/** Two unauthorised marks in one day is a pattern rather than an incident. */
const REPEAT_THRESHOLD = 2;

export interface RegisterCounts {
  counts: Record<AttendanceStatus, number>;
  pct: number | null;
}

export interface PeriodRow extends RegisterCounts {
  period: number;
  lessons: number;
  closed: number;
}

export interface ClassRow extends RegisterCounts {
  classId: string;
  className: string;
  lessons: Lesson[];
  closed: number;
}

export interface ExceptionRow {
  key: string;
  lessonId: string;
  studentId: string;
  studentName: string;
  className: string;
  period: number;
  subject: string;
  teacherName: string;
  status: AttendanceStatus;
  note: string;
  /** Why the principal is being shown this, in their own terms. */
  reason: string;
}

export interface UnclosedRow {
  lessonId: string;
  className: string;
  period: number;
  subject: string;
  teacherName: string;
  status: Lesson["status"];
}

export interface BranchRollup {
  date: string;
  classes: ClassRow[];
  periods: PeriodRow[];
  exceptions: ExceptionRow[];
  unclosed: UnclosedRow[];
  lessons: number;
  closed: number;
  pct: number | null;
  absentStudents: number;
  bunkStudents: number;
}

function countsOf(marks: AttendanceMark[]): RegisterCounts {
  return { counts: summarise(marks), pct: attendancePercent(marks.map((m) => m.status)) };
}

/** Bunk first: a child on the premises who is not in the room is the one nobody can account for. */
const EXCEPTION_RANK: Partial<Record<AttendanceStatus, number>> = { bunk: 0, absent: 1, late: 2 };

function exceptionReason(status: AttendanceStatus, repeats: number, note: string): string {
  if (status === "bunk") return note ? `In school but not in the period · ${note}` : "In school but not in the period";
  if (repeats >= REPEAT_THRESHOLD) return `${ATTENDANCE_LABEL[status]} in ${repeats} periods today`;
  return status === "absent" ? "Absent this period" : ATTENDANCE_LABEL[status];
}

/**
 * One campus, one day: the per-class and per-period picture, plus the marks
 * that need somebody to do something. Lates only earn a line when they repeat,
 * because a single late is the teacher's business and a pattern is the office's.
 */
export function branchRollup(branchId: BranchId, date: string): BranchRollup {
  const classes = classesForBranch(branchId).map((c) => ({ classId: c.id, className: c.name, lessons: lessonsForClass(c.id).filter((l) => l.date === date) }));
  const allLessons = classes.flatMap((c) => c.lessons);
  const byLesson = marksForLessons(allLessons.map((l) => l.id));
  const marksFor = (lesson: Lesson) => byLesson.get(lesson.id) ?? [];
  const allMarks = allLessons.flatMap(marksFor);

  const repeats = new Map<string, number>();
  for (const mark of allMarks) if (isUnauthorised(mark.status) || mark.status === "late") repeats.set(`${mark.studentId}:${mark.status}`, (repeats.get(`${mark.studentId}:${mark.status}`) ?? 0) + 1);

  const exceptions: ExceptionRow[] = [];
  for (const lesson of allLessons) {
    const className = classes.find((c) => c.classId === lesson.classId)?.className ?? lesson.classId;
    const teacherName = teacherById.get(lesson.teacherId)?.name ?? lesson.teacherId;
    for (const mark of marksFor(lesson)) {
      const rank = EXCEPTION_RANK[mark.status];
      if (rank === undefined) continue;
      const repeated = repeats.get(`${mark.studentId}:${mark.status}`) ?? 1;
      if (mark.status === "late" && repeated < REPEAT_THRESHOLD) continue;
      exceptions.push({
        key: `${lesson.id}:${mark.studentId}`,
        lessonId: lesson.id,
        studentId: mark.studentId,
        studentName: studentById.get(mark.studentId)?.name ?? mark.studentId,
        className,
        period: lesson.period,
        subject: lesson.subject,
        teacherName,
        status: mark.status,
        note: mark.note,
        reason: exceptionReason(mark.status, repeated, mark.note),
      });
    }
  }
  exceptions.sort(
    (a, b) => (EXCEPTION_RANK[a.status] ?? 0) - (EXCEPTION_RANK[b.status] ?? 0) || a.period - b.period || a.studentName.localeCompare(b.studentName),
  );

  const periodNumbers = [...new Set(allLessons.map((l) => l.period))].sort((a, b) => a - b);
  const periods: PeriodRow[] = periodNumbers.map((period) => {
    const lessons = allLessons.filter((l) => l.period === period);
    return { period, lessons: lessons.length, closed: lessons.filter((l) => l.status === "closed").length, ...countsOf(lessons.flatMap(marksFor)) };
  });

  return {
    date,
    classes: classes.map((c) => ({ ...c, closed: c.lessons.filter((l) => l.status === "closed").length, ...countsOf(c.lessons.flatMap(marksFor)) })),
    periods,
    exceptions,
    unclosed: allLessons
      .filter((l) => l.status !== "closed")
      .sort((a, b) => a.period - b.period)
      .map((l) => ({
        lessonId: l.id,
        className: classes.find((c) => c.classId === l.classId)?.className ?? l.classId,
        period: l.period,
        subject: l.subject,
        teacherName: teacherById.get(l.teacherId)?.name ?? l.teacherId,
        status: l.status,
      })),
    lessons: allLessons.length,
    closed: allLessons.filter((l) => l.status === "closed").length,
    pct: attendancePercent(allMarks.map((m) => m.status)),
    absentStudents: new Set(allMarks.filter((m) => m.status === "absent").map((m) => m.studentId)).size,
    bunkStudents: new Set(allMarks.filter((m) => m.status === "bunk").map((m) => m.studentId)).size,
  };
}
