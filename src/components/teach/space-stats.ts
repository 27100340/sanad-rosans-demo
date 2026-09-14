import type { SubjectSpace } from "@/lib/domain/types";
import { classById } from "@/lib/data/mock/people";
import { assignmentsForSpace } from "@/lib/data/mock/spaces";

export interface SpaceStats {
  students: number;
  markingBacklog: number;
  classAvg: number;
  approvedResources: number;
}

export function spaceStats(space: SubjectSpace): SpaceStats {
  const students = classById.get(space.classId)?.studentIds.length ?? 0;
  const markingBacklog = assignmentsForSpace(space.id)
    .flatMap((a) => a.submissions)
    .filter((s) => s.status === "pending").length;
  const avgs = space.masteryByTopic.map((m) => m.classAvg);
  const classAvg = avgs.length ? Math.round(avgs.reduce((a, b) => a + b, 0) / avgs.length) : 0;
  const approvedResources = space.resources.filter((r) => r.status === "approved").length;
  return { students, markingBacklog, classAvg, approvedResources };
}
