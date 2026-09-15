import Link from "next/link";
import { ArrowRight, BookOpenCheck, ClipboardList } from "lucide-react";
import { AiPill, Card, PageHeader, SectionTitle } from "@/components/ui/primitives";
import { Denied, isLearner } from "@/components/teach/guard";
import { StudioForm } from "@/components/physics/studio-form";
import { getViewer } from "@/lib/auth/viewer";
import { groqIsLive } from "@/lib/ai/groq";
import { studentById, teacherById } from "@/lib/data/mock/people";
import { allocationsForStudent, answersForStudent, libraryEntries, PHYSICS_TEACHER_ID } from "@/lib/data/physics";
import { A2_TOPICS, AS_TOPICS, SYLLABUS_NAME, SYLLABUS_YEARS } from "@/content/physics/topics";

const RECENT_LIMIT = 6;

const FLOW = [
  { n: "01", t: "Ask", b: "Write the question in your own words and pick the strand, or let the studio find it." },
  { n: "02", t: "Choose the help", b: "A hint, a worked example on different numbers, or examiner style showing where the marks sit." },
  { n: "03", t: "Request a review", b: "Send the answer to your teacher when you want it confirmed by a person." },
  { n: "04", t: "Verified", b: "Once checked it is labelled teacher-verified, and it may join the library for everyone." },
];

export default async function PhysicsStudioPage() {
  const viewer = await getViewer();
  const student = isLearner(viewer) && viewer.studentId ? studentById.get(viewer.studentId) : undefined;
  if (!student) return <Denied />;

  const teacherName = teacherById.get(PHYSICS_TEACHER_ID)?.name ?? "your physics teacher";
  const recent = answersForStudent(student.id).slice(0, RECENT_LIMIT);
  const verifiedCount = libraryEntries().length;
  const openAssignments = allocationsForStudent(student.id).length;

  return (
    <>
      <PageHeader
        eyebrow="Physics Studio"
        title="Ask physics. Get taught, not told."
        description={`${SYLLABUS_NAME}, ${SYLLABUS_YEARS}. The studio explains the method and hands the work back to you. Every answer is labelled: AI-assisted until ${teacherName} checks it.`}
        actions={
          <>
            <AiPill live={groqIsLive()} />
            {openAssignments ? (
              <Link href="/portal/physics/assignments" className="btn-soft btn-sm">
                <ClipboardList size={14} />
                Papers set for you
                <span className="num">{openAssignments}</span>
              </Link>
            ) : null}
            <Link href="/portal/physics/library" className="btn-outline btn-sm">
              <BookOpenCheck size={14} />
              Verified library
              <span className="num text-ink-3">{verifiedCount}</span>
            </Link>
          </>
        }
      />

      <StudioForm
        topicGroups={[
          { group: "AS", topics: AS_TOPICS },
          { group: "A2", topics: A2_TOPICS },
        ]}
        teacherName={teacherName}
        recent={recent}
      />

      <section>
        <SectionTitle title="How the studio works" hint="AI helps you learn; a person verifies. The two labels are never mixed." />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 lg:gap-4">
          {FLOW.map((f) => (
            <Card key={f.n} className="flex flex-col gap-1.5">
              <span className="num text-lg font-semibold leading-none text-accent">{f.n}</span>
              <p className="text-sm font-medium text-ink">{f.t}</p>
              <p className="text-xs leading-5 text-ink-3">{f.b}</p>
            </Card>
          ))}
        </div>
      </section>

      <Card className="flex flex-col gap-2">
        <p className="eyebrow">Honesty</p>
        <p className="max-w-prose text-sm leading-6 text-ink-2">
          The studio never writes in {teacherName}&apos;s name. An answer stays labelled AI-assisted until he reads it, and only then does it carry his name.
          When no model is reachable the studio still answers, from the department&apos;s own scripted method for that strand, and says so.
        </p>
        <Link href="/portal/physics/library" className="btn-ghost btn-sm self-start">
          Browse what has already been verified <ArrowRight size={13} />
        </Link>
      </Card>
    </>
  );
}
