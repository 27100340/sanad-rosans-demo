import { getViewer } from "@/lib/auth/viewer";
import { viewerRestriction } from "@/lib/auth/access";
import {
  teachingClasses,
  createLessonDraft,
  LESSON_PLANS,
  OBSERVATIONS,
} from "@/lib/data/teaching";
import { studentById } from "@/lib/data/mock/people";
import { audit, notify } from "@/lib/data/mock/notify";
export async function POST(req: Request) {
  const p = await getViewer();
  if (
    !["chairman", "principal", "teacher"].includes(p.role) ||
    viewerRestriction(p)
  )
    return Response.json({ error: "Forbidden" }, { status: 403 });
  try {
    const b = await req.json();
    const c = teachingClasses(p).find((c) => c.id === b.classId);
    if (!c) throw new Error("Class not assigned to your seat.");
    if (b.action === "draft") {
      const plan = createLessonDraft(p, c.id);
      audit(p.personId, "teaching.draft", "lesson", plan.id);
      return Response.json({ ok: true, id: plan.id });
    }
    if (b.action === "publish") {
      const plan = LESSON_PLANS.find(
        (l) => l.id === b.id && l.classId === c.id && l.status === "draft",
      );
      if (!plan) throw new Error("No draft lesson found.");
      const fields = [
        "title",
        "subject",
        "objective",
        "activity",
        "assessment",
        "home",
      ] as const;
      const values = Object.fromEntries(
        fields.map((key) => [key, String(b[key] ?? plan[key]).trim()]),
      );
      if (
        Object.values(values).some(
          (value) => value.length < 3 || value.length > 3000,
        )
      )
        throw new Error("Complete every lesson field (3–3,000 characters).");
      Object.assign(plan, values, { status: "published" });
      audit(p.personId, "teaching.publish", "lesson", plan.id);
      notify(
        { classId: c.id, guardians: true },
        {
          kind: "assignment",
          title: `Learning activity: ${plan.title}`,
          body: plan.home,
          href: "/portal/learning",
          fromId: p.personId,
        },
      );
      return Response.json({ ok: true });
    }
    if (b.action === "observe") {
      const s = studentById.get(b.studentId);
      if (!s || s.classId !== c.id)
        throw new Error("Student is not in this class.");
      const note = String(b.note ?? "").trim();
      if (
        note.length < 10 ||
        note.length > 1500 ||
        !["emerging", "developing", "secure"].includes(b.attainment)
      )
        throw new Error(
          "Enter an observation (10–1,500 characters) and attainment.",
        );
      const id = crypto.randomUUID();
      OBSERVATIONS.unshift({
        id,
        classId: c.id,
        studentId: s.id,
        teacherId: p.personId,
        note,
        attainment: b.attainment,
        at: new Date().toISOString(),
      });
      audit(p.personId, "teaching.observe", "observation", id);
      return Response.json({ ok: true });
    }
    throw new Error("Unknown teaching action.");
  } catch (e) {
    return Response.json(
      { error: e instanceof Error ? e.message : "Invalid request" },
      { status: 400 },
    );
  }
}
