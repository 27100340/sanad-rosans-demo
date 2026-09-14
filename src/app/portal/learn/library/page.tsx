import { BookMarked, HelpCircle, MessageSquare, Sparkles } from "lucide-react";
import { LibraryClient } from "@/components/library/library-client";
import { Denied, isLearner } from "@/components/teach/guard";
import { PageHeader, Stat } from "@/components/ui/primitives";
import { getViewer } from "@/lib/auth/viewer";
import { threadView } from "@/lib/data/library-rows";
import { contribFor } from "@/lib/data/mock/contribution";
import { threadsForClass } from "@/lib/data/mock/forum";
import { classById, studentById } from "@/lib/data/mock/people";

export default async function StudentLibraryPage() {
  const viewer = await getViewer();
  const student = isLearner(viewer) && viewer.studentId ? studentById.get(viewer.studentId) : undefined;
  if (!student) return <Denied />;

  const className = classById.get(student.classId)?.name ?? "";
  const threads = threadsForClass(student.classId);
  const views = threads.map((t) => threadView(t, student.id));
  const mine = contribFor(student.id);

  return (
    <>
      <PageHeader eyebrow={`Library · ${className}`} title="Class library" description="Share resources, ask for help, raise a topic. Helping a classmate earns contribution points; the top five each month are recognised in assembly." />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-6">
        <Stat label="Posts" value={threads.length} icon={<BookMarked size={18} />} tone="accent" />
        <Stat label="Open questions" value={threads.filter((t) => t.tag === "help" && !t.posts.length).length} trend="waiting for an answer" icon={<HelpCircle size={18} />} tone="warn" />
        <Stat label="Replies" value={threads.reduce((a, t) => a + t.posts.length, 0)} icon={<MessageSquare size={18} />} tone="info" />
        <Stat label="Your points" value={mine?.total ?? 0} trend={`${mine?.monthPoints ?? 0} this month`} icon={<Sparkles size={18} />} tone="gold" />
      </div>

      <LibraryClient threads={views} classId={student.classId} className={className} me={student.id} canPin={false} />
    </>
  );
}
