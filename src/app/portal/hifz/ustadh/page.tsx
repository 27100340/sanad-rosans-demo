import { CalendarClock, Home, ShieldCheck, Users } from "lucide-react";
import { getViewer } from "@/lib/auth/viewer";
import { HALAQA_2 } from "@/lib/data/mock/hifz";
import { classById, studentById, teacherById } from "@/lib/data/mock/people";
import { pct } from "@/lib/utils";
import { Card, PageHeader, SectionTitle, Stat } from "@/components/ui/primitives";
import { DeniedState, canSeeUstadh } from "@/components/hifz/access";
import { HalaqaTable } from "@/components/hifz/halaqa-table";
import { MorningQueue } from "@/components/hifz/morning-queue";
import { morningQueueItems } from "@/components/hifz/morning-mock";

const HALAQA_ID = "gulberg-hifz2";

export default async function UstadhBoardPage() {
  const viewer = await getViewer();
  if (!canSeeUstadh(viewer)) return <DeniedState />;

  const halaqa = classById.get(HALAQA_ID);
  const ustadh = halaqa ? teacherById.get(halaqa.classTeacherId) : undefined;
  const rows = HALAQA_2.map((r) => ({ ...r, name: studentById.get(r.studentId)?.name ?? r.studentId }));
  const avgSecure = Math.round(rows.reduce((a, r) => a + r.securePct, 0) / Math.max(1, rows.length));
  const overdue = rows.reduce((a, r) => a + r.overdueManzil, 0);
  const home = rows.reduce((a, r) => a + r.homeRecitationsThisWeek, 0);
  const queue = morningQueueItems();

  return (
    <>
      <PageHeader eyebrow={ustadh?.name ?? "Ustadh"} title={halaqa?.name ?? "Halaqa board"} description="Every student's memorisation state, and the home recitations checked overnight." />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Students" value={rows.length} tone="accent" icon={<Users size={18} />} />
        <Stat label="Avg secure" value={pct(avgSecure)} tone="ok" icon={<ShieldCheck size={18} />} trend="across the halaqa" />
        <Stat label="Overdue manzil" value={overdue} tone={overdue ? "warn" : "neutral"} icon={<CalendarClock size={18} />} trend="units past due" />
        <Stat label="Home recitations" value={home} tone="gold" icon={<Home size={18} />} trend="this week" />
      </div>

      <section>
        <SectionTitle title="Morning queue" hint="Checked overnight from the home recitation log; confirm or re-hear in class" />
        <Card className="py-2">
          <MorningQueue items={queue} />
        </Card>
      </section>

      <section>
        <SectionTitle title="Halaqa" hint="Sorted by overdue manzil, worst first" />
        <Card className="p-0 sm:p-2">
          <HalaqaTable rows={rows} />
        </Card>
      </section>
    </>
  );
}
