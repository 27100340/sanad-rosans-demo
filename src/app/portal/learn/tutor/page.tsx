import { PageHeader } from "@/components/ui/primitives";
import { getViewer } from "@/lib/auth/viewer";
import { studentById } from "@/lib/data/mock/people";
import { spacesForClass } from "@/lib/data/mock/spaces";
import { introFor } from "@/lib/ai/tutor";
import { Denied, isLearner } from "@/components/teach/guard";
import { TutorChat, type TutorSpaceOption } from "@/components/learn/tutor-chat";

const POLICY_LABEL = { "hint-only": "Hints only", "worked-example": "Worked examples", full: "Full solutions" } as const;

export default async function TutorPage({ searchParams }: { searchParams: Promise<{ space?: string; quiz?: string }> }) {
  const viewer = await getViewer();
  const student = isLearner(viewer) && viewer.studentId ? studentById.get(viewer.studentId) : undefined;
  if (!student) return <Denied />;
  const { space: spaceParam, quiz } = await searchParams;

  const spaces: TutorSpaceOption[] = spacesForClass(student.classId).map((s) => ({
    id: s.id,
    subject: s.subject,
    intro: introFor(s, student.firstName),
    policy: POLICY_LABEL[s.tutorRules.answerPolicy],
    unlocked: s.syllabus.filter((t) => s.tutorRules.allowedTopics.includes(t.code)).map((t) => t.code),
  }));
  const initialSpaceId = spaces.find((s) => s.id === spaceParam)?.id ?? spaces[0]?.id ?? "";

  return (
    <>
      <PageHeader eyebrow="Tutor" title="Ask a step at a time" description="Each space follows its teacher's rules. Ask in English or Urdu." />
      <TutorChat spaces={spaces} initialSpaceId={initialSpaceId} autoQuiz={quiz === "1"} />
    </>
  );
}
