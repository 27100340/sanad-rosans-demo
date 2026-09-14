import { Chip } from "@/components/ui/primitives";
import type { Tone } from "@/components/ui/primitives";
import type { Student } from "@/lib/domain/types";
import { ASSIGNMENTS, spacesForClass } from "@/lib/data/mock/spaces";
import { fmtDay } from "@/components/teach/helpers";

export interface TaskRow {
  id: string;
  title: string;
  subject: string;
  dueDate: string;
  maxMarks: number;
  state: "due" | "submitted" | "marked";
  awarded?: number;
}

const STATE: Record<TaskRow["state"], { label: string; tone: Tone }> = {
  due: { label: "Due", tone: "warn" },
  submitted: { label: "Submitted", tone: "info" },
  marked: { label: "Marked", tone: "ok" },
};

export function tasksForStudent(student: Student): TaskRow[] {
  const spaces = spacesForClass(student.classId);
  return ASSIGNMENTS.filter((a) => spaces.some((s) => s.id === a.spaceId))
    .map((a) => {
      const sub = a.submissions.find((s) => s.studentId === student.id);
      const state: TaskRow["state"] = !sub ? "due" : sub.awarded !== undefined ? "marked" : "submitted";
      return { id: a.id, title: a.title, subject: spaces.find((s) => s.id === a.spaceId)?.subject ?? "", dueDate: a.dueDate, maxMarks: a.maxMarks, state, awarded: sub?.awarded };
    })
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
}

export function TodayTasks({ tasks }: { tasks: TaskRow[] }) {
  if (!tasks.length) return <p className="text-sm text-ink-3">Nothing due. Well done.</p>;
  return (
    <div className="card divide-y divide-line">
      {tasks.map((t) => {
        const st = STATE[t.state];
        return (
          <div key={t.id} className="flex items-center gap-3 p-4">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-ink">{t.title}</p>
              <p className="mt-0.5 text-xs text-ink-3">
                {t.subject} · due {fmtDay(t.dueDate)}
              </p>
            </div>
            {t.state === "marked" ? (
              <span className="num text-sm font-semibold text-ink">
                {t.awarded}/{t.maxMarks}
              </span>
            ) : null}
            <Chip tone={st.tone}>{st.label}</Chip>
          </div>
        );
      })}
    </div>
  );
}
