import Link from "next/link";
import { BookOpenCheck, ShieldCheck, Users } from "lucide-react";
import { Chip, EmptyState, PageHeader, SectionTitle, Stat } from "@/components/ui/primitives";
import { AnswerRow } from "@/components/physics/answer-card";
import { getViewer } from "@/lib/auth/viewer";
import { libraryEntries, libraryTopicCounts } from "@/lib/data/physics";
import { SYLLABUS_NAME } from "@/content/physics/topics";
import { cn } from "@/lib/utils";

export default async function PhysicsLibraryPage({ searchParams }: { searchParams: Promise<{ topic?: string }> }) {
  await getViewer();
  const { topic } = await searchParams;
  const counts = libraryTopicCounts();
  const active = counts.some((c) => c.topic === topic) ? topic : undefined;
  const entries = libraryEntries(active);
  const all = libraryEntries();
  const contributors = new Set(all.map((a) => a.studentId)).size;
  const reviewers = new Set(all.map((a) => a.reviewerName).filter(Boolean)).size;

  return (
    <>
      <PageHeader
        eyebrow="Physics"
        title="Verified library"
        description={`Answers a physics teacher has read and confirmed. Nothing reaches this page on a model's say-so. ${SYLLABUS_NAME}.`}
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-6">
        <Stat label="Verified answers" value={all.length} icon={<ShieldCheck size={18} />} tone="ok" />
        <Stat label="Strands covered" value={counts.length} icon={<BookOpenCheck size={18} />} tone="accent" />
        <Stat label="Students who asked" value={contributors} icon={<Users size={18} />} tone="info" />
        <Stat label="Reviewing teachers" value={reviewers} trend="every entry signed" icon={<ShieldCheck size={18} />} tone="gold" />
      </div>

      <section>
        <SectionTitle title="Browse by strand" hint="Only strands that already have a verified answer are listed." />
        <div className="flex flex-wrap gap-2">
          <Link href="/portal/physics/library" className={cn("chip", active ? "chip-neutral" : "chip-accent")}>
            All <span className="num">{all.length}</span>
          </Link>
          {counts.map((c) => (
            <Link key={c.topic} href={`/portal/physics/library?topic=${encodeURIComponent(c.topic)}`} className={cn("chip", active === c.topic ? "chip-accent" : "chip-neutral")}>
              {c.topic} <span className="num">{c.count}</span>
            </Link>
          ))}
        </div>
      </section>

      <section>
        <SectionTitle
          title={active ?? "Every verified answer"}
          hint={`${entries.length} ${entries.length === 1 ? "entry" : "entries"}, newest first.`}
          action={active ? <Chip tone="accent">Filtered</Chip> : undefined}
        />
        {entries.length ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 lg:gap-6">
            {entries.map((a) => (
              <AnswerRow key={a.id} answer={a} href={`/portal/physics/library/${a.slug}`} />
            ))}
          </div>
        ) : (
          <EmptyState title="Nothing verified here yet" body="A teacher publishes an answer to the library after reviewing it in the Physics review queue." />
        )}
      </section>
    </>
  );
}
