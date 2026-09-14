"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, UserRoundCog } from "lucide-react";
import { Chip, SectionTitle } from "@/components/ui/primitives";
import type { SectionName } from "@/lib/domain/types";

export interface SubjectRow { id: string; name: string; code?: string; board: string; sections: SectionName[]; strands: number; custom?: boolean }
export interface ClassRow { id: string; name: string; section: SectionName }
export interface TeacherRow { id: string; name: string; subjects: string[] }
export interface SpaceRow { id: string; subject: string; className: string; teacherId: string; teacherName: string; students: number }

const SECTIONS: SectionName[] = ["Montessori", "Junior", "Senior"];

async function post(url: string, method: "POST" | "PATCH", body: unknown): Promise<string | null> {
  const res = await fetch(url, { method, headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
  const json = (await res.json().catch(() => ({}))) as { error?: string };
  return res.ok ? null : json.error ?? "Something went wrong.";
}

export function SubjectsAdmin({ subjects, classes, teachers, spaces }: { subjects: SubjectRow[]; classes: ClassRow[]; teachers: TeacherRow[]; spaces: SpaceRow[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [notice, setNotice] = useState<{ tone: "ok" | "danger"; text: string } | null>(null);

  const [subjectId, setSubjectId] = useState(subjects[0]?.id ?? "");
  const [classId, setClassId] = useState(classes[0]?.id ?? "");
  const [teacherId, setTeacherId] = useState(teachers[0]?.id ?? "");

  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [board, setBoard] = useState("School curriculum");
  const [sections, setSections] = useState<SectionName[]>(["Junior", "Senior"]);
  const [strands, setStrands] = useState("");

  const chosenClass = classes.find((c) => c.id === classId);
  const offered = subjects.filter((s) => !chosenClass || s.sections.includes(chosenClass.section));

  function run(fn: () => Promise<string | null>, okText: string) {
    start(async () => {
      const err = await fn();
      setNotice(err ? { tone: "danger", text: err } : { tone: "ok", text: okText });
      if (!err) router.refresh();
    });
  }

  return (
    <div className="space-y-8">
      {notice ? <p className={notice.tone === "ok" ? "chip-ok" : "chip-danger"}>{notice.text}</p> : null}

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="card p-5">
          <SectionTitle title="Assign a subject" hint="Creates the teacher's Subject Space for that class." />
          <div className="space-y-3">
            <label className="label">Class
              <select className="input mt-1" value={classId} onChange={(e) => setClassId(e.target.value)}>
                {classes.map((c) => <option key={c.id} value={c.id}>{c.name} · {c.section}</option>)}
              </select>
            </label>
            <label className="label">Subject
              <select className="input mt-1" value={offered.some((s) => s.id === subjectId) ? subjectId : offered[0]?.id ?? ""} onChange={(e) => setSubjectId(e.target.value)}>
                {offered.map((s) => <option key={s.id} value={s.id}>{s.name}{s.code ? ` (${s.code})` : ""}</option>)}
              </select>
            </label>
            <label className="label">Teacher
              <select className="input mt-1" value={teacherId} onChange={(e) => setTeacherId(e.target.value)}>
                {teachers.map((t) => <option key={t.id} value={t.id}>{t.name} · {t.subjects.join(", ")}</option>)}
              </select>
            </label>
            <button type="button" disabled={pending} className="btn-primary" onClick={() => run(() => post("/api/admin/spaces", "POST", { subjectId: offered.some((s) => s.id === subjectId) ? subjectId : offered[0]?.id, classId, teacherId }), "Subject Space created. The teacher sees it under My spaces now.")}>
              <Plus size={14} /> Create Subject Space
            </button>
          </div>
        </div>

        <div className="card p-5">
          <SectionTitle title="Add a subject to the catalogue" hint="For programmes outside the Cambridge list, e.g. a school elective." />
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <label className="label">Name<input className="input mt-1" value={name} onChange={(e) => setName(e.target.value)} placeholder="Calligraphy" /></label>
              <label className="label">Code (optional)<input className="input mt-1" value={code} onChange={(e) => setCode(e.target.value)} placeholder="e.g. 4037" /></label>
            </div>
            <label className="label">Board / curriculum<input className="input mt-1" value={board} onChange={(e) => setBoard(e.target.value)} /></label>
            <div>
              <span className="label">Sections</span>
              <div className="flex flex-wrap gap-2">
                {SECTIONS.map((s) => {
                  const on = sections.includes(s);
                  return (
                    <button key={s} type="button" onClick={() => setSections(on ? sections.filter((x) => x !== s) : [...sections, s])} className={on ? "chip-accent" : "chip-neutral"}>
                      {s}
                    </button>
                  );
                })}
              </div>
            </div>
            <label className="label">Strands, one per line
              <textarea className="input mt-1 min-h-24" value={strands} onChange={(e) => setStrands(e.target.value)} placeholder={"Naskh script\nThuluth script\nComposition"} />
            </label>
            <button type="button" disabled={pending} className="btn-soft" onClick={() => run(() => post("/api/admin/subjects", "POST", { name, code, board, sections, strands: strands.split(/\r?\n/) }), `${name} added to the catalogue.`)}>
              <Plus size={14} /> Add subject
            </button>
          </div>
        </div>
      </section>

      <section>
        <SectionTitle title="Current assignments" hint="Change the teacher inline; the space and its resources move with them." />
        <div className="card overflow-x-auto">
          <table className="table">
            <thead><tr><th>Class</th><th>Subject</th><th>Teacher</th><th className="text-right">Students</th></tr></thead>
            <tbody>
              {spaces.map((s) => (
                <tr key={s.id}>
                  <td>{s.className}</td>
                  <td className="font-medium">{s.subject}</td>
                  <td>
                    <span className="inline-flex items-center gap-2">
                      <UserRoundCog size={14} className="text-ink-3" />
                      <select className="input py-1 text-xs" defaultValue={s.teacherId} onChange={(e) => run(() => post("/api/admin/spaces", "PATCH", { spaceId: s.id, teacherId: e.target.value }), `${s.subject} for ${s.className} reassigned.`)}>
                        {teachers.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                      </select>
                    </span>
                  </td>
                  <td className="num text-right">{s.students}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <SectionTitle title="Subject catalogue" hint={`${subjects.length} subjects · Cambridge codes are genuine`} />
        <div className="card overflow-x-auto">
          <table className="table">
            <thead><tr><th>Subject</th><th>Board</th><th>Sections</th><th className="text-right">Strands</th></tr></thead>
            <tbody>
              {subjects.map((s) => (
                <tr key={s.id}>
                  <td className="font-medium">{s.name} {s.code ? <span className="num text-ink-3">{s.code}</span> : null} {s.custom ? <Chip tone="gold">school</Chip> : null}</td>
                  <td className="text-ink-2">{s.board}</td>
                  <td className="text-ink-2">{s.sections.join(", ")}</td>
                  <td className="num text-right">{s.strands}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
