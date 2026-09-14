import { getViewer } from "@/lib/auth/viewer";
import { studentById } from "@/lib/data/mock/people";
import { ASSIGNMENTS, spaceById } from "@/lib/data/mock/spaces";
import { run } from "@/lib/ai/marker";

interface Body {
  assignmentId?: string;
  submissionId?: string;
}

export async function POST(req: Request) {
  const viewer = await getViewer();
  if (viewer.role !== "teacher") return Response.json({ error: "forbidden" }, { status: 403 });

  const body = (await req.json().catch(() => ({}))) as Body;
  const assignment = ASSIGNMENTS.find((a) => a.id === body.assignmentId);
  if (!assignment || spaceById.get(assignment.spaceId)?.teacherId !== viewer.personId) return Response.json({ error: "unknown assignment" }, { status: 400 });
  const submission = assignment.submissions.find((s) => s.id === body.submissionId);
  if (!submission) return Response.json({ error: "unknown submission" }, { status: 400 });

  const firstName = studentById.get(submission.studentId)?.firstName ?? "Student";
  const out = await run({
    question: assignment.question,
    answer: submission.answer,
    markScheme: assignment.markScheme,
    maxMarks: assignment.maxMarks,
    firstName,
  });
  return Response.json({ submissionId: submission.id, ...out });
}
