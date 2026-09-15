import type { ReactNode } from "react";
import { viewerRestriction } from "@/lib/auth/access";
import { navFor } from "@/lib/auth/nav";
import { getSession } from "@/lib/auth/viewer";
import { aiIsLive } from "@/lib/ai/gemini";
import { groqIsLive } from "@/lib/ai/groq";
import { branchName } from "@/lib/config/school";
import { AccessBlocked } from "@/components/portal/access-blocked";
import { PortalShell } from "@/components/portal/shell";

export default async function PortalLayout({ children }: { children: ReactNode }) {
  const { viewer, real, viewingAs } = await getSession();
  const roleLine = viewer.branchId ? `${viewer.role} · ${branchName(viewer.branchId)}` : `${viewer.role} · all campuses`;
  // A lock keeps the seat signed in but shows the message instead of any portal activity.
  const restriction = viewerRestriction(viewer);
  return (
    <PortalShell
      nav={restriction ? [] : navFor(viewer)}
      personaId={real.id}
      personaLabel={viewer.label}
      role={viewer.role}
      roleLine={roleLine}
      aiLive={aiIsLive() || groqIsLive()}
      viewingAs={viewingAs ? { label: viewingAs.label, role: viewingAs.role } : null}
    >
      {restriction ? <AccessBlocked restriction={restriction} /> : children}
    </PortalShell>
  );
}
