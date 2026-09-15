/**
 * "View as" for the super admin: POST { personId } starts viewing the portal
 * as that person, DELETE returns to the owner seat. Only a super admin may do
 * either, and both ends are audited so the demo can show who looked at what.
 */
import { NextResponse } from "next/server";
import { VIEW_AS_COOKIE, personaForPerson } from "@/lib/auth/impersonate";
import { isSuperAdmin } from "@/lib/auth/personas";
import { getSession } from "@/lib/auth/viewer";
import { audit } from "@/lib/data/mock/notify";

const MAX_AGE = 60 * 60 * 8;

export async function POST(req: Request) {
  const { real, viewingAs } = await getSession();
  if (!isSuperAdmin(real)) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const body = (await req.json().catch(() => ({}))) as { personId?: string };
  const target = body.personId ? personaForPerson(body.personId) : null;
  if (!target || !body.personId) return NextResponse.json({ error: "unknown person" }, { status: 400 });
  audit(real.personId, "viewas.start", "person", body.personId, { person: target.label, role: target.role, from: viewingAs?.label });
  const res = NextResponse.json({ ok: true, home: target.home, label: target.label, role: target.role });
  res.cookies.set(VIEW_AS_COOKIE, body.personId, { path: "/", sameSite: "lax", httpOnly: false, maxAge: MAX_AGE });
  return res;
}

export async function DELETE() {
  const { real, viewingAs } = await getSession();
  if (!isSuperAdmin(real)) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  if (viewingAs) audit(real.personId, "viewas.end", "person", viewingAs.personId, { person: viewingAs.label });
  const res = NextResponse.json({ ok: true, home: real.home });
  res.cookies.delete(VIEW_AS_COOKIE);
  return res;
}
