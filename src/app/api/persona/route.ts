import { NextResponse } from "next/server";
import { VIEW_AS_COOKIE } from "@/lib/auth/impersonate";
import { PERSONA_COOKIE, findPersona } from "@/lib/auth/personas";

/** Demo only: switch the viewing persona. Production replaces this with Supabase auth. */
export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { id?: string };
  const persona = findPersona(body.id);
  const res = NextResponse.json({ ok: true, home: persona.home, id: persona.id });
  res.cookies.set(PERSONA_COOKIE, persona.id, { path: "/", sameSite: "lax", httpOnly: false, maxAge: 60 * 60 * 24 * 30 });
  // Changing seat always ends any super-admin "view as", so the new seat is what it says it is.
  res.cookies.delete(VIEW_AS_COOKIE);
  return res;
}
