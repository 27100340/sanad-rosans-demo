import { PageHeader } from "@/components/ui/primitives";
import { getViewer } from "@/lib/auth/viewer";
import { classById, guardianById, studentById, teacherById } from "@/lib/data/mock/people";
import { FAMILY_THREAD } from "@/lib/data/mock/learn-extra";
import { Denied, isParent } from "@/components/teach/guard";
import { MessageThread } from "@/components/family/message-thread";

export default async function MessagesPage() {
  const viewer = await getViewer();
  const guardian = isParent(viewer) && viewer.guardianId ? guardianById.get(viewer.guardianId) : undefined;
  if (!guardian) return <Denied />;

  const firstWard = guardian.studentIds.map((id) => studentById.get(id)).find((s) => s && !s.hifz);
  const cls = firstWard ? classById.get(firstWard.classId) : undefined;
  const teacherName = cls ? (teacherById.get(cls.classTeacherId)?.name ?? "Class teacher") : "Class teacher";

  return (
    <>
      <PageHeader eyebrow={guardian.name} title="Messages" description={firstWard ? `Thread with ${firstWard.firstName}'s class teacher.` : "Thread with the class teacher."} />
      <div className="max-w-2xl">
        <MessageThread teacherName={teacherName} parentName={guardian.name} messages={FAMILY_THREAD} />
      </div>
    </>
  );
}
