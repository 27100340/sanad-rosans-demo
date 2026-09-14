import type { TaskRowData } from "@/components/learn/task-list";
import { fmtDay } from "@/components/teach/helpers";
import { teacherById } from "@/lib/data/mock/people";
import { spaceById } from "@/lib/data/mock/spaces";
import { isOverdue, type Task } from "@/lib/domain/tasks";

/** Server-side shaping of a task for the client list. */
export function taskRow(t: Task, today: string): TaskRowData {
  return {
    id: t.id,
    kind: t.kind,
    title: t.title,
    body: t.body,
    subject: t.spaceId ? (spaceById.get(t.spaceId)?.subject ?? "") : "",
    teacherName: t.generatedKey ? "Study plan" : (teacherById.get(t.teacherId)?.name ?? ""),
    dueLabel: fmtDay(t.dueAt),
    overdue: isOverdue(t, today),
    points: t.points,
    status: t.status,
    mandatory: t.mandatory,
    activityType: t.activityType,
    expectedMinutes: t.expectedMinutes,
    resourceUrl: t.resourceUrl,
  };
}
