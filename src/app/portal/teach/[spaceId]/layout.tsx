import type { ReactNode } from "react";
import { SpaceTabs } from "@/components/teach/space-tabs";
import { getViewer } from "@/lib/auth/viewer";
import { teacherSpace } from "@/components/teach/guard";

/** Every space page shares the tab strip; pages still run their own ownership guard. */
export default async function SpaceLayout({ children, params }: { children: ReactNode; params: Promise<{ spaceId: string }> }) {
  const { spaceId } = await params;
  const viewer = await getViewer();
  const space = teacherSpace(viewer, spaceId);
  return (
    <>
      {space ? <SpaceTabs spaceId={space.id} /> : null}
      {children}
    </>
  );
}
