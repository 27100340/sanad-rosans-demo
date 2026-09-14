/**
 * Access restrictions store. Empty by default so every demo persona can get
 * in; the principal's Access page adds locks and suspensions at runtime.
 * Production: an access_restrictions table read once per request.
 */
import { findApplicable, isRestrictionActive, type AccessContext, type AccessRestriction } from "@/lib/domain/access";
import { singleton } from "../store";

const MAX = 500;

export const RESTRICTIONS: AccessRestriction[] = singleton("accessRestrictions", () => []);

export function listRestrictions(): AccessRestriction[] {
  return [...RESTRICTIONS].sort((a, b) => Number(isRestrictionActive(b)) - Number(isRestrictionActive(a)) || b.createdAt.localeCompare(a.createdAt));
}

export function restrictionFor(ctx: AccessContext): AccessRestriction | null {
  return findApplicable(RESTRICTIONS, ctx);
}

export function addRestriction(input: Omit<AccessRestriction, "id" | "createdAt" | "releasedAt" | "releasedBy">): AccessRestriction {
  const r: AccessRestriction = { ...input, id: `ar-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`, createdAt: new Date().toISOString(), releasedAt: null, releasedBy: null };
  RESTRICTIONS.unshift(r);
  if (RESTRICTIONS.length > MAX) RESTRICTIONS.length = MAX;
  return r;
}

export function releaseRestriction(id: string, by: string): AccessRestriction | null {
  const r = RESTRICTIONS.find((x) => x.id === id);
  if (!r || r.releasedAt) return null;
  r.releasedAt = new Date().toISOString();
  r.releasedBy = by;
  return r;
}

/** Releases every active person-scoped restriction on someone; returns how many. */
export function releaseForPerson(personId: string, by: string): number {
  let n = 0;
  for (const r of RESTRICTIONS) {
    if (r.scope === "person" && r.scopeKey === personId && isRestrictionActive(r)) {
      r.releasedAt = new Date().toISOString();
      r.releasedBy = by;
      n += 1;
    }
  }
  return n;
}
