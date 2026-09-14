"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  STAGES,
  stageFor,
  type LessonPlan,
  type LearningObservation,
} from "@/lib/domain/teaching";
import type { SchoolClass, Student } from "@/lib/domain/types";
import { Chip } from "@/components/ui/primitives";
export function PathwayWorkspace({
  classes,
  plans,
  students,
  observations,
  readOnly,
}: {
  classes: SchoolClass[];
  plans: LessonPlan[];
  students: Student[];
  observations: LearningObservation[];
  readOnly: boolean;
}) {
  const [classId, setClassId] = useState(classes[0]?.id ?? "");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  const cls = classes.find((c) => c.id === classId);
  if (!cls) return <p>No academic classes assigned to this seat.</p>;
  const stage = STAGES[stageFor(cls)];
  const learners = students.filter((s) => s.classId === classId);
  async function act(data: object) {
    setBusy(true);
    try {
      const res = await fetch("/api/teaching", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, classId }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error);
      setMessage(
        "Saved to this class. Published activities are visible to learners and guardians.",
      );
      router.refresh();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Could not save.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="space-y-6">
      <label className="block text-sm">
        Class
        <select
          className="input mt-2 w-full"
          value={classId}
          onChange={(e) => setClassId(e.target.value)}
        >
          {classes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </label>
      <div className="card p-5 space-y-3">
        <Chip tone="accent">{stage.label}</Chip>
        <h2 className="text-lg font-semibold">
          Teaching that fits the learner
        </h2>
        <p className="text-sm">{stage.approach}</p>
        <p className="text-sm text-ink-2">{stage.assessment}</p>
        <p className="text-sm text-ink-2">{stage.home}</p>
        <p className="text-xs text-ink-3">
          Suggested session: {stage.minutes} minutes · Curriculum areas:{" "}
          {stage.subjects.join(" · ")}
        </p>
      </div>
      <p role="status" className="text-sm">
        {message}
      </p>
      {!readOnly && (
        <button
          className="btn-primary"
          disabled={busy}
          onClick={() => act({ action: "draft" })}
        >
          Create editable lesson draft
        </button>
      )}
      <div className="space-y-4">
        {plans
          .filter((l) => l.classId === classId)
          .map((l) => (
            <form
              key={l.id}
              className="card p-5 space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                const f = Object.fromEntries(new FormData(e.currentTarget));
                void act({ ...f, action: "publish", id: l.id });
              }}
            >
              <div className="flex items-center justify-between gap-3">
                <h3 className="font-semibold">{l.title}</h3>
                <Chip tone={l.status === "published" ? "ok" : "warn"}>
                  {l.status}
                </Chip>
              </div>
              {(
                [
                  ["title", "Lesson title"],
                  ["subject", "Subject"],
                  ["objective", "Learning objective"],
                  ["activity", "Teaching sequence & differentiation"],
                  ["assessment", "Check understanding"],
                  ["home", "Home connection"],
                ] as const
              ).map(([key, label]) => (
                <label key={key} className="block text-sm">
                  {label}
                  {l.status === "draft" && !readOnly ? (
                    <textarea
                      className="input mt-1 w-full"
                      name={key}
                      defaultValue={l[key]}
                      required
                      minLength={3}
                      maxLength={3000}
                    />
                  ) : (
                    <p className="mt-1 text-ink-2">{l[key]}</p>
                  )}
                </label>
              ))}
              {l.status === "draft" && !readOnly && (
                <button className="btn-primary btn-sm" disabled={busy}>
                  Publish reviewed lesson
                </button>
              )}
            </form>
          ))}
      </div>
      {!readOnly && learners.length > 0 && (
        <form
          className="card p-5 space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            const f = Object.fromEntries(new FormData(e.currentTarget));
            void act({ ...f, action: "observe" });
          }}
        >
          <h2 className="font-semibold">
            Learning portfolio · record evidence
          </h2>
          <label className="block text-sm">
            Learner
            <select name="studentId" className="input mt-1 w-full">
              {learners.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            Attainment
            <select name="attainment" className="input mt-1 w-full">
              <option value="emerging">Emerging · adult support</option>
              <option value="developing">Developing · with prompts</option>
              <option value="secure">Secure · independent</option>
            </select>
          </label>
          <label className="block text-sm">
            What did the learner do?
            <textarea
              className="input mt-1 w-full"
              name="note"
              required
              minLength={10}
              maxLength={1500}
            />
          </label>
          <button disabled={busy} className="btn-primary btn-sm">
            Save observation
          </button>
        </form>
      )}
      {observations
        .filter((o) => o.classId === classId)
        .map((o) => (
          <article className="card p-4" key={o.id}>
            <p className="font-medium">
              {students.find((s) => s.id === o.studentId)?.name}{" "}
              <Chip>{o.attainment}</Chip>
            </p>
            <p className="text-sm mt-2">{o.note}</p>
          </article>
        ))}
    </div>
  );
}
