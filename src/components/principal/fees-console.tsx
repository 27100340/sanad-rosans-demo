"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BellRing, Receipt } from "lucide-react";
import { Avatar, Chip, EmptyState, type Tone } from "@/components/ui/primitives";
import type { InvoiceStatus } from "@/lib/data/mock/fees";

export interface DefaulterRow {
  invoiceId: string;
  studentName: string;
  className: string;
  guardianName: string;
  amount: number;
  paid: number;
  outstanding: number;
  status: InvoiceStatus;
  overdue: boolean;
  remindersSent: number;
}

const STATUS: Record<InvoiceStatus, { label: string; tone: Tone }> = { paid: { label: "Paid", tone: "ok" }, partial: { label: "Part paid", tone: "warn" }, unpaid: { label: "Unpaid", tone: "danger" } };
const API = "/api/fees";

function rs(n: number): string {
  return `Rs ${new Intl.NumberFormat("en-PK").format(n)}`;
}

/** Outstanding invoices with one-tap reminders and a payment recorder. */
export function FeesConsole({ rows }: { rows: DefaulterRow[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [paying, setPaying] = useState<string | null>(null);
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("bank");
  const [note, setNote] = useState<{ tone: "ok" | "danger"; text: string } | null>(null);

  const call = async (body: Record<string, unknown>, key: string, okText: string) => {
    setBusy(key);
    setNote(null);
    try {
      const res = await fetch(API, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
      const out = (await res.json().catch(() => ({}))) as { error?: string; ref?: string };
      if (!res.ok) {
        setNote({ tone: "danger", text: out.error ?? "Something went wrong." });
        return;
      }
      setNote({ tone: "ok", text: out.ref ? `${okText} ${out.ref}.` : okText });
      setPaying(null);
      setAmount("");
      router.refresh();
    } catch {
      setNote({ tone: "danger", text: "Could not reach the server." });
    } finally {
      setBusy(null);
    }
  };

  if (!rows.length) return <EmptyState title="Everyone has paid" body="No outstanding invoices this term." />;

  return (
    <div className="space-y-3">
      {note ? <p className={note.tone === "ok" ? "chip-ok" : "chip-danger"}>{note.text}</p> : null}
      <div className="card divide-y divide-line">
        {rows.map((r) => {
          const st = STATUS[r.status];
          return (
            <div key={r.invoiceId} className="p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <Avatar name={r.studentName} size="sm" tone={r.overdue ? "danger" : "warn"} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-ink">
                    {r.studentName} <span className="font-normal text-ink-3">· {r.className}</span>
                  </p>
                  <p className="text-xs text-ink-3">
                    {r.guardianName} · {rs(r.paid)} of {rs(r.amount)} paid · <span className={r.overdue ? "font-medium text-danger" : ""}>{rs(r.outstanding)} outstanding</span>
                    {r.remindersSent ? ` · ${r.remindersSent} reminder${r.remindersSent === 1 ? "" : "s"} sent` : ""}
                  </p>
                </div>
                <div className="flex shrink-0 flex-wrap items-center gap-2">
                  <Chip tone={r.overdue ? "danger" : st.tone}>{r.overdue ? "Overdue" : st.label}</Chip>
                  <button type="button" className="btn-outline btn-sm" disabled={busy !== null} onClick={() => void call({ action: "remind", invoiceId: r.invoiceId }, `r-${r.invoiceId}`, "Reminder queued to the guardian.")}>
                    <BellRing size={14} /> {busy === `r-${r.invoiceId}` ? "Sending" : "Remind"}
                  </button>
                  <button type="button" className="btn-soft btn-sm" onClick={() => { setPaying(paying === r.invoiceId ? null : r.invoiceId); setAmount(String(r.outstanding)); }}>
                    <Receipt size={14} /> Record payment
                  </button>
                </div>
              </div>
              {paying === r.invoiceId ? (
                <form
                  className="mt-3 flex flex-wrap items-end gap-2 rounded-xl bg-surface-2 p-3"
                  onSubmit={(e) => {
                    e.preventDefault();
                    void call({ action: "payment", invoiceId: r.invoiceId, amount: Number(amount), method }, `p-${r.invoiceId}`, "Payment recorded; receipt");
                  }}
                >
                  <div>
                    <label className="label" htmlFor={`amt-${r.invoiceId}`}>Amount (Rs)</label>
                    <input id={`amt-${r.invoiceId}`} type="number" min={1} max={r.outstanding} className="input w-40" value={amount} onChange={(e) => setAmount(e.target.value)} />
                  </div>
                  <div>
                    <label className="label" htmlFor={`m-${r.invoiceId}`}>Method</label>
                    <select id={`m-${r.invoiceId}`} className="input w-40" value={method} onChange={(e) => setMethod(e.target.value)}>
                      <option value="bank">Bank transfer</option>
                      <option value="cash">Cash</option>
                      <option value="card">Card</option>
                      <option value="easypaisa">Easypaisa</option>
                    </select>
                  </div>
                  <button type="submit" className="btn-primary btn-sm" disabled={busy !== null}>
                    {busy === `p-${r.invoiceId}` ? "Saving" : "Save receipt"}
                  </button>
                </form>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
