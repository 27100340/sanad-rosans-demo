import type { ReactNode } from "react";
import { navFor } from "@/lib/auth/nav";
import { getViewer } from "@/lib/auth/viewer";
import { aiIsLive } from "@/lib/ai/gemini";
import { branchName } from "@/lib/config/school";
import { PortalShell } from "@/components/portal/shell";

export default async function PortalLayout({ children }: { children: ReactNode }) {
  const viewer = await getViewer();
  const roleLine = viewer.branchId ? `${viewer.role} · ${branchName(viewer.branchId)}` : `${viewer.role} · all campuses`;
  return (
    <PortalShell nav={navFor(viewer)} personaId={viewer.id} personaLabel={viewer.label} roleLine={roleLine} aiLive={aiIsLive()}>
      {children}
    </PortalShell>
  );
}
