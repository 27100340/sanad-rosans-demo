import type { HifzSubmission } from "@/lib/domain/hifz-marking";

/** mm:ss, or an em dash when the client could not measure the clip. */
export function fmtClipLength(seconds: number): string {
  if (!seconds) return "—";
  const mins = Math.floor(seconds / 60);
  return `${mins}:${String(Math.round(seconds - mins * 60)).padStart(2, "0")}`;
}

const MEMORY_NOTE =
  "The recording is held in this server's memory for the demo session only. It is not saved to disk, and it is not sent anywhere else unless the student taps the experimental AI check.";

/**
 * Plays a submitted recitation back. When no clip is held the reason is shown
 * verbatim rather than an empty player.
 */
export function SubmissionAudio({ submission }: { submission: HifzSubmission }) {
  if (!submission.audioAvailable) {
    return <p className="rounded-xl border border-dashed border-line-strong px-4 py-3 text-xs text-ink-3">{submission.audioNote ?? "No recording is held for this submission."}</p>;
  }
  return (
    <div>
      <audio controls preload="none" src={`/api/hifz/submission/${submission.id}/audio`} className="w-full" />
      <p className="mt-1.5 text-2xs text-ink-3">{MEMORY_NOTE}</p>
    </div>
  );
}
