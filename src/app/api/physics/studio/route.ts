/**
 * Physics Studio. POST asks a question and returns a guided answer, always
 * labelled AI-assisted. PUT sends the student's own answer to a teacher for
 * review. Nothing here can produce a teacher-verified label; only the review
 * route can, and only for a teacher seat.
 */
import { getViewer } from "@/lib/auth/viewer";
import { viewerRestriction } from "@/lib/auth/access";
import { askPhysicsStudio } from "../_ai/studio";
import { addAnswer, requestReview } from "@/lib/data/physics";
import { HELP_MODES, type HelpMode } from "@/lib/domain/physics";
import { isTopic } from "@/content/physics/topics";
import { classById, studentById } from "@/lib/data/mock/people";

const MIN_QUESTION_CHARS = 10;
const MAX_QUESTION_CHARS = 900;
/** Physics Studio sits in the Senior section; below Grade 7 the guardian-supported activities apply. */
const MIN_YEAR = 7;

interface Body {
  question?: string;
  topic?: string;
  mode?: string;
  id?: string;
}

async function learner() {
  const viewer = await getViewer();
  if (viewer.role !== "student" || !viewer.studentId) return null;
  if (viewerRestriction(viewer)) return null;
  const student = studentById.get(viewer.studentId);
  if (!student || student.hifz) return null;
  if ((classById.get(student.classId)?.year ?? 0) < MIN_YEAR) return null;
  return student;
}

function helpMode(value: string | undefined): HelpMode {
  return HELP_MODES.includes(value as HelpMode) ? (value as HelpMode) : "hint";
}

export async function POST(req: Request) {
  const student = await learner();
  if (!student) return Response.json({ error: "Physics Studio is for Senior section students." }, { status: 403 });

  const body = (await req.json().catch(() => ({}))) as Body;
  const question = (body.question ?? "").trim().slice(0, MAX_QUESTION_CHARS);
  if (question.length < MIN_QUESTION_CHARS) return Response.json({ error: "Write your question out in a sentence so the studio can teach the method." }, { status: 400 });

  const topic = body.topic && isTopic(body.topic) ? body.topic : "";
  const mode = helpMode(body.mode);
  const grade = classById.get(student.classId)?.name ?? "";

  const out = await askPhysicsStudio({ question, mode, topic, firstName: student.firstName, grade });
  const answer = addAnswer({
    studentId: student.id,
    studentName: student.name,
    classId: student.classId,
    topic: out.topic,
    mode,
    question,
    answer: out.answer,
    live: out.live,
  });
  return Response.json({ answer });
}

export async function PUT(req: Request) {
  const student = await learner();
  if (!student) return Response.json({ error: "Physics Studio is for Senior section students." }, { status: 403 });

  const body = (await req.json().catch(() => ({}))) as Body;
  if (!body.id) return Response.json({ error: "Which answer should be reviewed?" }, { status: 400 });

  const answer = requestReview(body.id, student.id);
  if (!answer) return Response.json({ error: "That answer is not yours to send for review." }, { status: 403 });
  return Response.json({ answer });
}
