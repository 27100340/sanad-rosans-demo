import { Activity, Lock, ShieldCheck, Unlock } from "lucide-react";
import { ProctorConsole } from "@/components/assess/proctor-console";
import { Denied } from "@/components/teach/guard";
import { PageHeader, SectionTitle, Stat } from "@/components/ui/primitives";
import { getViewer } from "@/lib/auth/viewer";
import { proctorRowsForTeacher } from "@/lib/data/proctor-list";

export default async function ProctoringPage() {
  const viewer = await getViewer();
  if (viewer.role !== "teacher") return <Denied />;

  const sessions = proctorRowsForTeacher(viewer.personId);
  const active = sessions.filter((s) => s.status === "active").length;
  const locked = sessions.filter((s) => s.status === "locked").length;
  const requests = sessions.filter((s) => s.status === "locked" && s.unlockRequest).length;

  return (
    <>
      <PageHeader
        eyebrow="Teacher"
        title="Proctoring"
        description="Every monitored sitting in your spaces, with the forensic events the exam guard recorded. A locked test stays frozen until you grant a fresh sit."
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-6">
        <Stat label="Sitting now" value={active} icon={<Activity size={18} />} tone={active ? "info" : "neutral"} />
        <Stat label="Locked" value={locked} icon={<Lock size={18} />} tone={locked ? "danger" : "ok"} />
        <Stat label="Unlock requests" value={requests} icon={<Unlock size={18} />} tone={requests ? "warn" : "neutral"} />
        <Stat label="Sessions" value={sessions.length} trend="this term" icon={<ShieldCheck size={18} />} tone="accent" />
      </div>

      <section>
        <SectionTitle title="Sessions" hint="Newest first. Stills are visible only to you and are never shown to the student." />
        <ProctorConsole sessions={sessions} />
      </section>
    </>
  );
}
