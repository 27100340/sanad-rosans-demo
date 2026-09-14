/** The signed-in person's portal preferences: GET reads, PATCH merges the allowed keys. */
import { getViewer } from "@/lib/auth/viewer";
import type { Persona } from "@/lib/auth/personas";
import { preferencesFor, savePreferences, type Preferences } from "@/lib/data/mock/preferences";

function personId(viewer: Persona): string {
  return viewer.studentId ?? viewer.guardianId ?? viewer.personId;
}

export async function GET() {
  const viewer = await getViewer();
  return Response.json({ preferences: preferencesFor(personId(viewer)) });
}

export async function PATCH(req: Request) {
  const viewer = await getViewer();
  const body = (await req.json().catch(() => ({}))) as Partial<Preferences>;
  const patch: Partial<Preferences> = {};
  if (body.language === "en" || body.language === "ur") patch.language = body.language;
  for (const key of ["notifyEmail", "notifyPush", "notifyWhatsapp", "showNameOnBoards"] as const) if (typeof body[key] === "boolean") patch[key] = body[key];
  if (body.digestDay === "fri" || body.digestDay === "sat" || body.digestDay === "off") patch.digestDay = body.digestDay;
  return Response.json({ preferences: savePreferences(personId(viewer), patch) });
}
