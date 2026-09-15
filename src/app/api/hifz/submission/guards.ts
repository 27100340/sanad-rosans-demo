/**
 * Who may send a recitation, hear one, and mark it. Not a route — shared by
 * the three submission routes and by the marking desk page.
 *
 * A submission carries a child's voice, so hearing one is deliberately
 * narrower than the rest of the Hifz module: only the student it belongs to
 * and the qari who teaches him, never the leadership seats that can otherwise
 * read the halaqa board.
 */
import type { Persona } from "@/lib/auth/personas";
import type { HifzSubmission } from "@/lib/domain/hifz-marking";
import { viewerRestriction } from "@/lib/auth/access";
import { HIFZ_STUDENT_ID } from "@/components/hifz/access";

/** The student a submission would be filed under, or null if this seat may not send one. */
export function submitAsStudent(viewer: Persona): string | null {
  if (viewerRestriction(viewer)) return null;
  // The ustadh records the child in the halaqa on his own device, so the
  // recite page works from his seat too; the clip is still filed to the student.
  if (viewer.role === "ustadh") return HIFZ_STUDENT_ID;
  if (viewer.role === "student" && viewer.studentId === HIFZ_STUDENT_ID) return viewer.studentId;
  return null;
}

export function mayMarkHifz(viewer: Persona): boolean {
  return !viewerRestriction(viewer) && viewer.role === "ustadh";
}

export function mayHearSubmission(viewer: Persona, submission: HifzSubmission): boolean {
  if (viewerRestriction(viewer)) return false;
  if (viewer.role === "ustadh") return true;
  return viewer.role === "student" && viewer.studentId === submission.studentId;
}
