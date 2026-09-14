import Link from "next/link";
import { BookMarked, HelpCircle, MessageSquare, Pin } from "lucide-react";
import { LibraryClient } from "@/components/library/library-client";
import { Denied } from "@/components/teach/guard";
import { EmptyState, PageHeader, Stat } from "@/components/ui/primitives";
import { getViewer } from "@/lib/auth/viewer";
import { threadView } from "@/lib/data/library-rows";
import { threadsForClass } from "@/lib/data/mock/forum";
import { classById } from "@/lib/data/mock/people";
import { spacesForTeacher } from "@/lib/data/repo";
import { cn } from "@/lib/utils";

export default async function TeacherLibraryPage({ searchParams }: { searchParams: Promise<{ class?: string }> }) {
  const viewer = await getViewer();
  if (viewer.role !== "teacher") return <Denied />;
  const { class: requested } = await searchParams;
  const classIds = [...new Set(spacesForTeacher(viewer.personId).map((s) => s.classId))];
  const classId = classIds.includes(requested ?? "") ? (requested as string) : classIds[0];
  if (!classId) return <EmptyState title="No classes yet" />;

  const className = classById.get(classId)?.name ?? classId;
  const threads = threadsForClass(classId);
  const views = threads.map((t) => threadView(t, viewer.personId));

  return (
    <>
      <PageHeader eyebrow="Teacher" title="Class library" description="What your students are sharing and asking. Answer a question, mark a good reply helpful, pin what the whole class should read." />

      <div className="flex flex-wrap gap-1.5">
        {classIds.map((id) => (
          <Link key={id} href={`/portal/teach/library?class=${encodeURIComponent(id)}`} className={cn(id === classId ? "btn-soft btn-sm" : "btn-outline btn-sm")}>
            {classById.get(id)?.name ?? id}
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-6">
        <Stat label="Posts" value={threads.length} trend={className} icon={<BookMarked size={18} />} tone="accent" />
        <Stat label="Unanswered" value={threads.filter((t) => t.tag === "help" && !t.posts.length).length} trend="questions with no reply" icon={<HelpCircle size={18} />} tone="warn" />
        <Stat label="Replies" value={threads.reduce((a, t) => a + t.posts.length, 0)} icon={<MessageSquare size={18} />} tone="info" />
        <Stat label="Pinned" value={threads.filter((t) => t.pinned).length} icon={<Pin size={18} />} tone="gold" />
      </div>

      <LibraryClient threads={views} classId={classId} className={className} me={viewer.personId} canPin />
    </>
  );
}
