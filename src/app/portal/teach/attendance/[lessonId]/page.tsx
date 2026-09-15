import { LESSON_STATUS } from "@/components/attend/lesson-list";
import { Register } from "@/components/attendance/register";
import { canSeePrincipal } from "@/components/leadership/seat-guard";
import { Denied } from "@/components/teach/guard";
import { fmtDay } from "@/components/teach/helpers";
import { Chip, LinkButton, PageHeader } from "@/components/ui/primitives";
import { groqIsLive } from "@/lib/ai/groq";
import { getViewer } from "@/lib/auth/viewer";
import { lessonForViewer, registerPayload } from "@/lib/data/attendance-register";
import { lessonById } from "@/lib/data/mock/attendance";
import { classById, teacherById } from "@/lib/data/mock/people";

export default async function RegisterPage({ params }: { params: Promise<{ lessonId: string }> }) {
  const { lessonId } = await params;
  const viewer = await getViewer();
  // `lessonForViewer` is the same gate the API uses, so what a seat can see here
  // is exactly what it can save. Leadership keeps a read-only view of any period
  // on its campus even when the gate would not let it mark.
  const lesson = lessonForViewer(viewer, lessonId) ?? lessonById.get(lessonId) ?? null;
  const owns = Boolean(lesson) && viewer.role === "teacher" && lesson?.teacherId === viewer.personId;
  if (!lesson || (!owns && !canSeePrincipal(viewer))) return <Denied />;

  const className = classById.get(lesson.classId)?.name ?? lesson.classId;
  const teacherName = teacherById.get(lesson.teacherId)?.name ?? lesson.teacherId;
  const { rows } = registerPayload(lesson);
  const st = LESSON_STATUS[lesson.status];

  return (
    <>
      <PageHeader
        eyebrow={`${lesson.subject} · ${className} · Period ${lesson.period} · ${fmtDay(lesson.date)}`}
        title="Register"
        description={`Room ${lesson.room} · ${teacherName} · ${rows.length} student${rows.length === 1 ? "" : "s"} · ${st.label.toLowerCase()}.`}
        actions={
          <>
            <Chip tone={st.tone}>{st.label}</Chip>
            {owns ? (
              <LinkButton href="/portal/teach/attendance" variant="ghost" className="btn-sm">
                All lessons
              </LinkButton>
            ) : null}
          </>
        }
      />
      <Register lessonId={lesson.id} status={lesson.status} rows={rows} canEdit={owns} aiLive={groqIsLive()} />
    </>
  );
}
