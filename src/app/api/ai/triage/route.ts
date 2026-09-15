import { NextResponse } from "next/server";
import { run } from "@/lib/ai/triage";
import { getViewer } from "@/lib/auth/viewer";
import { PARENT_MESSAGES } from "@/lib/data/mock/comms";
import { guardianById, studentById } from "@/lib/data/mock/people";

/** Parent inbox triage: drafts a reply for one message. Principals and leadership only. */
export async function POST(req: Request) {
  const viewer = await getViewer();
  if (!["chairman", "principal", "superadmin"].includes(viewer.role)) {
    return NextResponse.json({ error: "This seat cannot draft replies." }, { status: 403 });
  }
  const body = (await req.json().catch(() => ({}))) as { messageId?: string };
  const message = PARENT_MESSAGES.find((m) => m.id === body.messageId);
  if (!message) return NextResponse.json({ error: "Message not found." }, { status: 404 });
  if (viewer.branchId && viewer.branchId !== message.branchId) {
    return NextResponse.json({ error: "Message belongs to another branch." }, { status: 403 });
  }
  const guardian = guardianById.get(message.guardianId);
  const studentFirstNames = (guardian?.studentIds ?? []).map((id) => studentById.get(id)?.firstName).filter((n): n is string => Boolean(n));
  const result = await run({ message, studentFirstNames, guardianLanguage: guardian?.preferredLanguage ?? "en" });
  return NextResponse.json(result);
}
