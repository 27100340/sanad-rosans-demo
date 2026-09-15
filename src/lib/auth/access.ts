/**
 * Which restriction, if any, applies to the signed-in persona. Principals and
 * the chairman always bypass (they set the locks); a parent is blocked only
 * by a restriction on their own id or on every ward.
 */
import { isSuperAdmin, type Persona } from "./personas";
import { restrictionFor } from "@/lib/data/mock/access";
import { guardianById, studentById } from "@/lib/data/mock/people";
import type { AccessRestriction } from "@/lib/domain/access";

export function viewerRestriction(viewer: Persona): AccessRestriction | null {
  // The owner seat is never locked out; while it views as someone else it
  // deliberately sees that person's lock, and the banner still offers the way back.
  if (isSuperAdmin(viewer) || viewer.role === "chairman" || viewer.role === "principal") return null;
  const branchId = viewer.branchId ?? "gulberg";
  if (viewer.role === "student" && viewer.studentId) {
    const s = studentById.get(viewer.studentId);
    return restrictionFor({ personId: viewer.studentId, classId: s?.classId, branchId: s?.branchId ?? branchId, role: "student" });
  }
  if (viewer.role === "parent" && viewer.guardianId) {
    const own = restrictionFor({ personId: viewer.guardianId, branchId, role: "parent" });
    if (own) return own;
    const wards = (guardianById.get(viewer.guardianId)?.studentIds ?? []).map((id) => studentById.get(id)).filter((s): s is NonNullable<typeof s> => Boolean(s));
    const hits = wards.map((s) => restrictionFor({ personId: s.id, classId: s.classId, branchId: s.branchId, role: "student" }));
    return wards.length && hits.every((h) => h !== null) ? hits[0] : null;
  }
  return restrictionFor({ personId: viewer.personId, branchId, role: viewer.role });
}
