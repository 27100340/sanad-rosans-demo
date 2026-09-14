import { AlertTriangle, Award, CheckCircle2, ListChecks } from "lucide-react";
import { TaskList } from "@/components/learn/task-list";
import { taskRow } from "@/components/learn/task-rows";
import { Denied, isLearner } from "@/components/teach/guard";
import { LinkButton, PageHeader, Stat } from "@/components/ui/primitives";
import { getViewer } from "@/lib/auth/viewer";
import { studentById } from "@/lib/data/mock/people";
import { tasksForStudent } from "@/lib/data/mock/tasks";
import { isOverdue, pointsEarned } from "@/lib/domain/tasks";
import { todayISO } from "@/lib/utils";

export default async function LearnTasksPage() {
  const viewer = await getViewer();
  const student = isLearner(viewer) && viewer.studentId ? studentById.get(viewer.studentId) : undefined;
  if (!student) return <Denied />;

  const today = todayISO();
  const tasks = tasksForStudent(student.id);
  const open = tasks.filter((t) => t.status !== "done").length;
  const overdue = tasks.filter((t) => isOverdue(t, today)).length;
  const done = tasks.length - open;
  const earned = pointsEarned(tasks);
  const offered = tasks.reduce((a, t) => a + t.points, 0);

  return (
    <>
      <PageHeader eyebrow="Tasks" title="Tasks and challenges" description="Set by your teachers and your study plan. Start a task, finish it, and the points count towards your effort score." actions={<LinkButton href="/portal/learn/study-plan" variant="soft">My study plan</LinkButton>} />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-6">
        <Stat label="To do" value={open} icon={<ListChecks size={18} />} tone={open ? "accent" : "ok"} />
        <Stat label="Overdue" value={overdue} icon={<AlertTriangle size={18} />} tone={overdue ? "danger" : "ok"} />
        <Stat label="Done" value={done} trend={`of ${tasks.length} set`} icon={<CheckCircle2 size={18} />} tone="ok" />
        <Stat label="Points" value={earned} trend={`of ${offered} offered`} icon={<Award size={18} />} tone="gold" />
      </div>

      <TaskList rows={tasks.map((t) => taskRow(t, today))} />
    </>
  );
}
