import { cookies } from "next/headers";
import { DEFAULT_PERSONA, PERSONA_COOKIE, findPersona, isSuperAdmin, type Persona } from "./personas";
import { VIEW_AS_COOKIE, personaForPerson } from "./impersonate";

/** Server-side: who is looking. Demo reads a cookie; production reads the Supabase session. */
export async function getViewer(): Promise<Persona> {
  return (await getSession()).viewer;
}

export interface Session {
  /** The persona every guard should judge: the impersonated person when the owner is viewing as someone. */
  viewer: Persona;
  /** The seat that actually signed in. */
  real: Persona;
  /** Set only while a super admin is viewing as someone else. */
  viewingAs: Persona | null;
}

/**
 * The signed-in seat plus any "view as" in force. Pages and API routes use
 * `getViewer()`; only the shell and the owner's own controls need the real seat.
 */
export async function getSession(): Promise<Session> {
  const jar = await cookies();
  const real = findPersona(jar.get(PERSONA_COOKIE)?.value ?? DEFAULT_PERSONA);
  if (!isSuperAdmin(real)) return { viewer: real, real, viewingAs: null };
  const target = jar.get(VIEW_AS_COOKIE)?.value;
  const viewingAs = target ? personaForPerson(target) : null;
  return { viewer: viewingAs ?? real, real, viewingAs };
}
