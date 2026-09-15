/**
 * Teacher review. The only route that can set the teacher-verified label, and
 * the only route that can publish an answer to the library. Teacher seats only;
 * the reviewer's name is taken from the signed-in persona, never from the body,
 * so an answer cannot be signed in someone else's name.
 */
import { getViewer } from "@/lib/auth/viewer";
import { viewerRestriction } from "@/lib/auth/access";
import { verifyAnswer } from "@/lib/data/physics";
import { peopleById, teacherById } from "@/lib/data/mock/people";

const MIN_NOTE_CHARS = 10;
const MAX_NOTE_CHARS = 600;

interface Body {
  id?: string;
  note?: string;
  publish?: boolean;
}

export async function POST(req: Request) {
  const viewer = await getViewer();
  if (viewer.role !== "teacher" || viewerRestriction(viewer)) return Response.json({ error: "Only a teacher can verify a physics answer." }, { status: 403 });

  const body = (await req.json().catch(() => ({}))) as Body;
  if (!body.id) return Response.json({ error: "Which answer are you verifying?" }, { status: 400 });

  const note = (body.note ?? "").trim().slice(0, MAX_NOTE_CHARS);
  if (note.length < MIN_NOTE_CHARS) return Response.json({ error: "Add a line of your own so the student knows what you checked." }, { status: 400 });

  const reviewerName = teacherById.get(viewer.personId)?.name ?? peopleById.get(viewer.personId)?.name ?? viewer.label;
  const answer = verifyAnswer({ id: body.id, reviewerId: viewer.personId, reviewerName, note, publish: body.publish === true });
  if (!answer) return Response.json({ error: "That answer no longer exists." }, { status: 404 });
  return Response.json({ answer });
}
