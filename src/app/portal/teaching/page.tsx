import { getViewer } from "@/lib/auth/viewer";
import {
  teachingClasses,
  LESSON_PLANS,
  OBSERVATIONS,
} from "@/lib/data/teaching";
import { STUDENTS } from "@/lib/data/mock/people";
import { PageHeader } from "@/components/ui/primitives";
import { PathwayWorkspace } from "@/components/teach/pathway-workspace";
import { SeatDenied } from "@/components/leadership/seat-guard";
export default async function TeachingPage() {
  const p = await getViewer();
  if (!["superadmin", "chairman", "principal", "coordinator", "teacher"].includes(p.role))
    return <SeatDenied home={p.home} />;
  const classes = teachingClasses(p);
  const ids = new Set(classes.map((c) => c.id));
  return (
    <>
      <PageHeader
        eyebrow="Academic pathway · Montessori to O Levels"
        title="Plan, teach, observe, support"
        description="Age-appropriate lesson planning and learning portfolios. Hifz remains a separate specialist pathway."
      />
      <PathwayWorkspace
        classes={classes}
        plans={LESSON_PLANS.filter((l) => ids.has(l.classId))}
        students={STUDENTS.filter((s) => ids.has(s.classId))}
        observations={OBSERVATIONS.filter((o) => ids.has(o.classId))}
        readOnly={p.role === "coordinator"}
      />
    </>
  );
}
