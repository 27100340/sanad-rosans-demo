/** Runs one automation now for the principal's branch (or the chairman's chosen branch) and records the run. */
import { getViewer } from "@/lib/auth/viewer";
import type { BranchId } from "@/lib/config/school";
import { runJob } from "@/lib/data/automations-run";
import { isJobId } from "@/lib/data/mock/automations";
import { audit } from "@/lib/data/mock/notify";

export async function POST(req: Request) {
  const viewer = await getViewer();
  if (viewer.role !== "principal" && viewer.role !== "chairman") return Response.json({ error: "forbidden" }, { status: 403 });
  const body = (await req.json().catch(() => ({}))) as { jobId?: string; branchId?: string };
  if (!isJobId(body.jobId)) return Response.json({ error: "unknown job" }, { status: 400 });
  const branchId = (viewer.branchId ?? body.branchId ?? "gulberg") as BranchId;
  const run = runJob(body.jobId, branchId, viewer.personId);
  audit(viewer.personId, "automation.run", "automation", body.jobId, { summary: run.summary });
  return Response.json({ run });
}
