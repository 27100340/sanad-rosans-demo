"use client";

import { useState } from "react";
import Link from "next/link";
import { Avatar, Chip, EmptyState, Progress, Trend, type Tone } from "@/components/ui/primitives";
import { BAND_LABEL, type RankBand, type RankRow } from "@/lib/domain/rank";
import { cn } from "@/lib/utils";

export interface RankView extends RankRow {
  name: string;
  trend: number;
  index: number | null;
}

export interface ClassRanking {
  id: string;
  name: string;
  hifz: boolean;
  rows: RankView[];
}

const BAND_TONE: Record<RankBand, Tone> = { distinction: "gold", merit: "ok", pass: "accent", support: "danger" };

/** Class picker plus the ranked table; the composite is explained in the caption. */
export function RankingsTable({ classes, basePath }: { classes: ClassRanking[]; basePath: string }) {
  const [classId, setClassId] = useState(classes[0]?.id ?? "");
  const cls = classes.find((c) => c.id === classId);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {classes.map((c) => (
          <button key={c.id} type="button" className={c.id === classId ? "btn-soft btn-sm" : "btn-outline btn-sm"} onClick={() => setClassId(c.id)}>
            {c.name} <span className="text-ink-3">· {c.rows.length}</span>
          </button>
        ))}
      </div>
      {cls && cls.rows.length ? (
        <div className="card overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th className="w-12">#</th>
                <th>Student</th>
                <th className="w-48">Composite</th>
                <th className="text-right">{cls.hifz ? "Manzil secure" : "Marks"}</th>
                <th className="text-right">Attendance</th>
                <th className="text-right">Effort</th>
                <th className="text-right">Index</th>
                <th className="text-right">Trend</th>
                <th>Band</th>
              </tr>
            </thead>
            <tbody>
              {cls.rows.map((r) => (
                <tr key={r.studentId}>
                  <td className={cn("num font-semibold", r.rank <= 3 ? "text-gold" : "text-ink-3")}>{r.rank}</td>
                  <td>
                    <Link href={`${basePath}/${r.studentId}`} className="inline-flex items-center gap-2.5 hover:text-accent">
                      <Avatar name={r.name} size="sm" tone={cls.hifz ? "gold" : "accent"} />
                      <span className="whitespace-nowrap font-medium">{r.name}</span>
                    </Link>
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <Progress value={r.composite} tone={BAND_TONE[r.band]} className="w-28" />
                      <span className="num w-8 text-right text-xs font-semibold text-ink">{r.composite}</span>
                    </div>
                  </td>
                  <td className="num text-right">{r.marks === null ? <span className="text-ink-3">—</span> : `${r.marks}%`}</td>
                  <td className="num text-right">{r.attendance}%</td>
                  <td className="num text-right">{r.effort === null ? <span className="text-ink-3">—</span> : `${r.effort}%`}</td>
                  <td className="num text-right">{r.index === null ? <span className="text-ink-3">—</span> : Math.round(r.index)}</td>
                  <td className="text-right">
                    <Trend value={r.trend} suffix={cls.hifz ? "pp" : ""} />
                  </td>
                  <td>
                    <Chip tone={BAND_TONE[r.band]}>{BAND_LABEL[r.band]}</Chip>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState title="No students in this class yet" />
      )}
    </div>
  );
}
