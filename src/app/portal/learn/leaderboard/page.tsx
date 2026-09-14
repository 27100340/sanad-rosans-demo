import Link from "next/link";
import { Crown, Medal, Sparkles, Trophy, Users, VenetianMask } from "lucide-react";
import { Denied, isLearner } from "@/components/teach/guard";
import { Card, Chip, EmptyState, PageHeader, SectionTitle } from "@/components/ui/primitives";
import { getViewer } from "@/lib/auth/viewer";
import { buildKpi, type KpiStudent } from "@/lib/data/kpi";
import { contributionBoards, POINTS_GUIDE } from "@/lib/data/mock/contribution";
import { classById, studentById, studentsInClass } from "@/lib/data/mock/people";
import { preferencesFor } from "@/lib/data/mock/preferences";
import { anonCode, denseRanks } from "@/lib/domain/kpi";
import { cn } from "@/lib/utils";

const BOARD_LIMIT = 15;

interface BoardRow {
  id: string;
  label: string;
  isMe: boolean;
  anon: boolean;
  score: number;
  rank: number;
}

function displayName(studentId: string, viewerId: string): { label: string; anon: boolean } {
  if (studentId === viewerId) return { label: `${studentById.get(studentId)?.firstName ?? "You"} (you)`, anon: false };
  if (preferencesFor(studentId).showNameOnBoards) return { label: studentById.get(studentId)?.name ?? studentId, anon: false };
  return { label: anonCode(studentId), anon: true };
}

function medal(rank: number): { text: string; tone: string } {
  if (rank === 1) return { text: "1", tone: "bg-gold text-white" };
  if (rank === 2) return { text: "2", tone: "bg-surface-3 text-ink" };
  if (rank === 3) return { text: "3", tone: "bg-warn-soft text-warn" };
  return { text: String(rank), tone: "bg-surface-2 text-ink-3" };
}

function Board({ title, hint, rows, unit }: { title: string; hint: string; rows: BoardRow[]; unit: string }) {
  const max = Math.max(1, ...rows.map((r) => r.score));
  return (
    <section>
      <SectionTitle title={title} hint={hint} />
      {rows.length ? (
        <div className="card divide-y divide-line">
          {rows.map((r) => {
            const m = medal(r.rank);
            return (
              <div key={r.id} className={cn("flex items-center gap-3 px-4 py-2.5", r.isMe && "bg-accent-soft/40")}>
                <span className={cn("num grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-semibold", m.tone)}>{m.text}</span>
                <span className={cn("flex min-w-0 flex-1 items-center gap-1.5 text-sm", r.isMe ? "font-semibold text-accent-deep" : "text-ink")}>
                  {r.anon ? <VenetianMask size={13} className="shrink-0 text-ink-3" aria-label="Private code" /> : null}
                  <span className={cn("truncate", r.anon && "font-mono text-xs")}>{r.label}</span>
                </span>
                <div className="hidden h-1.5 w-24 overflow-hidden rounded-full bg-surface-3 sm:block">
                  <div className="h-full rounded-full bg-accent/70" style={{ width: `${Math.round((r.score / max) * 100)}%` }} />
                </div>
                <span className="num w-14 shrink-0 text-right text-xs font-semibold text-ink">
                  {r.score} <span className="font-normal text-ink-3">{unit}</span>
                </span>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="card-quiet px-4 py-3 text-xs text-ink-3">Nobody on this board yet.</p>
      )}
    </section>
  );
}

export default async function LeaderboardPage() {
  const viewer = await getViewer();
  const student = isLearner(viewer) && viewer.studentId ? studentById.get(viewer.studentId) : undefined;
  if (!student) return <Denied />;

  const className = classById.get(student.classId)?.name ?? "";
  const classmates = studentsInClass(student.classId);
  const table = buildKpi(student.branchId);
  const me = table.students.find((s) => s.studentId === student.id);
  const inClass = table.students.filter((s) => s.classId === student.classId);

  const effortSorted = [...inClass].sort((a, b) => b.effort - a.effort || a.name.localeCompare(b.name));
  const effortRanks = denseRanks(effortSorted, (s) => s.effort);
  const effortRows: BoardRow[] = effortSorted.slice(0, BOARD_LIMIT).map((s: KpiStudent, i) => ({ id: s.studentId, ...displayName(s.studentId, student.id), isMe: s.studentId === student.id, score: Math.round(s.effort), rank: effortRanks[i] }));
  const myEffortRank = effortRanks[effortSorted.findIndex((s) => s.studentId === student.id)] ?? 0;

  const boards = contributionBoards(classmates.map((s) => s.id), BOARD_LIMIT);
  const toRows = (rows: { personId: string; total?: number; monthPoints?: number }[], key: "total" | "monthPoints"): BoardRow[] => {
    const ranks = denseRanks(rows, (r) => r[key] ?? 0);
    return rows.map((r, i) => ({ id: r.personId, ...displayName(r.personId, student.id), isMe: r.personId === student.id, score: r[key] ?? 0, rank: ranks[i] }));
  };
  const showingName = preferencesFor(student.id).showNameOnBoards;

  return (
    <>
      <PageHeader
        eyebrow="Leaderboard"
        title={
          <span className="flex items-center gap-2.5">
            <Trophy size={22} className="text-gold" /> {className}
          </span>
        }
        description="Effort, not marks: the board ranks practice, work completed, challenges, attendance and contribution. Everyone competes under a private code unless they choose to show their name."
      />

      {me ? (
        <Card className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="tile-gold">
              <Crown size={18} />
            </span>
            <div>
              <p className="text-2xs font-semibold uppercase tracking-[0.08em] text-ink-3">Your standing</p>
              <p className="num text-lg font-semibold text-ink">
                #{myEffortRank} <span className="text-sm font-normal text-ink-3">of {effortSorted.length} on effort</span> · #{me.rankClass} <span className="text-sm font-normal text-ink-3">of {me.outOfClass} on the full index</span>
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Chip tone={showingName ? "accent" : "neutral"}>{showingName ? "Showing your name" : `Your code: ${anonCode(student.id)}`}</Chip>
            <Link href="/portal/settings" className="btn-ghost btn-sm">Change in Settings</Link>
          </div>
        </Card>
      ) : null}

      <Board title="Effort board" hint="Practice, work, challenges, attendance and contribution; Mastery is left out on purpose so nobody is shamed for marks." rows={effortRows} unit="" />

      <div className="grid gap-6 lg:grid-cols-2">
        <Board title="Contribution this month" hint={`Points earned in ${boards.month} from the class library.`} rows={toRows(boards.monthly, "monthPoints")} unit="pts" />
        <Board title="Contribution all time" hint="Since the library opened." rows={toRows(boards.allTime, "total")} unit="pts" />
      </div>

      <section>
        <SectionTitle title="How to earn contribution points" hint="The top five each month are recognised in assembly." />
        <div className="card divide-y divide-line">
          {POINTS_GUIDE.map((g) => (
            <div key={g.kind} className="flex items-center gap-3 px-4 py-2.5 text-sm">
              <span className="tile-neutral h-8 w-8 rounded-lg">{g.kind === "helpful" ? <Sparkles size={14} /> : g.kind === "resource" ? <Medal size={14} /> : <Users size={14} />}</span>
              <span className="min-w-0 flex-1 text-ink">{g.label}</span>
              <span className="num text-xs font-semibold text-accent">+{g.pts}</span>
            </div>
          ))}
        </div>
        {!effortRows.length ? <EmptyState title="No classmates ranked yet" /> : null}
      </section>
    </>
  );
}
