/**
 * Proctor sessions. Student: start (POST action "start"), post forensic
 * events, store a violation snapshot, request an unlock. Teacher: list every
 * session across their spaces (GET ?list=1), read one session or its snapshot
 * (GET), unlock (PATCH). Locked sessions freeze until the owning teacher
 * unlocks them.
 */
import { getViewer } from "@/lib/auth/viewer";
import type { Persona } from "@/lib/auth/personas";
import { studentById } from "@/lib/data/mock/people";
import { spaceById } from "@/lib/data/mock/spaces";
import { attemptById, testById } from "@/lib/data/mock/tests";
import { appendEvents, getSession, requestUnlock, saveSnapshot, SNAPSHOTS, startSession, unlockSession } from "@/lib/data/mock/proctor";
import type { GuardEventType, ProctorEvent } from "@/lib/domain/proctor";
import { audit, notify } from "@/lib/data/mock/notify";
import { proctorRowsForTeacher } from "@/lib/data/proctor-list";

function ownsAttempt(viewer: Persona, attemptId: string | undefined): "student" | "teacher" | null {
  const attempt = attemptId ? attemptById.get(attemptId) : undefined;
  if (!attempt) return null;
  if (viewer.role === "student" && viewer.studentId === attempt.studentId) return "student";
  const test = testById.get(attempt.testId);
  const space = test ? spaceById.get(test.spaceId) : undefined;
  if (viewer.role === "teacher" && space?.teacherId === viewer.personId) return "teacher";
  return null;
}

function cleanEvents(raw: unknown): ProctorEvent[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((e): e is { type: string; reason?: string; terminal?: boolean; source?: string } => Boolean(e) && typeof e === "object" && typeof (e as { type?: unknown }).type === "string")
    .slice(0, 200)
    .map((e) => ({
      type: e.type as GuardEventType,
      reason: typeof e.reason === "string" ? e.reason.slice(0, 300) : "",
      terminal: Boolean(e.terminal),
      at: Date.now(),
      source: e.source === "camera" ? "camera" : "guard",
    }));
}

interface PostBody {
  attemptId?: string;
  action?: "start" | "events" | "snapshot" | "request-unlock";
  cameraConsent?: boolean;
  events?: unknown;
  snapshot?: string;
  reason?: string;
  note?: string;
}

export async function POST(req: Request) {
  const viewer = await getViewer();
  const body = (await req.json().catch(() => ({}))) as PostBody;
  if (ownsAttempt(viewer, body.attemptId) !== "student" || !body.attemptId) return Response.json({ error: "forbidden" }, { status: 403 });
  const attempt = attemptById.get(body.attemptId);
  const test = attempt ? testById.get(attempt.testId) : undefined;
  if (!attempt || !test) return Response.json({ error: "unknown attempt" }, { status: 400 });
  const now = Date.now();

  switch (body.action) {
    case "start": {
      const s = startSession({ attemptId: attempt.id, studentId: attempt.studentId, testId: test.id, mode: test.guardMode ?? "off", cameraConsent: Boolean(body.cameraConsent) }, now);
      return Response.json({ session: s });
    }
    case "events": {
      const s = appendEvents(attempt.id, cleanEvents(body.events), now);
      if (!s) return Response.json({ error: "no session" }, { status: 400 });
      return Response.json({ status: s.status, lockedReason: s.lockedReason, events: s.events.length });
    }
    case "snapshot": {
      const id = saveSnapshot(attempt.id, typeof body.snapshot === "string" ? body.snapshot : "", typeof body.reason === "string" ? body.reason.slice(0, 200) : "", now);
      return Response.json({ snapshotId: id });
    }
    case "request-unlock":
      return Response.json({ ok: requestUnlock(attempt.id, typeof body.note === "string" ? body.note : "", now) });
    default:
      return Response.json({ error: "unknown action" }, { status: 400 });
  }
}

export async function GET(req: Request) {
  const viewer = await getViewer();
  const url = new URL(req.url);
  if (url.searchParams.get("list") === "1") {
    if (viewer.role !== "teacher") return Response.json({ error: "forbidden" }, { status: 403 });
    return Response.json({ sessions: proctorRowsForTeacher(viewer.personId) });
  }
  const attemptId = url.searchParams.get("attemptId") ?? undefined;
  const who = ownsAttempt(viewer, attemptId);
  if (!who || !attemptId) return Response.json({ error: "forbidden" }, { status: 403 });
  const snapshotId = url.searchParams.get("snapshot");
  if (snapshotId) {
    // An <img> src: answer with bytes or with a bodiless status, never a JSON
    // body the browser would have to fail to decode.
    if (who !== "teacher") return new Response(null, { status: 403 });
    const dataUrl = SNAPSHOTS.get(snapshotId);
    if (!dataUrl || !snapshotId.startsWith(attemptId)) return new Response(null, { status: 404 });
    // The store accepts jpeg/png/webp, and the global nosniff header means a
    // wrong content-type renders as a broken image, so take it from the data URL.
    const match = /^data:(image\/[a-z+]+);base64,(.*)$/is.exec(dataUrl);
    if (!match) return new Response(null, { status: 404 });
    return new Response(Buffer.from(match[2], "base64"), { headers: { "content-type": match[1], "cache-control": "private, no-store" } });
  }
  const s = getSession(attemptId);
  if (!s) return Response.json({ session: null });
  const student = studentById.get(s.studentId);
  return Response.json({ session: who === "teacher" ? { ...s, studentName: student?.name ?? s.studentId } : { status: s.status, lockedReason: s.lockedReason, unlockRequest: s.unlockRequest, unlock: s.unlock, events: s.events.length } });
}

export async function PATCH(req: Request) {
  const viewer = await getViewer();
  const body = (await req.json().catch(() => ({}))) as { attemptId?: string; unlock?: boolean; note?: string };
  if (ownsAttempt(viewer, body.attemptId) !== "teacher" || !body.attemptId) return Response.json({ error: "forbidden" }, { status: 403 });
  if (!body.unlock) return Response.json({ error: "unknown action" }, { status: 400 });
  const ok = unlockSession(body.attemptId, viewer.personId, typeof body.note === "string" ? body.note : "", Date.now());
  if (ok) {
    const attempt = attemptById.get(body.attemptId);
    audit(viewer.personId, "proctor.unlock", "attempt", body.attemptId, { note: body.note });
    if (attempt) notify({ personIds: [attempt.studentId] }, { kind: "test", title: "Your locked test was unlocked", body: "Your teacher granted one fresh sit. Open the test to begin again.", href: `/portal/learn/tests/${attempt.id}`, fromId: viewer.personId });
  }
  return Response.json({ ok });
}
