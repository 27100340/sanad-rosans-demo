/**
 * Access locks. The principal (own branch) or chairman GETs the list, POSTs
 * a lock or suspension by scope, and PATCHes a release. Every change is
 * audited and the affected people are notified so the lock message is the
 * next thing they see.
 */
import { getViewer } from "@/lib/auth/viewer";
import type { Persona } from "@/lib/auth/personas";
import { branchName, type BranchId } from "@/lib/config/school";
import { addRestriction, listRestrictions, releaseRestriction } from "@/lib/data/mock/access";
import { audit, notify, personName } from "@/lib/data/mock/notify";
import { classById, studentById, studentsInClass } from "@/lib/data/mock/people";
import { DEFAULT_LOCK_MESSAGE, isAccessMode, isAccessScope, type AccessScope } from "@/lib/domain/access";

function canManage(viewer: Persona): boolean {
  return viewer.role === "chairman" || viewer.role === "principal";
}

function labelFor(scope: AccessScope, key: string): string | null {
  if (scope === "person") return personName(key) === key ? null : personName(key);
  if (scope === "class") return classById.get(key)?.name ?? null;
  if (scope === "branch") return branchName(key as BranchId);
  return key;
}

function peopleFor(scope: AccessScope, key: string): string[] {
  if (scope === "person") return [key];
  if (scope === "class") return studentsInClass(key).map((s) => s.id);
  if (scope === "branch") return [...studentById.values()].filter((s) => s.branchId === key).map((s) => s.id);
  return [];
}

export async function GET() {
  const viewer = await getViewer();
  if (!canManage(viewer)) return Response.json({ error: "forbidden" }, { status: 403 });
  return Response.json({ restrictions: listRestrictions() });
}

export async function POST(req: Request) {
  const viewer = await getViewer();
  if (!canManage(viewer)) return Response.json({ error: "forbidden" }, { status: 403 });
  const body = (await req.json().catch(() => ({}))) as { scope?: string; scopeKey?: string; mode?: string; message?: string; endsAt?: string | null };
  if (!isAccessScope(body.scope) || !isAccessMode(body.mode)) return Response.json({ error: "Pick a scope and a mode." }, { status: 400 });
  const scopeKey = (body.scopeKey ?? "").trim();
  const scopeLabel = scopeKey ? labelFor(body.scope, scopeKey) : null;
  if (!scopeLabel) return Response.json({ error: "Pick who the restriction applies to." }, { status: 400 });
  if (viewer.role === "principal") {
    const branchOf = body.scope === "person" ? studentById.get(scopeKey)?.branchId : body.scope === "class" ? classById.get(scopeKey)?.branchId : body.scope === "branch" ? scopeKey : null;
    if (branchOf && branchOf !== viewer.branchId) return Response.json({ error: "That is outside your branch." }, { status: 403 });
  }
  const endsAt = typeof body.endsAt === "string" && body.endsAt ? new Date(body.endsAt).toISOString() : null;
  const message = (body.message ?? "").trim().slice(0, 500) || DEFAULT_LOCK_MESSAGE;
  const r = addRestriction({ scope: body.scope, scopeKey, scopeLabel, mode: body.mode, message, startsAt: null, endsAt, createdBy: viewer.personId });
  const people = peopleFor(body.scope, scopeKey);
  if (people.length) notify({ personIds: people }, { kind: "message", title: body.mode === "suspended" ? "Your portal access has been suspended" : "Your portal access is locked", body: message, fromId: viewer.personId });
  audit(viewer.personId, "access.lock", "access", r.id, { scope: body.scope, target: scopeLabel, mode: body.mode, endsAt: endsAt ?? undefined });
  return Response.json({ restriction: r });
}

export async function PATCH(req: Request) {
  const viewer = await getViewer();
  if (!canManage(viewer)) return Response.json({ error: "forbidden" }, { status: 403 });
  const body = (await req.json().catch(() => ({}))) as { id?: string };
  const r = body.id ? releaseRestriction(body.id, viewer.personId) : null;
  if (!r) return Response.json({ error: "Nothing to release." }, { status: 400 });
  const people = peopleFor(r.scope, r.scopeKey);
  if (people.length) notify({ personIds: people }, { kind: "message", title: "Your portal access has been restored", body: "You can use every part of the portal again.", fromId: viewer.personId });
  audit(viewer.personId, "access.unlock", "access", r.id, { scope: r.scope, target: r.scopeLabel });
  return Response.json({ restriction: r });
}
