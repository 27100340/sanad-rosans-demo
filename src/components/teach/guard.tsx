import { EmptyState, PageHeader } from "@/components/ui/primitives";
import type { Persona } from "@/lib/auth/personas";
import type { SubjectSpace } from "@/lib/domain/types";
import { spaceById } from "@/lib/data/mock/spaces";

export function Denied() {
  return (
    <>
      <PageHeader eyebrow="Access" title="Not available for this seat" />
      <EmptyState title="This seat cannot see this page" body="Switch persona from the top bar to a seat that owns this view." />
    </>
  );
}

/** The teacher may only open a space assigned to them. */
export function teacherSpace(viewer: Persona, spaceId: string): SubjectSpace | null {
  if (viewer.role !== "teacher") return null;
  const space = spaceById.get(spaceId);
  return space && space.teacherId === viewer.personId ? space : null;
}

/** Any student on the academic (non-Hifz) track. Hifz students use the /portal/hifz seat. */
export function isLearner(viewer: Persona): boolean {
  return viewer.role === "student" && Boolean(viewer.studentId) && !viewer.home.startsWith("/portal/hifz") && viewer.home !== "/portal/learning";
}


export function isParent(viewer: Persona): boolean {
  return viewer.role === "parent" && Boolean(viewer.guardianId);
}
