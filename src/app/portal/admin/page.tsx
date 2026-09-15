import Link from "next/link";
import { ArrowRight, Building2, LayoutGrid, ShieldCheck, Users } from "lucide-react";
import { ViewAsButton } from "@/components/admin/view-as-button";
import { SeatDenied } from "@/components/leadership/seat-guard";
import { Card, Chip, LinkButton, PageHeader, SectionTitle, Stat } from "@/components/ui/primitives";
import { directory } from "@/lib/auth/impersonate";
import { isSuperAdmin } from "@/lib/auth/personas";
import { EXTRA_VIEWS, SEATS } from "@/lib/auth/seat-map";
import { getSession } from "@/lib/auth/viewer";
import { school } from "@/lib/config/school";
import { personName } from "@/lib/data/mock/notify";

export default async function ControlCentrePage() {
  const { real } = await getSession();
  if (!isSuperAdmin(real)) return <SeatDenied home={real.home} />;

  const people = directory();
  const views = SEATS.reduce((a, s) => a + s.views.length, 0) + EXTRA_VIEWS.length;

  return (
    <>
      <PageHeader
        eyebrow="Super admin"
        title="Control centre"
        description={`Every screen of every seat across ${school.branches.length} campuses. School-level views open directly; a view that belongs to one person opens as that person, with a banner and a way back.`}
        actions={<LinkButton href="/portal/admin/people" variant="primary">People and view as</LinkButton>}
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-6">
        <Stat label="Seats" value={SEATS.length} trend="every role in the school" icon={<LayoutGrid size={18} />} tone="accent" />
        <Stat label="Screens" value={views} trend="reachable from here" icon={<ShieldCheck size={18} />} tone="info" />
        <Stat label="People" value={people.staff.length + people.students.length + people.guardians.length} trend="any of whom you can view as" icon={<Users size={18} />} tone="gold" />
        <Stat label="Campuses" value={school.branches.length} trend={school.branches.map((b) => b.name).join(", ")} icon={<Building2 size={18} />} tone="neutral" />
      </div>

      {SEATS.map((seat) => (
        <section key={seat.key}>
          <SectionTitle
            title={seat.name}
            hint={seat.blurb}
            action={<ViewAsButton personId={seat.sample} variant="outline">View as {personName(seat.sample)}</ViewAsButton>}
          />
          <Card className="p-0">
            <ul className="divide-y divide-line">
              {seat.views.map((v) => (
                <li key={`${seat.key}-${v.href}-${v.label}`} className="flex flex-col gap-2 p-3 sm:flex-row sm:items-center sm:gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-ink">{v.label}</p>
                    <p className="truncate font-mono text-2xs text-ink-3">{v.href}</p>
                    {v.note ? <p className="mt-0.5 text-xs text-ink-2">{v.note}</p> : null}
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {v.needs === "school" ? (
                      <>
                        <Chip tone="ok">Open as owner</Chip>
                        <Link href={v.href} className="btn-soft btn-sm">
                          Open <ArrowRight size={13} />
                        </Link>
                      </>
                    ) : (
                      <>
                        <Chip tone="neutral">Needs a person</Chip>
                        <ViewAsButton personId={seat.sample} href={v.href} title={`Opens ${v.href} as ${personName(seat.sample)}`}>
                          Open as {personName(seat.sample).split(/\s+/).slice(-1)[0]}
                        </ViewAsButton>
                      </>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        </section>
      ))}

      <section>
        <SectionTitle title="Other pathways" hint="Early years, primary and Hifz sit on different screens from the senior seats." />
        <Card className="p-0">
          <ul className="divide-y divide-line">
            {EXTRA_VIEWS.map((v) => (
              <li key={`${v.href}-${v.sample}`} className="flex flex-col gap-2 p-3 sm:flex-row sm:items-center sm:gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-ink">{v.label}</p>
                  <p className="text-xs text-ink-2">{v.note}</p>
                  <p className="truncate font-mono text-2xs text-ink-3">{v.href}</p>
                </div>
                <ViewAsButton personId={v.sample} href={v.href} className="shrink-0">
                  Open as {personName(v.sample)}
                </ViewAsButton>
              </li>
            ))}
          </ul>
        </Card>
      </section>
    </>
  );
}
