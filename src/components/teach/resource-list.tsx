import Link from "next/link";
import { ExternalLink, FileText } from "lucide-react";
import { Chip } from "@/components/ui/primitives";
import type { Resource } from "@/lib/domain/types";
import { RESOURCE_STATUS, isExternalUrl } from "./helpers";

const KIND_LABEL: Record<Resource["kind"], string> = {
  syllabus: "Syllabus",
  "past-papers": "Past papers",
  textbook: "Textbook",
  video: "Video",
  notes: "Notes",
  worksheet: "Worksheet",
  link: "Link",
};

function ResourceTitle({ resource }: { resource: Resource }) {
  const cls = "inline-flex items-center gap-1.5 text-sm font-medium text-ink hover:text-accent";
  if (isExternalUrl(resource.url)) {
    return (
      <a href={resource.url} target="_blank" rel="noopener noreferrer" className={cls}>
        {resource.title}
        <ExternalLink size={13} className="shrink-0 text-ink-3" />
      </a>
    );
  }
  return (
    <Link href={resource.url} className={cls}>
      {resource.title}
      <FileText size={13} className="shrink-0 text-ink-3" />
    </Link>
  );
}

export function ResourceList({ resources }: { resources: Resource[] }) {
  return (
    <div className="card divide-y divide-line">
      {resources.map((r) => {
        const status = RESOURCE_STATUS[r.status];
        return (
          <div key={r.id} className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <ResourceTitle resource={r} />
              <p className="mt-0.5 text-xs text-ink-3">{r.source}</p>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              <Chip tone="neutral">{KIND_LABEL[r.kind]}</Chip>
              <Chip tone={status.tone}>{status.label}</Chip>
              {r.tutorMayCite ? <Chip tone="accent">Tutor may cite</Chip> : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}
