"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  RUBRIC,
  appraisalScore,
  type Appraisal,
  type Criterion,
} from "@/lib/domain/hr";
import { Chip, Stat } from "@/components/ui/primitives";
export function HrWorkspace({
  reviews,
  manager,
}: {
  reviews: Appraisal[];
  manager: boolean;
}) {
  const [selected, setSelected] = useState(reviews[0]?.id ?? "");
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        <Stat label="Appraisals" value={reviews.length} />
        <Stat
          label="Awaiting review"
          value={reviews.filter((a) => a.status === "draft").length}
        />
        <Stat
          label="Acknowledged"
          value={reviews.filter((a) => a.status === "acknowledged").length}
        />
      </div>
      <label className="block text-sm">
        Staff member
        <select
          className="input mt-2 w-full"
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
        >
          {reviews.map((a) => (
            <option key={a.id} value={a.id}>
              {a.teacherName} · {a.status}
            </option>
          ))}
        </select>
      </label>
      {reviews
        .filter((a) => a.id === selected)
        .map((a) => (
          <Review key={`${a.id}-${a.status}`} review={a} manager={manager} />
        ))}
    </div>
  );
}
function Review({
  review: a,
  manager,
}: {
  review: Appraisal;
  manager: boolean;
}) {
  const [ratings, setRatings] = useState(a.ratings);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  const editable = manager && a.status === "draft";
  return (
    <form
      className="card space-y-5 p-5"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setMessage("");
        const f = new FormData(e.currentTarget);
        try {
          const res = await fetch("/api/hr", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              id: a.id,
              action: manager ? "review" : "respond",
              ratings,
              evidence: f.get("evidence"),
              goal: f.get("goal"),
              dueDate: f.get("dueDate"),
              response: f.get("response"),
            }),
          });
          const j = await res.json();
          if (!res.ok) throw new Error(j.error);
          router.refresh();
          setMessage("Appraisal saved.");
        } catch (err) {
          setMessage(err instanceof Error ? err.message : "Unable to save.");
        } finally {
          setBusy(false);
        }
      }}
    >
      <div className="flex justify-between gap-3">
        <div>
          <h2 className="font-semibold">{a.teacherName}</h2>
          <p className="text-sm text-ink-3">
            {a.period} · {a.branchId}
          </p>
        </div>
        <Chip>{a.status}</Chip>
      </div>
      <p className="text-sm text-ink-2">
        Human-reviewed professional growth, not an automatic employment
        decision. Ratings: 1 needs substantial support · 3 meets expectations ·
        5 exemplary. Student test scores alone are not a teacher rating.
      </p>
      <div className="space-y-3">
        {RUBRIC.map((r) => (
          <label
            key={r.key}
            className="flex items-center justify-between gap-4 text-sm"
          >
            <span>
              {r.label} <span className="text-ink-3">({r.weight}%)</span>
            </span>
            <select
              aria-label={r.label}
              disabled={!editable}
              value={ratings[r.key]}
              onChange={(e) =>
                setRatings({
                  ...ratings,
                  [r.key as Criterion]: Number(e.target.value),
                })
              }
              className="input w-20"
            >
              {[1, 2, 3, 4, 5].map((n) => (
                <option key={n}>{n}</option>
              ))}
            </select>
          </label>
        ))}
      </div>
      <p className="font-semibold">
        Weighted rubric score: {appraisalScore(ratings)}/100{" "}
        {a.status === "draft" && "· provisional"}
      </p>
      <label className="block text-sm">
        Observation evidence & work samples
        <textarea
          name="evidence"
          className="input mt-2 w-full min-h-28"
          readOnly={!editable}
          defaultValue={a.evidence}
          required
          minLength={20}
          maxLength={3000}
        />
      </label>
      <label className="block text-sm">
        Professional development goal
        <textarea
          name="goal"
          className="input mt-2 w-full min-h-20"
          readOnly={!editable}
          defaultValue={a.goal}
          required
          minLength={10}
          maxLength={1000}
        />
      </label>
      <label className="block text-sm">
        Follow-up date
        <input
          type="date"
          name="dueDate"
          readOnly={!editable}
          className="input mt-2 block"
          defaultValue={a.dueDate}
          required
        />
      </label>
      {a.response && (
        <div className="rounded-xl bg-canvas p-4 text-sm">
          <strong>Teacher response</strong>
          <p>{a.response}</p>
        </div>
      )}
      {!manager && a.status === "reviewed" && (
        <label className="block text-sm">
          Your response · acknowledgement is not agreement
          <textarea
            className="input mt-2 w-full min-h-24"
            name="response"
            required
            minLength={10}
            maxLength={2000}
          />
        </label>
      )}
      {(editable || (!manager && a.status === "reviewed")) && (
        <button className="btn-primary" disabled={busy}>
          {manager
            ? "Finalise review & notify teacher"
            : "Submit response & acknowledge"}
        </button>
      )}
      <p role="status" className="text-sm">
        {message}
      </p>
    </form>
  );
}
