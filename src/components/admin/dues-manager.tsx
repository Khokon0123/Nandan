"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { addDue, markDuePaid } from "@/lib/actions/admin";
import { formatDate, formatTaka } from "@/lib/format";

type Due = {
  id: string;
  amount: number;
  note: string;
  status: "PENDING" | "PAID";
  createdAt: string;
};

export function DuesManager({ volunteerId, dues }: { volunteerId: string; dues: Due[] }) {
  const router = useRouter();
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [pendingId, setPendingId] = useState<string | null>(null);

  async function handleAddDue(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const result = await addDue({ volunteerId, amount: Number(amount), note });
    setLoading(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setAmount("");
    setNote("");
    router.refresh();
  }

  async function handleMarkPaid(dueId: string) {
    setPendingId(dueId);
    await markDuePaid({ dueId, volunteerId });
    setPendingId(null);
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-4">
      <form onSubmit={handleAddDue} className="card flex flex-col gap-3">
        <p className="text-sm font-semibold text-foreground">Add a due entry</p>
        <div className="flex gap-3">
          <div className="flex-1">
            <label className="label" htmlFor="amount">Amount (৳)</label>
            <input
              id="amount"
              type="number"
              min="0.01"
              step="0.01"
              className="input-field"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>
          <div className="flex-[2]">
            <label className="label" htmlFor="note">Note</label>
            <input
              id="note"
              className="input-field"
              placeholder="e.g. Q3 2026 dues"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              required
            />
          </div>
        </div>
        {error && <p className="error-text">{error}</p>}
        <button type="submit" className="btn-primary self-start" disabled={loading}>
          {loading ? "Adding..." : "Add due"}
        </button>
      </form>

      <div>
        <p className="mb-2 text-sm font-semibold text-foreground">Due history</p>
        {dues.length === 0 ? (
          <div className="card text-sm text-muted">No dues recorded yet.</div>
        ) : (
          <div className="card divide-y divide-card-border p-0">
            {dues.map((due) => (
              <div key={due.id} className="flex items-center justify-between gap-3 px-5 py-3">
                <div>
                  <p className="text-sm font-medium text-foreground">{due.note}</p>
                  <p className="text-xs text-muted">{formatDate(new Date(due.createdAt))}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-foreground">{formatTaka(due.amount)}</span>
                  {due.status === "PAID" ? (
                    <span className="badge-paid">Paid</span>
                  ) : (
                    <button
                      onClick={() => handleMarkPaid(due.id)}
                      disabled={pendingId === due.id}
                      className="badge-pending cursor-pointer hover:opacity-80 disabled:cursor-not-allowed"
                    >
                      {pendingId === due.id ? "Saving..." : "Mark paid"}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
