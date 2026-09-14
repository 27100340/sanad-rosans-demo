import { BookOpen, Layers, Sparkles } from "lucide-react";
import { StudioForm, type BankQuestion, type StudioTopic } from "@/components/teach/studio-form";
import { Denied, teacherSpace } from "@/components/teach/guard";
import { PageHeader, Stat } from "@/components/ui/primitives";
import { getViewer } from "@/lib/auth/viewer";
import { subjectIdForSpace } from "@/lib/ai/assess";
import { questionsForSubject } from "@/lib/data/mock/questions";
import { classById } from "@/lib/data/mock/people";

export default async function StudioPage({ params }: { params: Promise<{ spaceId: string }> }) {
  const { spaceId } = await params;
  const viewer = await getViewer();
  const space = teacherSpace(viewer, spaceId);
  if (!space) return <Denied />;

  const className = classById.get(space.classId)?.name ?? space.classId;
  const subjectId = subjectIdForSpace(space);
  const topics: StudioTopic[] = space.syllabus.map((t) => ({ code: t.code, title: t.title }));
  const bank: BankQuestion[] = questionsForSubject(subjectId).map((q) => ({
    id: q.id,
    topicCode: q.topicCode,
    type: q.type,
    stem: q.stem,
    marks: q.marks,
    difficulty: q.difficulty,
  }));
  const covered = topics.filter((t) => bank.some((q) => q.topicCode === t.code)).length;

  return (
    <>
      <PageHeader
        eyebrow={`${space.subject} · ${className}`}
        title="Studio"
        description="Draft a question against one syllabus topic, edit every line of it, then add it to the subject's bank so the test builder can pick it up."
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-6">
        <Stat label="Syllabus topics" value={topics.length} icon={<Layers size={18} />} tone="accent" />
        <Stat label="Questions in the bank" value={bank.length} trend={subjectId || "this subject"} icon={<BookOpen size={18} />} tone="info" />
        <Stat label="Topics covered" value={covered} trend={`of ${topics.length}`} icon={<Sparkles size={18} />} tone={covered === topics.length && topics.length ? "ok" : "warn"} />
      </div>

      <StudioForm spaceId={space.id} topics={topics} bank={bank} />
    </>
  );
}
