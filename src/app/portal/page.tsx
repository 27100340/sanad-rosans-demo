import { redirect } from "next/navigation";
import { getViewer } from "@/lib/auth/viewer";

export default async function PortalIndex() {
  const viewer = await getViewer();
  redirect(viewer.home);
}
