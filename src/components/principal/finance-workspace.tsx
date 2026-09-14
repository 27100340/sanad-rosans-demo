"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Chip, Stat, SectionTitle } from "@/components/ui/primitives";
import { EXPENSE_CATEGORIES, netPay } from "@/lib/domain/finance";
import type { financeSnapshot } from "@/lib/data/finance";
import { fmtPKR } from "@/lib/utils";

export function FinanceWorkspace({
  data,
  approver,
  actorId,
}: {
  data: ReturnType<typeof financeSnapshot>;
  approver: boolean;
  actorId: string;
}) {
  const [tab, setTab] = useState("Overview");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  async function act(body: object) {
    setBusy(true);
    setMessage("");
    try {
      const res = await fetch("/api/finance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setMessage("Saved. The ledger and audit trail have been updated.");
      router.refresh();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Could not save. Try again.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        {["Overview", "Expenses", "Payroll", "Budgets"].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            aria-pressed={tab === t}
            className={tab === t ? "btn-primary btn-sm" : "btn-outline btn-sm"}
          >
            {t}
          </button>
        ))}
        <Link className="btn-outline btn-sm" href="/portal/principal/fees">
          Fees & receipts
        </Link>
        <a className="btn-outline btn-sm" href="/api/finance?export=csv">
          Export CSV
        </a>
      </div>
      <p role="status" className="text-sm text-accent">
        {message}
      </p>
      {tab === "Overview" && (
        <>
          <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
            <Stat
              label="Fees collected"
              value={fmtPKR(data.collected)}
              tone="ok"
              trend="Term 1 receipts"
            />
            <Stat
              label="Outstanding fees"
              value={fmtPKR(data.outstanding)}
              tone="warn"
            />
            <Stat label="Recorded payments out" value={fmtPKR(data.cashOut)} />
            <Stat
              label="Net cash movement"
              value={fmtPKR(data.netCashMovement)}
              trend="Receipts less payments; not bank balance"
            />
          </div>
          <div className="card p-5 space-y-3">
            <SectionTitle
              title="Finance control centre"
              hint="Fictional term-to-date records in PKR."
            />
            <p className="text-sm text-ink-2">
              Manage supplier expenses, approve payroll and compare spending
              with campus budgets. Fees and receipts share the existing student
              invoice ledger.
            </p>
            <p className="text-sm text-ink-2">
              Pending:{" "}
              {data.expenses.filter((e) => e.status === "pending").length}{" "}
              expenses ·{" "}
              {data.payroll.filter((e) => e.status === "draft").length} salary
              reviews. Payments record a demo ledger entry; they do not transfer
              money.
            </p>
          </div>
        </>
      )}
      {tab === "Expenses" && (
        <>
          <form
            className="card grid gap-3 p-5 sm:grid-cols-2"
            onSubmit={async (e) => {
              e.preventDefault();
              const form = e.currentTarget;
              const f = new FormData(form);
              await act({
                action: "create",
                vendor: f.get("vendor"),
                description: f.get("description"),
                amount: Number(f.get("amount")),
                category: f.get("category"),
              });
            }}
          >
            <h2 className="font-semibold sm:col-span-2">
              New expense · Gulberg
            </h2>
            <label className="text-sm">
              Supplier
              <input
                className="input mt-1 w-full"
                name="vendor"
                required
                maxLength={120}
              />
            </label>
            <label className="text-sm">
              Amount (PKR)
              <input
                className="input mt-1 w-full"
                name="amount"
                type="number"
                min={1}
                max={100000000}
                step={1}
                required
              />
            </label>
            <label className="text-sm">
              Category
              <select name="category" className="input mt-1 w-full">
                {EXPENSE_CATEGORIES.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </label>
            <label className="text-sm">
              Description
              <input
                className="input mt-1 w-full"
                name="description"
                required
                maxLength={500}
              />
            </label>
            <button disabled={busy} className="btn-primary sm:col-span-2">
              Submit for independent approval
            </button>
          </form>
          <div className="space-y-3">
            {data.expenses.map((e) => (
              <article
                key={e.id}
                className="card flex flex-wrap items-center justify-between gap-4 p-5"
              >
                <div>
                  <p className="font-semibold">
                    {e.vendor} · {fmtPKR(e.amount)}
                  </p>
                  <p className="text-sm text-ink-2">{e.description}</p>
                  <p className="text-xs text-ink-3">
                    {e.category} · {e.branchId} · {e.date}
                    {e.paymentRef && ` · ${e.paymentRef}`}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 items-center">
                  <Chip tone={e.status === "paid" ? "ok" : "neutral"}>
                    {e.status}
                  </Chip>
                  {e.status === "pending" &&
                    approver &&
                    actorId !== e.createdBy && (
                      <>
                        <button
                          disabled={busy}
                          onClick={() => act({ id: e.id, action: "approve" })}
                          className="btn-outline btn-sm"
                        >
                          Approve
                        </button>
                        <button
                          disabled={busy}
                          onClick={() => act({ id: e.id, action: "reject" })}
                          className="btn-outline btn-sm"
                        >
                          Reject
                        </button>
                      </>
                    )}
                  {e.status === "approved" && (
                    <button
                      disabled={busy}
                      onClick={() => act({ id: e.id, action: "pay" })}
                      className="btn-primary btn-sm"
                    >
                      Record payment
                    </button>
                  )}
                </div>
              </article>
            ))}
          </div>
        </>
      )}
      {tab === "Payroll" && (
        <>
          <SectionTitle
            title="September payroll"
            hint="Draft → principal approval → recorded payment. Deductions are illustrative, not tax calculations."
          />
          <div className="card overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Staff</th>
                  <th>Basic</th>
                  <th>Allowance</th>
                  <th>Deduction</th>
                  <th>Net pay</th>
                  <th>Status / action</th>
                </tr>
              </thead>
              <tbody>
                {data.payroll.map((p) => (
                  <tr key={p.id}>
                    <td>{p.name}</td>
                    <td>{fmtPKR(p.basic)}</td>
                    <td>{fmtPKR(p.allowance)}</td>
                    <td>{fmtPKR(p.deduction)}</td>
                    <td>{fmtPKR(netPay(p))}</td>
                    <td>
                      <div className="flex gap-2 items-center">
                        <Chip>{p.status}</Chip>
                        {p.status === "draft" && approver && (
                          <button
                            disabled={busy}
                            className="btn-outline btn-sm"
                            onClick={() =>
                              act({
                                kind: "payroll",
                                id: p.id,
                                action: "approve",
                              })
                            }
                          >
                            Approve
                          </button>
                        )}
                        {p.status === "approved" && (
                          <button
                            disabled={busy}
                            className="btn-primary btn-sm"
                            onClick={() =>
                              act({ kind: "payroll", id: p.id, action: "pay" })
                            }
                          >
                            Record payment
                          </button>
                        )}
                      </div>
                      {p.paymentRef && (
                        <p className="text-xs mt-2">{p.paymentRef}</p>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
      {tab === "Budgets" && (
        <>
          <SectionTitle
            title="Campus operating budgets"
            hint="Term 1 demo allocations. Commitments include pending, approved and paid expenses; payroll is separate."
          />
          <div className="grid gap-4 sm:grid-cols-2">
            {data.budgets.map((b) => (
              <article className="card p-5" key={b.category}>
                <h3 className="font-semibold">{b.category}</h3>
                <p className="text-sm my-2">
                  {fmtPKR(b.committed)} committed / {fmtPKR(b.budget)} budget
                </p>
                <progress
                  className="w-full accent-emerald-700"
                  max={b.budget}
                  value={Math.min(b.budget, b.committed)}
                  aria-label={b.category}
                />
                <p
                  className={
                    b.committed > b.budget
                      ? "text-danger text-sm"
                      : "text-ink-3 text-sm"
                  }
                >
                  {fmtPKR(b.budget - b.committed)} remaining
                </p>
              </article>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
