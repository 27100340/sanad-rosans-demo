/**
 * Allocations. POST assigns a built paper to a class; PATCH releases the marks
 * for a test-mode allocation. Teacher seats only.
 *
 * The reference fans one allocation out into a per-student document in Supabase
 * Storage so a student read is a single download. Sanad holds one array in
 * process memory, so the allocation carries its student list instead — same
 * three modes, same fields, one fewer round trip.
 */
import { getViewer } from "@/lib/auth/viewer";
import { viewerRestriction } from "@/lib/auth/access";
import { addAllocation, paperById, publishAllocation, PHYSICS_CLASS_ID } from "@/lib/data/physics";
import { ALLOCATION_MODES, type AllocationMode } from "@/lib/domain/physics";
import { classById, peopleById, studentsInClass, teacherById } from "@/lib/data/mock/people";

const MAX_INSTRUCTIONS = 400;
const MIN_DURATION = 5;
const MAX_DURATION = 180;

interface Body {
  paperId?: string;
  mode?: string;
  instructions?: string;
  durationMin?: number;
  dueAt?: string;
  classId?: string;
  studentIds?: unknown;
  /** PATCH only. */
  allocationId?: string;
}

function allocationMode(value: string | undefined): AllocationMode {
  return ALLOCATION_MODES.includes(value as AllocationMode) ? (value as AllocationMode) : "assignment_help";
}

export async function POST(req: Request) {
  const viewer = await getViewer();
  if (viewer.role !== "teacher" || viewerRestriction(viewer)) return Response.json({ error: "Only a teacher can set a physics paper." }, { status: 403 });

  const body = (await req.json().catch(() => ({}))) as Body;
  const paper = body.paperId ? paperById(body.paperId) : undefined;
  if (!paper) return Response.json({ error: "Build a paper before setting it." }, { status: 400 });
  if (paper.createdBy !== viewer.personId) return Response.json({ error: "That paper belongs to another teacher." }, { status: 403 });

  const classId = typeof body.classId === "string" && classById.has(body.classId) ? body.classId : PHYSICS_CLASS_ID;
  const cls = classById.get(classId);
  if (!cls) return Response.json({ error: "That class does not exist." }, { status: 400 });

  const roster = studentsInClass(classId).map((s) => s.id);
  const requested = Array.isArray(body.studentIds) ? body.studentIds.filter((id): id is string => typeof id === "string") : [];
  const studentIds = requested.length ? roster.filter((id) => requested.includes(id)) : roster;
  if (!studentIds.length) return Response.json({ error: "That class has no students to set it for." }, { status: 400 });

  const rawDuration = Math.round(Number(body.durationMin));
  const durationMin = Number.isFinite(rawDuration) ? Math.min(Math.max(rawDuration, MIN_DURATION), MAX_DURATION) : paper.durationMin;

  const allocation = addAllocation({
    paperId: paper.id,
    title: paper.title,
    mode: allocationMode(body.mode),
    instructions: typeof body.instructions === "string" && body.instructions.trim() ? body.instructions.trim().slice(0, MAX_INSTRUCTIONS) : null,
    durationMin,
    dueAt: typeof body.dueAt === "string" && body.dueAt ? body.dueAt : null,
    classId,
    className: cls.name,
    studentIds,
    createdBy: viewer.personId,
    createdByName: teacherById.get(viewer.personId)?.name ?? peopleById.get(viewer.personId)?.name ?? viewer.label,
  });

  return Response.json({ allocation });
}

/** Releases marks for a test-mode allocation, which is the only way a student sees them. */
export async function PATCH(req: Request) {
  const viewer = await getViewer();
  if (viewer.role !== "teacher" || viewerRestriction(viewer)) return Response.json({ error: "Only a teacher can release marks." }, { status: 403 });

  const body = (await req.json().catch(() => ({}))) as Body;
  if (!body.allocationId) return Response.json({ error: "Which allocation?" }, { status: 400 });

  const allocation = publishAllocation(body.allocationId, viewer.personId);
  if (!allocation) return Response.json({ error: "That allocation is not yours to publish." }, { status: 403 });
  return Response.json({ allocation });
}
