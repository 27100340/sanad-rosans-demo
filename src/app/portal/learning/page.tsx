import { getViewer } from "@/lib/auth/viewer";
import { guardianById, studentById, classById } from "@/lib/data/mock/people";
import { LESSON_PLANS, OBSERVATIONS } from "@/lib/data/teaching";
import { STAGES, stageFor } from "@/lib/domain/teaching";
import { PageHeader, Chip } from "@/components/ui/primitives";
import { SeatDenied } from "@/components/leadership/seat-guard";
export default async function LearningPage() {
  const p = await getViewer();
  if (!["student", "parent"].includes(p.role))
    return <SeatDenied home={p.home} />;
  const ids =
    p.role === "parent"
      ? (guardianById.get(p.guardianId ?? "")?.studentIds ?? [])
      : [p.studentId ?? ""];
  const learners = ids
    .map((id) => studentById.get(id))
    .filter((s): s is NonNullable<typeof s> => !!s && !s.hifz);
  return (
    <>
      <PageHeader
        eyebrow="Learning & home connection"
        title={
          p.role === "parent" ? "Learning together" : "My learning journey"
        }
        description="Teacher-published activities, supportive feedback and next steps."
      />
      {learners.length === 0 && (
        <p>Hifz activities are available in the dedicated Hifz pathway.</p>
      )}
      {learners.map((s) => {
        const c = classById.get(s.classId)!;
        const stage = STAGES[stageFor(c)];
        return (
          <section key={s.id} className="space-y-4">
            <h2 className="text-xl font-semibold">
              {s.firstName} · {c.name}
            </h2>
            <p className="text-sm text-ink-2">{stage.home}</p>
            {LESSON_PLANS.filter(
              (l) => l.classId === c.id && l.status === "published",
            ).map((l) => (
              <article key={l.id} className="card p-5 space-y-3">
                <Chip>{l.subject}</Chip>
                <h3 className="font-semibold">{l.title}</h3>
                <p className="text-sm">{l.objective}</p>
                <p className="text-sm">
                  <strong>Try together:</strong> {l.home}
                </p>
              </article>
            ))}
            {OBSERVATIONS.filter((o) => o.studentId === s.id).map((o) => (
              <div className="card p-5" key={o.id}>
                <Chip>{o.attainment}</Chip>
                <p className="mt-2 text-sm">{o.note}</p>
              </div>
            ))}
          </section>
        );
      })}
    </>
  );
}
