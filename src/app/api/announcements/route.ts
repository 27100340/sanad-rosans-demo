/**
 * Publish an announcement. The chairman may address every campus or one;
 * a principal or section coordinator only their own. Delivery is in-app to
 * students, guardians and teaching staff in scope, with a queued push per
 * person; audited.
 */
import { getViewer } from "@/lib/auth/viewer";
import { school, type BranchId } from "@/lib/config/school";
import { addAnnouncement } from "@/lib/data/mock/announcements";
import { audit, notify, queueMail } from "@/lib/data/mock/notify";
import { TEACHERS, STUDENTS } from "@/lib/data/mock/people";
import { todayISO } from "@/lib/utils";

export async function POST(req: Request) {
  const viewer = await getViewer();
  const branchOnly = viewer.role === "principal" || viewer.role === "coordinator";
  if (viewer.role !== "chairman" && viewer.role !== "superadmin" && !branchOnly) return Response.json({ error: "forbidden" }, { status: 403 });
  const body = (await req.json().catch(() => ({}))) as { title?: string; body?: string; scope?: string; audience?: { students?: boolean; guardians?: boolean; staff?: boolean }; email?: boolean };
  const title = (body.title ?? "").trim().slice(0, 140);
  const text = (body.body ?? "").trim().slice(0, 2000);
  if (title.length < 3 || text.length < 3) return Response.json({ error: "Add a title and a message." }, { status: 400 });
  const branchIds = school.branches.map((b) => b.id as string);
  const scope: "school" | BranchId = body.scope === "school" ? "school" : branchIds.includes(body.scope ?? "") ? (body.scope as BranchId) : (viewer.branchId ?? "school");
  if (branchOnly && scope !== viewer.branchId) return Response.json({ error: "You can only announce to your own campus." }, { status: 403 });

  const a = addAnnouncement({ scope, authorId: viewer.personId, date: todayISO(), title, body: text });
  const audience = { students: body.audience?.students !== false, guardians: body.audience?.guardians !== false, staff: body.audience?.staff !== false };
  const branches: BranchId[] = scope === "school" ? (school.branches.map((b) => b.id) as BranchId[]) : [scope];
  const ids = new Set<string>();
  for (const s of STUDENTS.filter((x) => branches.includes(x.branchId))) {
    if (audience.students) ids.add(s.id);
    if (audience.guardians) ids.add(s.guardianId);
  }
  if (audience.staff) for (const t of TEACHERS.filter((x) => x.branchId && branches.includes(x.branchId))) ids.add(t.id);
  ids.delete(viewer.personId);
  const href = "/portal/learn/inbox";
  notify({ personIds: [...ids] }, { kind: "announcement", title, body: text, href, fromId: viewer.personId });
  let emails = 0;
  if (body.email && audience.guardians) {
    for (const s of STUDENTS.filter((x) => branches.includes(x.branchId))) {
      queueMail(s.guardianId, "email", title, text);
      emails += 1;
    }
  }
  audit(viewer.personId, "announcement.publish", "announcement", a.id, { title, scope, notified: ids.size, emails });
  return Response.json({ announcement: a, notified: ids.size, emails });
}
