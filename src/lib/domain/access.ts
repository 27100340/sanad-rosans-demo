/**
 * Portal access restrictions: lock (temporary, with a message and optional
 * window) or suspend (until released) by scope. Pure matching; the store in
 * lib/data/mock/access.ts persists them. Ported from the reference
 * access-shared.ts: the most specific active restriction wins
 * (person, then class, then branch, then role) and staff above the scope
 * always bypass it.
 */
export type AccessScope = "person" | "class" | "branch" | "role";
export type AccessMode = "locked" | "suspended";

export interface AccessRestriction {
  id: string;
  scope: AccessScope;
  scopeKey: string; // person id, class id, branch id or role name
  scopeLabel: string;
  mode: AccessMode;
  message: string;
  startsAt: string | null; // ISO datetime
  endsAt: string | null;
  createdBy: string;
  createdAt: string;
  releasedAt: string | null;
  releasedBy: string | null;
}

export interface AccessContext {
  personId: string;
  classId?: string;
  branchId: string;
  role: string;
}

export const SCOPE_PRIORITY: AccessScope[] = ["person", "class", "branch", "role"];

export const DEFAULT_LOCK_MESSAGE = "Your portal access has been paused by the school. Please contact your class teacher or the school office.";

export function isRestrictionActive(r: AccessRestriction, now = new Date().toISOString()): boolean {
  if (r.releasedAt) return false;
  if (r.startsAt && r.startsAt > now) return false;
  if (r.endsAt && r.endsAt <= now) return false;
  return true;
}

function matches(r: AccessRestriction, ctx: AccessContext): boolean {
  switch (r.scope) {
    case "person":
      return r.scopeKey === ctx.personId;
    case "class":
      return Boolean(ctx.classId) && r.scopeKey === ctx.classId;
    case "branch":
      return r.scopeKey === ctx.branchId;
    case "role":
      return r.scopeKey === ctx.role;
  }
}

/** The restriction that applies to this viewer right now, most specific first; null when none. */
export function findApplicable(restrictions: AccessRestriction[], ctx: AccessContext, now = new Date().toISOString()): AccessRestriction | null {
  const active = restrictions.filter((r) => isRestrictionActive(r, now) && matches(r, ctx));
  if (!active.length) return null;
  return [...active].sort((a, b) => SCOPE_PRIORITY.indexOf(a.scope) - SCOPE_PRIORITY.indexOf(b.scope) || b.createdAt.localeCompare(a.createdAt))[0];
}

export function isAccessScope(v: unknown): v is AccessScope {
  return v === "person" || v === "class" || v === "branch" || v === "role";
}

export function isAccessMode(v: unknown): v is AccessMode {
  return v === "locked" || v === "suspended";
}
