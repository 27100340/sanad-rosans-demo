"use client";

import { useState } from "react";
import { Card, EmptyState } from "@/components/ui/primitives";
import { TIMETABLE_DAYS, TIMETABLE_PERIODS } from "@/lib/data/mock/leadership-extra";
import type { TimetableEntry } from "@/lib/domain/types";

export interface TimetableCell {
  day: TimetableEntry["day"];
  period: number;
  subject: string;
  teacherName: string;
  room: string;
}

export interface ClassOption {
  id: string;
  name: string;
  available: boolean;
}

const LAB_ROOMS = ["Lab 1", "Field", "Library"];

/** Mon to Fri grid with periods as rows. Only the class marked available has entries in the demo. */
export function TimetableGrid({ classes, cells }: { classes: ClassOption[]; cells: TimetableCell[] }) {
  const first = classes.find((c) => c.available) ?? classes[0];
  const [classId, setClassId] = useState(first?.id ?? "");
  const selected = classes.find((c) => c.id === classId);
  const lookup = new Map(cells.map((c) => [`${c.day}-${c.period}`, c]));

  return (
    <div className="space-y-4">
      <div className="max-w-xs">
        <label className="label" htmlFor="tt-class">Class</label>
        <select id="tt-class" className="input" value={classId} onChange={(e) => setClassId(e.target.value)}>
          {classes.map((c) => (
            <option key={c.id} value={c.id} disabled={!c.available}>
              {c.name}
              {c.available ? "" : " · full build"}
            </option>
          ))}
        </select>
      </div>
      {selected?.available ? (
        <Card className="p-0">
          <div className="overflow-x-auto">
            <table className="table min-w-[44rem]">
              <thead>
                <tr>
                  <th className="w-16">Period</th>
                  {TIMETABLE_DAYS.map((d) => (
                    <th key={d}>{d}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {TIMETABLE_PERIODS.map((p) => (
                  <tr key={p}>
                    <td className="num font-medium text-ink-3">{p}</td>
                    {TIMETABLE_DAYS.map((d) => {
                      const cell = lookup.get(`${d}-${p}`);
                      if (!cell) return <td key={d} className="text-xs text-ink-3">Free</td>;
                      const special = LAB_ROOMS.includes(cell.room);
                      return (
                        <td key={d}>
                          <p className="text-sm font-medium text-ink">{cell.subject}</p>
                          <p className="text-xs text-ink-3">
                            {cell.teacherName} · <span className={special ? "text-accent" : undefined}>{cell.room}</span>
                          </p>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        <EmptyState title="Timetable available in the full build" body="The demo carries the Grade 8-B timetable. Every class follows the same grid once the school's timetable is imported." />
      )}
    </div>
  );
}
