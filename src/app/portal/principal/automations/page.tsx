import { Bot, History, Mail, PlayCircle } from "lucide-react";
import { relativeStamp } from "@/components/leadership/format";
import { canSeePrincipal, SeatDenied } from "@/components/leadership/seat-guard";
import { AutomationsConsole, type JobRow } from "@/components/principal/automations-console";
import { PageHeader, SectionTitle, Stat } from "@/components/ui/primitives";
import { getViewer } from "@/lib/auth/viewer";
import { branchName, type BranchId } from "@/lib/config/school";
import { JOBS, lastRun, RUNS } from "@/lib/data/mock/automations";
import { MAIL_QUEUE, personName } from "@/lib/data/mock/notify";
import { todayISO } from "@/lib/utils";

const DEMO_BRANCH: BranchId = "gulberg";
const HISTORY = 12;

export default async function AutomationsPage() {
  const viewer = await getViewer();
  if (!canSeePrincipal(viewer)) return <SeatDenied home={viewer.home} />;
  const branchId = viewer.branchId ?? DEMO_BRANCH;
  const jobs: JobRow[] = JOBS.map((j) => {
    const r = lastRun(j.id);
    return { ...j, lastRun: r ? { when: relativeStamp(r.at), summary: r.summary, by: r.by === "schedule" ? "the schedule" : personName(r.by) } : null };
  });
  const today = todayISO();
  const runsToday = RUNS.filter((r) => r.at.startsWith(today)).length;

  return (
    <div className="space-y-8 sm:space-y-10">
      <PageHeader eyebrow={`Principal · ${branchName(branchId)}`} title="Automations" description="The jobs that run on a schedule without anyone pressing a button. Run any of them now to see what it produces; every run is logged and audited." />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-6">
        <Stat label="Jobs" value={JOBS.length} trend="on the schedule" icon={<Bot size={18} />} tone="accent" />
        <Stat label="Runs today" value={runsToday} icon={<PlayCircle size={18} />} tone="info" />
        <Stat label="Runs recorded" value={RUNS.length} icon={<History size={18} />} tone="neutral" />
        <Stat label="Queued to send" value={MAIL_QUEUE.length} trend="email and push" icon={<Mail size={18} />} tone={MAIL_QUEUE.length ? "warn" : "ok"} />
      </div>

      <AutomationsConsole jobs={jobs} />

      <section>
        <SectionTitle title="Run history" hint={`Last ${HISTORY} runs.`} />
        <div className="card divide-y divide-line">
          {RUNS.slice(0, HISTORY).map((r) => (
            <div key={r.id} className="flex items-center gap-3 px-4 py-2.5 text-sm">
              <span className="num w-32 shrink-0 text-xs text-ink-3">{relativeStamp(r.at)}</span>
              <span className="w-44 shrink-0 truncate font-medium text-ink">{JOBS.find((j) => j.id === r.jobId)?.name ?? r.jobId}</span>
              <span className="min-w-0 flex-1 truncate text-xs text-ink-2">{r.summary}</span>
              <span className="shrink-0 text-2xs text-ink-3">{r.by === "schedule" ? "schedule" : personName(r.by)}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
