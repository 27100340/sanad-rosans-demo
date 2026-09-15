/**
 * GET /api/hifz/submission/[id]/audio — plays a submitted recitation back to
 * the qari (or to the student who sent it). The bytes come from the in-memory
 * store; raw recorder PCM is wrapped in a WAV header on the way out so an
 * <audio> element can play it. Never cached: the clip is not a stored asset.
 */
import { NextResponse } from "next/server";
import { getViewer } from "@/lib/auth/viewer";
import { findSubmission, playableAudio } from "@/lib/data/hifz-submissions";
import { mayHearSubmission } from "../../guards";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const viewer = await getViewer();
  const { id } = await params;
  const submission = findSubmission(id);
  if (!submission) return NextResponse.json({ error: "No such submission." }, { status: 404 });
  if (!mayHearSubmission(viewer, submission)) return NextResponse.json({ error: "This recording is only for the student and his ustadh." }, { status: 403 });

  const audio = playableAudio(id);
  if (!audio) return NextResponse.json({ error: "No recording is held for this submission." }, { status: 404 });

  return new NextResponse(new Uint8Array(audio.body), {
    headers: {
      "content-type": audio.mimeType,
      "content-length": String(audio.body.length),
      "cache-control": "no-store",
    },
  });
}
