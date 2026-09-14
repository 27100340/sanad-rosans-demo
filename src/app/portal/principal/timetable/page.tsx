import { shortName } from "@/components/leadership/format";
import { canSeeBranchStaff, SeatDenied } from "@/components/leadership/seat-guard";
import { TimetableGrid, type ClassOption, type TimetableCell } from "@/components/principal/timetable-grid";
import { PageHeader } from "@/components/ui/primitives";
import { getViewer } from "@/lib/auth/viewer";
import { branchName, type BranchId } from "@/lib/config/school";
import { TIMETABLE_G8B } from "@/lib/data/mock/comms";
import { CLASSES, teacherById } from "@/lib/data/mock/people";

const DEMO_BRANCH: BranchId = "gulberg";
const AVAILABLE_CLASS = "gulberg-g8b";

export default async function TimetablePage() {
  const viewer = await getViewer();
  if (!canSeeBranchStaff(viewer)) return <SeatDenied home={viewer.home} />;
  const branchId = viewer.branchId ?? DEMO_BRANCH;
  const classes: ClassOption[] = CLASSES.filter((c) => c.branchId === branchId).map((c) => ({ id: c.id, name: c.name, available: c.id === AVAILABLE_CLASS }));
  const cells: TimetableCell[] = TIMETABLE_G8B.map((e) => ({
    day: e.day,
    period: e.period,
    subject: e.subject,
    teacherName: shortName(teacherById.get(e.teacherId)?.name ?? e.teacherId),
    room: e.room,
  }));
  return (
    <div className="space-y-8 sm:space-y-10">
      <PageHeader eyebrow={`Principal · ${branchName(branchId)}`} title="Timetable" description="Weekly grid by class. Substitutions for today appear on the branch overview." />
      <TimetableGrid classes={classes} cells={cells} />
    </div>
  );
}
