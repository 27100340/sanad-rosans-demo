import { cookies } from "next/headers";
import { DEFAULT_PERSONA, PERSONA_COOKIE, findPersona, type Persona } from "./personas";

/** Server-side: who is looking. Demo reads a cookie; production reads the Supabase session. */
export async function getViewer(): Promise<Persona> {
  const jar = await cookies();
  return findPersona(jar.get(PERSONA_COOKIE)?.value ?? DEFAULT_PERSONA);
}
