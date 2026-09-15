"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { ViewAsButton } from "./view-as-button";
import { Avatar, Chip, EmptyState, type Tone } from "@/components/ui/primitives";

export interface PersonRow {
  id: string;
  name: string;
  role: string;
  detail: string;
  branch: string;
  group: "staff" | "students" | "guardians";
}

const GROUP_LABEL: Record<PersonRow["group"], string> = { staff: "Staff", students: "Students", guardians: "Parents" };
const ROLE_TONE: Record<string, Tone> = { chairman: "gold", principal: "accent", coordinator: "info", finance: "info", teacher: "accent", ustadh: "gold", student: "neutral", parent: "neutral" };

/** Everyone in the school; one click opens the portal as them. */
export function PeopleDirectory({ rows }: { rows: PersonRow[] }) {
  const [q, setQ] = useState("");
  const [group, setGroup] = useState<PersonRow["group"] | "">("");
  const [branch, setBranch] = useState("");

  const branches = useMemo(() => [...new Set(rows.map((r) => r.branch).filter(Boolean))].sort(), [rows]);
  const needle = q.trim().toLowerCase();
  const shown = rows.filter((r) => (!group || r.group === group) && (!branch || r.branch === branch) && (!needle || `${r.name} ${r.detail} ${r.role}`.toLowerCase().includes(needle)));

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto]">
        <div className="flex items-center gap-2 rounded-xl border border-line bg-surface px-3">
          <Search size={14} className="text-ink-3" />
          <input className="w-full bg-transparent py-2.5 text-sm text-ink placeholder:text-ink-3 focus:outline-none" placeholder="Search by name, class or subject" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search people" />
        </div>
        <select className="input" value={group} onChange={(e) => setGroup(e.target.value as PersonRow["group"] | "")} aria-label="Group">
          <option value="">Everyone</option>
          <option value="staff">Staff</option>
          <option value="students">Students</option>
          <option value="guardians">Parents</option>
        </select>
        <select className="input" value={branch} onChange={(e) => setBranch(e.target.value)} aria-label="Campus">
          <option value="">All campuses</option>
          {branches.map((b) => (
            <option key={b} value={b}>{b}</option>
          ))}
        </select>
      </div>

      {shown.length ? (
        <div className="card divide-y divide-line">
          {shown.map((r) => (
            <div key={r.id} className="flex items-center gap-3 p-3">
              <Avatar name={r.name} size="sm" tone={ROLE_TONE[r.role] ?? "accent"} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-ink">{r.name}</p>
                <p className="truncate text-xs text-ink-3">
                  {r.detail}
                  {r.branch ? ` · ${r.branch}` : ""}
                </p>
              </div>
              <Chip tone={ROLE_TONE[r.role] ?? "neutral"} className="hidden shrink-0 capitalize sm:inline-flex">{r.role}</Chip>
              <span className="hidden shrink-0 text-2xs text-ink-3 lg:block">{GROUP_LABEL[r.group]}</span>
              <ViewAsButton personId={r.id} className="shrink-0">View as</ViewAsButton>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState title="Nobody matches" body="Widen the search or the filters." />
      )}
      <p className="text-xs text-ink-3">{shown.length} of {rows.length} people.</p>
    </div>
  );
}
