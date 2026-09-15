/**
 * The marking agent's endpoint. Four moves, all on one register:
 *
 *   { message }                     propose a change set from the teacher's note
 *   { proposalId, answers }         say who an ambiguous or unknown name meant
 *   { proposalId, confirmed, skip } apply the stored proposal, minus dropped lines
 *   { proposalId, discard }         throw it away
 *
 * Only the third writes, and it writes the copy this server stored rather than
 * anything the browser sends: the client can drop a line from a proposal but
 * can never add one, and a register with an unanswered question still applies
 * only what was resolved. The register must be open, exactly as for a manual
 * mark, so a closed period cannot be rewritten without reopening it first.
 */
import { REQUEST_MAX_CHARS, applyAnswers, proposeMarks, type QuestionAnswer } from "@/lib/ai/attendance-agent";
import { groqIsLive } from "@/lib/ai/groq";
import { viewerRestriction } from "@/lib/auth/access";
import { getViewer } from "@/lib/auth/viewer";
import {
  applyProposal,
  currentMarks,
  describeChange,
  dropProposal,
  getProposal,
  lessonForViewer,
  putProposal,
  registerPayload,
  rosterFor,
} from "@/lib/data/attendance-register";
import { audit } from "@/lib/data/mock/notify";
import { classById } from "@/lib/data/mock/people";

interface AgentBody {
  lessonId?: string;
  message?: string;
  proposalId?: string;
  answers?: unknown;
  confirmed?: boolean;
  skip?: unknown;
  discard?: boolean;
}

const CLOSED_MESSAGE = "The register is closed. Reopen it before the agent can mark it.";
const NOT_OPEN_MESSAGE = "Open the register first, then ask the agent to mark it.";

function stringList(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === "string") : [];
}

/** A missing or empty studentId is the teacher dismissing the fragment, not a malformed answer. */
function answerList(value: unknown): QuestionAnswer[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((entry) => {
    if (!entry || typeof entry !== "object") return [];
    const { questionId, studentId } = entry as { questionId?: unknown; studentId?: unknown };
    if (typeof questionId !== "string") return [];
    return [{ questionId, studentId: typeof studentId === "string" && studentId ? studentId : null }];
  });
}

export async function POST(req: Request) {
  const viewer = await getViewer();
  if (viewerRestriction(viewer)) return Response.json({ error: "This seat is currently restricted." }, { status: 403 });

  const body = (await req.json().catch(() => ({}))) as AgentBody;
  const lesson = lessonForViewer(viewer, body.lessonId);
  if (!lesson) return Response.json({ error: "forbidden" }, { status: 403 });
  if (lesson.status === "closed") return Response.json({ error: CLOSED_MESSAGE }, { status: 409 });
  if (lesson.status !== "open") return Response.json({ error: NOT_OPEN_MESSAGE }, { status: 409 });

  const roster = rosterFor(lesson);
  const current = currentMarks(lesson);

  if (body.proposalId) {
    const proposal = getProposal(viewer, lesson, body.proposalId);
    if (!proposal) return Response.json({ error: "That proposal has expired. Ask the agent again." }, { status: 404 });

    if (body.discard) {
      dropProposal(proposal.id);
      audit(viewer.personId, "attendance.agent-discard", "lesson", lesson.id, { proposalId: proposal.id });
      return Response.json({ proposal: null, live: groqIsLive() });
    }

    if (body.confirmed === true) {
      const applied = applyProposal(viewer, lesson, proposal, new Set(stringList(body.skip)));
      return Response.json({
        ...registerPayload(lesson),
        applied,
        summary: applied.length ? `Applied ${applied.length} change${applied.length === 1 ? "" : "s"}: ${applied.map(describeChange).join("; ")}.` : "Nothing was changed.",
      });
    }

    const answers = answerList(body.answers);
    if (!answers.length) return Response.json({ error: "Nothing to confirm on that proposal." }, { status: 400 });
    applyAnswers(proposal, roster, current, answers);
    return Response.json({ proposal, live: groqIsLive() });
  }

  const message = String(body.message ?? "").trim();
  if (!message) return Response.json({ error: "Type what happened in the period." }, { status: 400 });
  if (message.length > REQUEST_MAX_CHARS) return Response.json({ error: `Keep it under ${REQUEST_MAX_CHARS.toLocaleString()} characters.` }, { status: 400 });

  const className = classById.get(lesson.classId)?.name ?? lesson.classId;
  const draft = await proposeMarks({ roster, current, lessonLabel: `${lesson.subject}, ${className}, period ${lesson.period}, ${lesson.date}`, request: message });
  const proposal = putProposal(viewer, lesson, draft);
  audit(viewer.personId, "attendance.agent-propose", "lesson", lesson.id, {
    proposalId: proposal.id,
    source: proposal.source,
    proposed: proposal.changes.length,
    questions: proposal.questions.length,
  });
  return Response.json({ proposal, live: groqIsLive() });
}
