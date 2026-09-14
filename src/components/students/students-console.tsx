"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { Avatar, Chip, EmptyState, type Tone } from "@/components/ui/primitives";
import { attendanceClass } from "@/components/attend/roster-table";
import type { RiskLevel } from "@/lib/domain/types";
import { cn } from "@/lib/utils";

export interface ConsoleRow {
  id: string;
  name: string;
  classId: string;
  className: string;
  attendance: number;
  avgMark: number | null;
  trend: number;
  index: number | null;
  rankClass: number | null;
  openTasks: number;
  overdue: number;
  risk: RiskLevel | null;
  restricted: boolean;
  hifz: boolean;
}

const LEVEL_TONE: Record<RiskLevel, Tone> = { high: "danger", medium: "warn", watch: "neutral" };
const LEVEL_LABEL: Record<RiskLevel, string> = { high: "High", medium: "Medium", watch: "Watch" };

type Sort = "name" | "attendance" | "avg" | "index" | "risk";
const RISK_ORDER: Record<RiskLevel, number> = { high: 0, medium: 1, watch: 2 };

/** Searchable, filterable list of students with the figures that matter; every row opens the 360 view. */
export function StudentsConsole({ rows, basePath, classes }: { rows: ConsoleRow[]; basePath: string; classes: { id: string; name: string }[] }) {
  const [q, setQ] = useState("");
  const [classId, setClassId] = useState("");
  const [flag, setFlag] = useState<"" | "risk" | "overdue" | "restricted">("");
  const [sort, setSort] = useState<Sort>("risk");

  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const list = rows.filter((r) => (!classId || r.classId === classId) && (!needle || r.name.toLowerCase().includes(needle)) && (!flag || (flag === "risk" ? r.risk !== null : flag === "overdue" ? r.overdue > 0 : r.restricted)));
    const cmp: Record<Sort, (a: ConsoleRow, b: ConsoleRow) => number> = {
      name: (a, b) => a.name.localeCompare(b.name),
      attendance: (a, b) => a.attendance - b.attendance,
      avg: (a, b) => (a.avgMark ?? -1) - (b.avgMark ?? -1),
      index: (a, b) => (b.index ?? -1) - (a.index ?? -1),
      risk: (a, b) => (a.risk ? RISK_ORDER[a.risk] : 3) - (b.risk ? RISK_ORDER[b.risk] : 3) || a.attendance - b.attendance,
    };
    return [...list].sort(cmp[sort]);
  }, [rows, q, classId, flag, sort]);

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto_auto]">
        <div className="flex items-center gap-2 rounded-xl border border-line bg-surface px-3">
          <Search size={14} className="text-ink-3" />
          <input className="w-full bg-transparent py-2.5 text-sm text-ink placeholder:text-ink-3 focus:outline-none" placeholder="Search by name" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search students" />
        </div>
        <select className="input" value={classId} onChange={(e) => setClassId(e.target.value)} aria-label="Class">
          <option value="">All classes</option>
          {classes.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <select className="input" value={flag} onChange={(e) => setFlag(e.target.value as typeof flag)} aria-label="Filter">
          <option value="">Everyone</option>
          <option value="risk">At risk</option>
          <option value="overdue">Overdue tasks</option>
          <option value="restricted">Restricted access</option>
        </select>
        <select className="input" value={sort} onChange={(e) => setSort(e.target.value as Sort)} aria-label="Sort">
          <option value="risk">Risk first</option>
          <option value="name">Name</option>
          <option value="attendance">Attendance (low first)</option>
          <option value="avg">Average (low first)</option>
          <option value="index">Performance Index (high first)</option>
        </select>
      </div>

      {shown.length ? (
        <div className="card overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Class</th>
                <th className="text-right">Attendance</th>
                <th className="text-right">Average</th>
                <th className="text-right">Index</th>
                <th className="text-right">Tasks open</th>
                <th>Flags</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {shown.map((r) => (
                <tr key={r.id}>
                  <td>
                    <Link href={`${basePath}/${r.id}`} className="inline-flex items-center gap-2.5 hover:text-accent">
                      <Avatar name={r.name} size="sm" tone={r.risk ? LEVEL_TONE[r.risk] : r.hifz ? "gold" : "accent"} />
                      <span className="whitespace-nowrap font-medium">{r.name}</span>
                    </Link>
                  </td>
                  <td className="whitespace-nowrap text-ink-2">{r.className}</td>
                  <td className={cn("num text-right font-semibold", attendanceClass(r.attendance))}>{r.attendance}%</td>
                  <td className="num text-right">{r.avgMark === null ? <span className="text-ink-3">—</span> : `${r.avgMark}%`}</td>
                  <td className="num text-right">{r.index === null ? <span className="text-ink-3">—</span> : <span>{Math.round(r.index)}{r.rankClass ? <span className="text-ink-3"> · #{r.rankClass}</span> : null}</span>}</td>
                  <td className={cn("num text-right", r.overdue && "text-danger")}>{r.openTasks}{r.overdue ? ` (${r.overdue} overdue)` : ""}</td>
                  <td>
                    <span className="flex flex-wrap gap-1">
                      {r.risk ? <Chip tone={LEVEL_TONE[r.risk]}>{LEVEL_LABEL[r.risk]}</Chip> : null}
                      {r.restricted ? <Chip tone="danger">Restricted</Chip> : null}
                      {!r.risk && !r.restricted ? <span className="text-xs text-ink-3">—</span> : null}
                    </span>
                  </td>
                  <td className="text-right">
                    <Link href={`${basePath}/${r.id}`} className="btn-ghost btn-sm">Open</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState title="No students match" body="Widen the filters." />
      )}
      <p className="text-xs text-ink-3">{shown.length} of {rows.length} students.</p>
    </div>
  );
}
