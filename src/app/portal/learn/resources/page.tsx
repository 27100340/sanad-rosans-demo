import { BookOpen, FileText, Link2, Sparkles } from "lucide-react";
import { Denied, isLearner } from "@/components/teach/guard";
import { ResourceList } from "@/components/teach/resource-list";
import { PageHeader, SectionTitle, Stat } from "@/components/ui/primitives";
import { getViewer } from "@/lib/auth/viewer";
import { studentById, teacherById } from "@/lib/data/mock/people";
import { spacesForClass } from "@/lib/data/mock/spaces";

export default async function StudentResourcesPage() {
  const viewer = await getViewer();
  const student = isLearner(viewer) && viewer.studentId ? studentById.get(viewer.studentId) : undefined;
  if (!student) return <Denied />;

  const groups = spacesForClass(student.classId).map((s) => ({ space: s, teacher: teacherById.get(s.teacherId)?.name ?? "", resources: s.resources.filter((r) => r.status === "approved") }));
  const all = groups.flatMap((g) => g.resources);

  return (
    <>
      <PageHeader eyebrow="Resources" title="Approved resources" description="Everything your teachers have approved, by subject. Genuine syllabus pages, past-paper indexes, open textbooks and class notes; the tutor may only cite what is marked." />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-6">
        <Stat label="Resources" value={all.length} trend={`across ${groups.length} subjects`} icon={<BookOpen size={18} />} tone="accent" />
        <Stat label="Tutor may cite" value={all.filter((r) => r.tutorMayCite).length} icon={<Sparkles size={18} />} tone="ok" />
        <Stat label="Class notes" value={all.filter((r) => r.kind === "notes" || r.kind === "worksheet").length} icon={<FileText size={18} />} tone="info" />
        <Stat label="External links" value={all.filter((r) => /^https?:/i.test(r.url)).length} icon={<Link2 size={18} />} tone="neutral" />
      </div>

      {groups.map((g) => (
        <section key={g.space.id}>
          <SectionTitle title={g.space.subject} hint={`${g.teacher} · ${g.space.subjectCode ?? ""}`} />
          {g.resources.length ? <ResourceList resources={g.resources} /> : <p className="card-quiet px-4 py-3 text-xs text-ink-3">Nothing approved yet.</p>}
        </section>
      ))}
    </>
  );
}
