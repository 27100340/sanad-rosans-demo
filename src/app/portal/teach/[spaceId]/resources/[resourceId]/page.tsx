import { Chip, EmptyState, LinkButton, PageHeader } from "@/components/ui/primitives";
import { getViewer } from "@/lib/auth/viewer";
import { RESOURCE_NOTES } from "@/lib/data/mock/learn-extra";
import { Denied, teacherSpace } from "@/components/teach/guard";
import { RESOURCE_STATUS } from "@/components/teach/helpers";

export default async function ResourcePage({ params }: { params: Promise<{ spaceId: string; resourceId: string }> }) {
  const { spaceId, resourceId } = await params;
  const viewer = await getViewer();
  const space = teacherSpace(viewer, spaceId);
  if (!space) return <Denied />;

  const resource = space.resources.find((r) => r.id === resourceId);
  const notes = RESOURCE_NOTES[resourceId];
  if (!resource || !notes) return <EmptyState title="Resource not found" body="Only teacher uploads open here; external links open on their own site." />;
  const status = RESOURCE_STATUS[resource.status];

  return (
    <>
      <PageHeader
        eyebrow={`${space.subject} · ${resource.source}`}
        title={resource.title}
        description={notes.summary}
        actions={
          <>
            <Chip tone={status.tone}>{status.label}</Chip>
            {resource.tutorMayCite ? <Chip tone="accent">Tutor may cite</Chip> : null}
            <LinkButton href={`/portal/teach/${space.id}`} variant="ghost">Back to space</LinkButton>
          </>
        }
      />
      <div className="card divide-y divide-line">
        {notes.sections.map((s) => (
          <section key={s.heading} className="p-5">
            <h3 className="text-sm font-semibold text-ink">{s.heading}</h3>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-ink-2">
              {s.points.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </>
  );
}
