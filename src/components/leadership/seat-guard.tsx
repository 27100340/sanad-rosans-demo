import type { Persona } from "@/lib/auth/personas";
import { EmptyState, LinkButton } from "@/components/ui/primitives";

/** Role predicates for the two management seats. Pages render `SeatDenied` when these fail. */
export function canSeeLeadership(viewer: Persona): boolean {
  return viewer.role === "chairman";
}

export function canSeePrincipal(viewer: Persona): boolean {
  return viewer.role === "chairman" || viewer.role === "principal";
}

/** Day-to-day branch operations: the principal's own screens, shared with the section coordinator. */
export function canSeeBranchStaff(viewer: Persona): boolean {
  return canSeePrincipal(viewer) || viewer.role === "coordinator";
}

export function SeatDenied({ home }: { home: string }) {
  return (
    <EmptyState
      title="This seat cannot see this page"
      body="Switch persona from the top bar to view it, or return to your own home."
      action={<LinkButton href={home} variant="soft">Go to my home</LinkButton>}
    />
  );
}
