import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { HalaqaRow } from "@/lib/data/mock/hifz";
import { Avatar, Chip, Progress } from "@/components/ui/primitives";
import { riskLabel, riskTone, scoreTone } from "./derive";

export interface HalaqaTableRow extends HalaqaRow {
  name: string;
}

function StudentLink({ row }: { row: HalaqaTableRow }) {
  return (
    <Link href={`/portal/hifz/ustadh/${row.studentId}`} className="flex items-center gap-3 hover:text-accent">
      <Avatar name={row.name} size="sm" tone={riskTone(row.securePct, row.overdueManzil)} />
      <span>
        <span className="block font-medium">{row.name}</span>
        <span className="block text-2xs text-ink-3">{row.currentSurah}</span>
      </span>
    </Link>
  );
}

/** Halaqa board rows, sorted by overdue manzil (worst first). Stacks below sm. */
export function HalaqaTable({ rows }: { rows: HalaqaTableRow[] }) {
  const sorted = [...rows].sort((a, b) => b.overdueManzil - a.overdueManzil || a.securePct - b.securePct);
  return (
    <>
      <div className="hidden overflow-x-auto sm:block">
        <table className="table">
          <thead>
            <tr>
              <th>Student</th>
              <th>Risk</th>
              <th className="text-right">Juz</th>
              <th>Secure</th>
              <th className="text-right">Weak</th>
              <th className="text-right">Overdue manzil</th>
              <th className="text-right">Last sabaq</th>
              <th className="text-right">Home / wk</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {sorted.map((r) => (
              <tr key={r.studentId}>
                <td>
                  <StudentLink row={r} />
                </td>
                <td>
                  <Chip tone={riskTone(r.securePct, r.overdueManzil)}>{riskLabel(r.securePct, r.overdueManzil)}</Chip>
                </td>
                <td className="num text-right">{r.juzCompleted}</td>
                <td className="min-w-32">
                  <div className="flex items-center gap-2">
                    <Progress value={r.securePct} tone={riskTone(r.securePct, r.overdueManzil)} className="w-20" />
                    <span className="num text-xs">{r.securePct}%</span>
                  </div>
                </td>
                <td className="num text-right">{r.weakUnits}</td>
                <td className="num text-right">{r.overdueManzil}</td>
                <td className="text-right">
                  <Chip tone={scoreTone(r.lastSabaqScore)}>{r.lastSabaqScore}%</Chip>
                </td>
                <td className="num text-right">{r.homeRecitationsThisWeek}</td>
                <td className="text-right">
                  <Link href={`/portal/hifz/ustadh/${r.studentId}`} className="text-ink-3 hover:text-accent" aria-label={`Open ${r.name}`}>
                    <ChevronRight size={16} />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ul className="space-y-2 sm:hidden">
        {sorted.map((r) => (
          <li key={r.studentId} className="card p-4">
            <div className="flex items-center justify-between gap-2">
              <StudentLink row={r} />
              <Chip tone={riskTone(r.securePct, r.overdueManzil)}>{riskLabel(r.securePct, r.overdueManzil)}</Chip>
            </div>
            <Progress value={r.securePct} tone={riskTone(r.securePct, r.overdueManzil)} className="mt-3" />
            <p className="num mt-2 text-xs text-ink-3">
              {r.securePct}% secure · {r.weakUnits} weak · {r.overdueManzil} overdue manzil · home {r.homeRecitationsThisWeek}/wk
            </p>
          </li>
        ))}
      </ul>
    </>
  );
}
