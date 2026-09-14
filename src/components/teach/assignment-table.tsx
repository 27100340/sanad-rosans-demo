import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Chip } from "@/components/ui/primitives";
import type { Assignment } from "@/lib/domain/types";
import { fmtDay } from "./helpers";

function countBy(a: Assignment) {
  return {
    pending: a.submissions.filter((s) => s.status === "pending").length,
    aiMarked: a.submissions.filter((s) => s.status === "ai-marked").length,
    approved: a.submissions.filter((s) => s.status === "teacher-approved").length,
  };
}

export function AssignmentTable({ spaceId, assignments }: { spaceId: string; assignments: Assignment[] }) {
  return (
    <div className="card divide-y divide-line">
      {assignments.map((a) => {
        const c = countBy(a);
        return (
          <Link key={a.id} href={`/portal/teach/${spaceId}/assignments/${a.id}`} className="flex items-center gap-4 p-4 transition-colors hover:bg-surface-2">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-ink">{a.title}</p>
              <p className="mt-0.5 text-xs text-ink-3">
                <span className="num">{a.topicCode}</span> · Due {fmtDay(a.dueDate)} · <span className="num">{a.maxMarks}</span> marks
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                <Chip tone="neutral">
                  <span className="num">{a.submissions.length}</span> submitted
                </Chip>
                {c.pending ? (
                  <Chip tone="warn">
                    <span className="num">{c.pending}</span> pending
                  </Chip>
                ) : null}
                {c.aiMarked ? (
                  <Chip tone="info">
                    <span className="num">{c.aiMarked}</span> AI marked
                  </Chip>
                ) : null}
                {c.approved ? (
                  <Chip tone="ok">
                    <span className="num">{c.approved}</span> approved
                  </Chip>
                ) : null}
              </div>
            </div>
            <ChevronRight size={16} className="shrink-0 text-ink-3" />
          </Link>
        );
      })}
    </div>
  );
}
