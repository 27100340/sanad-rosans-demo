import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Card, Chip, PageHeader, SectionTitle } from "@/components/ui/primitives";
import { GuidedAnswerView, ModeChip, ProvenanceBadge, ReviewNote, TopicChip } from "@/components/physics/answer-card";
import { getViewer } from "@/lib/auth/viewer";
import { answerBySlug, libraryEntries } from "@/lib/data/physics";
import { formulaeFor, topicGroup } from "@/content/physics/topics";

const RELATED_LIMIT = 4;

export default async function PhysicsLibraryEntryPage({ params }: { params: Promise<{ slug: string }> }) {
  await getViewer();
  const { slug } = await params;
  const answer = answerBySlug(slug);
  // Only published, verified answers are readable here; an unreviewed answer stays private to its student.
  if (!answer || !answer.inLibrary || answer.status !== "teacher-verified") notFound();

  const formulae = formulaeFor(answer.topic);
  const related = libraryEntries(answer.topic)
    .filter((a) => a.id !== answer.id)
    .slice(0, RELATED_LIMIT);

  return (
    <>
      <Link href="/portal/physics/library" className="btn-ghost btn-sm -mb-2 self-start">
        <ArrowLeft size={13} /> Verified library
      </Link>

      <PageHeader
        eyebrow={`${topicGroup(answer.topic)} · ${answer.topic}`}
        title={answer.question}
        description={`Asked by ${answer.studentName}. Reviewed and verified by ${answer.reviewerName ?? "a physics teacher"}.`}
        actions={<ProvenanceBadge status={answer.status} reviewerName={answer.reviewerName} />}
      />

      <div className="grid gap-4 lg:grid-cols-3 lg:gap-6">
        <div className="space-y-4 lg:col-span-2">
          {answer.reviewNote ? <ReviewNote note={answer.reviewNote} reviewerName={answer.reviewerName} reviewedAt={answer.reviewedAt} /> : null}
          <Card className="space-y-4">
            <div className="flex flex-wrap items-center gap-1.5">
              <TopicChip topic={answer.topic} />
              <ModeChip mode={answer.mode} />
              <Chip tone="neutral">Asked {answer.askedAt.slice(0, 10)}</Chip>
            </div>
            <GuidedAnswerView answer={answer.answer} />
            <p className="border-t border-line pt-3 text-2xs leading-5 text-ink-3">
              The body of this answer was drafted in Physics Studio and then read line by line by {answer.reviewerName ?? "a physics teacher"} before it was
              published. The teacher&apos;s own note is shown separately above, never merged into the answer.
            </p>
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="space-y-3">
            <p className="eyebrow">Strand</p>
            <p className="text-sm font-semibold text-ink">{answer.topic}</p>
            <p className="text-xs text-ink-3">{topicGroup(answer.topic)} half of the course</p>
            {formulae.length ? (
              <div>
                <p className="mb-1.5 text-xs font-semibold text-ink">Relationships</p>
                <ul className="space-y-1">
                  {formulae.map((f) => (
                    <li key={f} className="num rounded-lg bg-surface-2 px-2.5 py-1.5 text-xs text-ink-2">
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </Card>

          {related.length ? (
            <Card>
              <SectionTitle title="Also verified on this strand" />
              <ul className="space-y-2">
                {related.map((a) => (
                  <li key={a.id}>
                    <Link href={`/portal/physics/library/${a.slug}`} className="group flex items-start gap-2 rounded-lg px-2 py-1.5 hover:bg-surface-2">
                      <ArrowRight size={13} className="mt-1 shrink-0 text-ink-3 group-hover:text-accent" />
                      <span className="text-xs leading-5 text-ink-2">{a.question}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </Card>
          ) : null}
        </div>
      </div>
    </>
  );
}
