"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { submitPaymentClaim } from "@/lib/actions/volunteer";

const METHODS = [
  { value: "CASH", label: "Cash" },
  { value: "BKASH", label: "bKash" },
  { value: "NAGAD", label: "Nagad" },
] as const;

type Method = (typeof METHODS)[number]["value"];

export function PaymentSubmissionForm() {
  const router = useRouter();
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<Method>("CASH");
  const [transactionId, setTransactionId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setLoading(true);
    const result = await submitPaymentClaim({
      amount: Number(amount),
      method,
      transactionId: method === "CASH" ? undefined : transactionId,
    });
    setLoading(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setAmount("");
    setTransactionId("");
    setMethod("CASH");
    setSuccess(true);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="card flex flex-col gap-4">
      <p className="text-sm font-semibold text-foreground">Report a payment</p>
      <div className="flex gap-3">
        <div className="flex-1">
          <label className="label" htmlFor="amount">Amount paid (৳)</label>
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
        <div className="flex-1">
          <label className="label" htmlFor="method">Method</label>
          <select
            id="method"
            className="input-field"
            value={method}
            onChange={(e) => setMethod(e.target.value as Method)}
          >
            {METHODS.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      {method !== "CASH" && (
        <div>
          <label className="label" htmlFor="transactionId">Transaction ID</label>
          <input
            id="transactionId"
            className="input-field"
            value={transactionId}
            onChange={(e) => setTransactionId(e.target.value)}
            placeholder="e.g. 8N3XK2QJ7P"
            required
          />
        </div>
      )}
      {error && <p className="error-text">{error}</p>}
      {success && <p className="text-sm text-success">Submitted. An admin will review it shortly.</p>}
      <button type="submit" className="btn-primary self-start" disabled={loading}>
        {loading ? "Submitting..." : "Submit payment"}
      </button>
    </form>
  );
}
