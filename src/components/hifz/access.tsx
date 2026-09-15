import { isSuperAdmin, type Persona } from "@/lib/auth/personas";
import { EmptyState } from "@/components/ui/primitives";

export const HIFZ_STUDENT_ID = "s-zaid-hassan";

/** Student Hifz pages: the Hifz student's own seat, or the ustadh looking over the shoulder. */
export function canSeeStudentHifz(viewer: Persona): boolean {
  if (viewer.role === "ustadh" || isSuperAdmin(viewer)) return true;
  return viewer.role === "student" && viewer.studentId === HIFZ_STUDENT_ID;
}

/** Ustadh pages: the ustadh and leadership seats. */
export function canSeeUstadh(viewer: Persona): boolean {
  return viewer.role === "ustadh" || viewer.role === "chairman" || viewer.role === "principal" || isSuperAdmin(viewer);
}

export function DeniedState() {
  return <EmptyState title="This seat cannot see this page" body="Switch to the Hifz student or the ustadh persona from the top bar." />;
}
