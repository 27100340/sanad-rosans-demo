import Link from "next/link";
import { BookOpenCheck, Clock, ShieldCheck, Sparkles } from "lucide-react";
import { Card, PageHeader, SectionTitle, Stat } from "@/components/ui/primitives";
import { Denied } from "@/components/teach/guard";
import { ReviewQueue } from "@/components/physics/review-queue";
import { ProvenanceBadge, TopicChip } from "@/components/physics/answer-card";
import { getViewer } from "@/lib/auth/viewer";
import { libraryEntries, reviewQueue, verifiedAnswers } from "@/lib/data/physics";

const RECENT_LIMIT = 6;

export default async function PhysicsReviewPage() {
  const viewer = await getViewer();
  if (viewer.role !== "teacher") return <Denied />;

  const pending = reviewQueue();
  const verified = verifiedAnswers();
  const published = libraryEntries();
  const oldest = pending[0]?.askedAt.slice(0, 10);

  return (
    <>
      <PageHeader
        eyebrow="Teacher · Physics"
        title="Review queue"
        description="Students ask Physics Studio for help and send the answer here when they want a person to confirm it. Verifying is the only way an answer earns your name."
        actions={
          <Link href="/portal/physics/library" className="btn-outline btn-sm">
            <BookOpenCheck size={14} /> Open the library
          </Link>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-6">
        <Stat label="Waiting on you" value={pending.length} trend={oldest ? `oldest ${oldest}` : "nothing queued"} icon={<Clock size={18} />} tone={pending.length ? "warn" : "ok"} />
        <Stat label="Verified" value={verified.length} icon={<ShieldCheck size={18} />} tone="ok" />
        <Stat label="In the library" value={published.length} icon={<BookOpenCheck size={18} />} tone="accent" />
        <Stat label="Verified but unpublished" value={verified.length - published.length} trend="kept private to the student" icon={<Sparkles size={18} />} tone="neutral" />
      </div>

      <section>
        <SectionTitle title="Waiting for review" hint="Oldest first. Read the answer before you verify it; the label is the product." />
        <ReviewQueue pending={pending} />
      </section>

      <section>
        <SectionTitle title="Recently verified" hint="Your last decisions, newest first." />
        {verified.length ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 lg:gap-6">
            {verified.slice(0, RECENT_LIMIT).map((a) => (
              <Card key={a.id} className="flex flex-col gap-2.5">
                <div className="flex flex-wrap items-center gap-1.5">
                  <TopicChip topic={a.topic} />
                  <ProvenanceBadge status={a.status} reviewerName={a.reviewerName} />
                </div>
                <p className="text-sm font-medium leading-6 text-ink">{a.question}</p>
                <p className="line-clamp-3 text-xs leading-5 text-ink-3">{a.reviewNote}</p>
                <div className="mt-auto flex items-center justify-between gap-3 pt-1">
                  <span className="num text-2xs text-ink-3">{a.studentName}</span>
                  {a.inLibrary ? (
                    <Link href={`/portal/physics/library/${a.slug}`} className="btn-ghost btn-sm">
                      In the library
                    </Link>
                  ) : (
                    <span className="text-2xs text-ink-3">Not published</span>
                  )}
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <p className="text-sm text-ink-3">Nothing verified yet this term.</p>
          </Card>
        )}
      </section>
    </>
  );
}
