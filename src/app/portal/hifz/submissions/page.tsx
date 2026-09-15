import { getViewer } from "@/lib/auth/viewer";
import { submissionsForStudent } from "@/lib/data/hifz-submissions";
import { todayISO } from "@/lib/utils";
import { EmptyState, LinkButton, PageHeader } from "@/components/ui/primitives";
import { DeniedState, HIFZ_STUDENT_ID, canSeeStudentHifz } from "@/components/hifz/access";
import { SubmissionList } from "@/components/hifz/submission-list";

export default async function HifzSubmissionsPage() {
  const viewer = await getViewer();
  if (!canSeeStudentHifz(viewer)) return <DeniedState />;

  const today = todayISO();
  const submissions = submissionsForStudent(HIFZ_STUDENT_ID);
  const pending = submissions.filter((s) => s.status === "pending").length;

  return (
    <>
      <PageHeader
        eyebrow="Hifz"
        title="My recitations"
        description={
          pending
            ? `${pending} ${pending === 1 ? "recitation is" : "recitations are"} with your ustadh. A mark appears here once he has heard it — nothing is scored before then.`
            : "Everything you have sent to your ustadh, and the marks he wrote back."
        }
        actions={
          <LinkButton href="/portal/hifz/recite" variant="soft">
            Listen &amp; recite
          </LinkButton>
        }
      />

      <p className="text-xs text-ink-3">
        Recordings are held in this demo server&apos;s memory only. They are not saved to disk, not shared beyond your ustadh, and clear when the server restarts.
      </p>

      {submissions.length ? (
        <SubmissionList submissions={submissions} today={today} />
      ) : (
        <EmptyState
          title="Nothing sent yet"
          body="Record a passage on Listen & recite and send it to your ustadh. It will appear here with his mark once he has heard it."
          action={
            <LinkButton href="/portal/hifz/recite" variant="soft">
              Record a passage
            </LinkButton>
          }
        />
      )}
    </>
  );
}
