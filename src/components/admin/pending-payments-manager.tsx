"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { reviewPaymentSubmission } from "@/lib/actions/admin";
import { formatDate, formatTaka } from "@/lib/format";

const METHOD_LABELS: Record<string, string> = {
  CASH: "Cash",
  BKASH: "bKash",
  NAGAD: "Nagad",
};

type Submission = {
  id: string;
  volunteerId: string;
  volunteerName: string;
  volunteerPhone: string;
  amount: number;
  method: string;
  transactionId: string | null;
  submittedAt: string;
};

function ApproveForm({ submission, onDone }: { submission: Submission; onDone: () => void }) {
  const router = useRouter();
  const defaultNote = `${METHOD_LABELS[submission.method]} payment${
    submission.transactionId ? ` (txn: ${submission.transactionId})` : ""
  }`;
  const [dueAmount, setDueAmount] = useState(String(submission.amount));
  const [dueNote, setDueNote] = useState(defaultNote);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleConfirm() {
    setError(null);
    setLoading(true);
    const result = await reviewPaymentSubmission({
      submissionId: submission.id,
      decision: "APPROVED",
      dueAmount: Number(dueAmount),
      dueNote,
    });
    setLoading(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    router.refresh();
    onDone();
  }

  return (
    <div className="mt-3 flex flex-col gap-3 rounded-xl border border-card-border bg-accent-soft/30 p-3">
      <p className="text-sm text-foreground">
        Confirm the due entry to record for this payment before approving.
      </p>
      <div className="flex gap-3">
        <div className="flex-1">
          <label className="label" htmlFor={`amount-${submission.id}`}>Amount (৳)</label>
          <input
            id={`amount-${submission.id}`}
            type="number"
            min="0.01"
            step="0.01"
            className="input-field"
            value={dueAmount}
            onChange={(e) => setDueAmount(e.target.value)}
          />
        </div>
        <div className="flex-[2]">
          <label className="label" htmlFor={`note-${submission.id}`}>Note</label>
          <input
            id={`note-${submission.id}`}
            className="input-field"
            value={dueNote}
            onChange={(e) => setDueNote(e.target.value)}
          />
        </div>
      </div>
      {error && <p className="error-text">{error}</p>}
      <div className="flex gap-2">
        <button onClick={handleConfirm} disabled={loading} className="btn-primary">
          {loading ? "Approving..." : "Confirm approval"}
        </button>
        <button onClick={onDone} disabled={loading} className="btn-secondary">
          Cancel
        </button>
      </div>
    </div>
  );
}

export function PendingPaymentsManager({ submissions }: { submissions: Submission[] }) {
  const router = useRouter();
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);

  async function handleReject(submissionId: string) {
    if (!confirm("Reject this payment submission?")) return;
    setRejectingId(submissionId);
    await reviewPaymentSubmission({ submissionId, decision: "REJECTED" });
    setRejectingId(null);
    router.refresh();
  }

  if (submissions.length === 0) {
    return <div className="card text-sm text-muted">No pending payment submissions.</div>;
  }

  return (
    <div className="flex flex-col gap-3">
      {submissions.map((submission) => (
        <div key={submission.id} className="card">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-medium text-foreground">{submission.volunteerName}</p>
              <p className="text-sm text-muted">{submission.volunteerPhone}</p>
              <p className="mt-1 text-sm text-foreground">
                {METHOD_LABELS[submission.method]}
                {submission.transactionId ? ` · ${submission.transactionId}` : ""}
              </p>
              <p className="text-xs text-muted">{formatDate(new Date(submission.submittedAt))}</p>
            </div>
            <div className="text-right">
              <p className="text-lg font-semibold text-foreground">{formatTaka(submission.amount)}</p>
            </div>
          </div>

          {approvingId === submission.id ? (
            <ApproveForm submission={submission} onDone={() => setApprovingId(null)} />
          ) : (
            <div className="mt-3 flex gap-2">
              <button onClick={() => setApprovingId(submission.id)} className="btn-primary">
                Approve
              </button>
              <button
                onClick={() => handleReject(submission.id)}
                disabled={rejectingId === submission.id}
                className="btn-secondary text-danger"
              >
                {rejectingId === submission.id ? "Rejecting..." : "Reject"}
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
