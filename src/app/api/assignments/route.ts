/**
 * Student assignment submissions. POST stores the answer for an assignment
 * in one of the student's own spaces and marks it at once with the
 * Mark-Scheme Marker (deterministic fallback), leaving the status at
 * "ai-marked" so the teacher approves or adjusts. A pending submission may
 * be replaced until it is marked.
 */
import { run } from "@/lib/ai/marker";
import { getViewer } from "@/lib/auth/viewer";
import { audit, notify } from "@/lib/data/mock/notify";
import { studentById } from "@/lib/data/mock/people";
import { ASSIGNMENTS, spaceById, spacesForClass, submitAssignment } from "@/lib/data/mock/spaces";

const MAX_ANSWER_CHARS = 6000;

export async function POST(req: Request) {
  const viewer = await getViewer();
  const student = viewer.role === "student" && viewer.studentId ? studentById.get(viewer.studentId) : undefined;
  if (!student) return Response.json({ error: "forbidden" }, { status: 403 });
  const body = (await req.json().catch(() => ({}))) as { assignmentId?: string; answer?: string };
  const assignment = ASSIGNMENTS.find((a) => a.id === body.assignmentId);
  if (!assignment || !spacesForClass(student.classId).some((s) => s.id === assignment.spaceId)) return Response.json({ error: "unknown assignment" }, { status: 400 });
  const answer = typeof body.answer === "string" ? body.answer.trim().slice(0, MAX_ANSWER_CHARS) : "";
  if (answer.length < 3) return Response.json({ error: "Write your answer first." }, { status: 400 });
  const existing = assignment.submissions.find((s) => s.studentId === student.id);
  if (existing && existing.status !== "pending") return Response.json({ error: "This work has already been marked." }, { status: 409 });

  const submission = submitAssignment(assignment, student.id, answer);
  const marked = await run({ question: assignment.question, answer, markScheme: assignment.markScheme, maxMarks: assignment.maxMarks, firstName: student.firstName });
  submission.status = "ai-marked";
  submission.awarded = marked.awarded;
  submission.points = marked.points;
  submission.feedback = marked.feedback;

  const space = spaceById.get(assignment.spaceId);
  if (space) notify({ personIds: [space.teacherId] }, { kind: "assignment", title: `${student.name} submitted ${assignment.title}`, body: `AI marked ${marked.awarded}/${assignment.maxMarks}; approve or adjust in the space.`, href: `/portal/teach/${space.id}/assignments/${assignment.id}`, fromId: student.id });
  audit(student.id, "assignment.submit", "assignment", assignment.id, { title: assignment.title, awarded: marked.awarded, maxMarks: assignment.maxMarks, live: marked.live });
  return Response.json({ submission, live: marked.live });
}
