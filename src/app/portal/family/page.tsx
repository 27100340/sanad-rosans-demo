import { PageHeader } from "@/components/ui/primitives";
import { getViewer } from "@/lib/auth/viewer";
import { aiIsLive } from "@/lib/ai/gemini";
import { fallback } from "@/lib/ai/brief";
import { classById, guardianById, studentById } from "@/lib/data/mock/people";
import { Denied, isParent } from "@/components/teach/guard";
import { BriefBoard, type BriefCardData } from "@/components/family/brief-board";

export default async function FamilyBriefPage() {
  const viewer = await getViewer();
  const guardian = isParent(viewer) && viewer.guardianId ? guardianById.get(viewer.guardianId) : undefined;
  if (!guardian) return <Denied />;

  const cards: BriefCardData[] = guardian.studentIds.flatMap((id) => {
    const student = studentById.get(id);
    if (!student) return [];
    return [
      {
        studentId: id,
        firstName: student.firstName,
        className: classById.get(student.classId)?.name ?? "",
        hifz: Boolean(student.hifz),
        en: fallback({ studentId: id, language: "en" }),
        ur: fallback({ studentId: id, language: "ur" }),
      },
    ];
  });

  return (
    <>
      <PageHeader eyebrow={guardian.name} title="Tonight's brief" description="One card per child, ending with one action for tonight." />
      <BriefBoard cards={cards} aiLive={aiIsLive()} />
    </>
  );
}
