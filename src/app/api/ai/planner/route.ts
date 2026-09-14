import { getViewer } from "@/lib/auth/viewer";
import { run } from "@/lib/ai/planner";
import { spaceById } from "@/lib/data/mock/spaces";

interface Body {
  spaceId?: string;
  topicCode?: string;
  subtopic?: string;
}

export async function POST(req: Request) {
  const viewer = await getViewer();
  if (viewer.role !== "teacher") return Response.json({ error: "forbidden" }, { status: 403 });

  const body = (await req.json().catch(() => ({}))) as Body;
  const space = body.spaceId ? spaceById.get(body.spaceId) : undefined;
  if (!space || space.teacherId !== viewer.personId || typeof body.topicCode !== "string") return Response.json({ error: "bad request" }, { status: 400 });

  const out = await run({ spaceId: space.id, topicCode: body.topicCode, subtopic: typeof body.subtopic === "string" ? body.subtopic : "" });
  return Response.json(out);
}
