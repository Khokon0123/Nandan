import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { formatDate, formatTaka } from "@/lib/format";
import { DuesManager } from "@/components/admin/dues-manager";
import { AdminToggleButton } from "@/components/admin/admin-toggle-button";

const METHOD_LABELS: Record<string, string> = {
  CASH: "Cash",
  BKASH: "bKash",
  NAGAD: "Nagad",
};

const SUBMISSION_BADGE: Record<string, string> = {
  PENDING: "badge-pending",
  APPROVED: "badge-paid",
  REJECTED: "badge-rejected",
};

export default async function VolunteerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const volunteer = await prisma.volunteer.findUnique({
    where: { id },
    include: {
      duePayments: { orderBy: { createdAt: "desc" } },
      paymentSubmissions: { orderBy: { submittedAt: "desc" } },
    },
  });
  if (!volunteer) notFound();

  const dues = volunteer.duePayments.map((d) => ({
    id: d.id,
    amount: d.amount.toNumber(),
    note: d.note,
    status: d.status,
    createdAt: d.createdAt.toISOString(),
  }));

  return (
    <div>
      <Link href="/admin" className="text-sm text-primary hover:underline">
        ← Back to volunteers
      </Link>

      <div className="card mt-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold text-foreground">{volunteer.name}</h1>
            <p className="mt-1 text-sm text-muted">{volunteer.phone}</p>
            <p className="text-sm text-muted">Joined {formatDate(volunteer.createdAt)}</p>
            {volunteer.isAdmin && (
              <span className="badge-pending mt-2 inline-flex">Admin</span>
            )}
          </div>
          <AdminToggleButton volunteerId={volunteer.id} isAdmin={volunteer.isAdmin} />
        </div>
      </div>

      {volunteer.paymentSubmissions.length > 0 && (
        <div className="mt-6">
          <h2 className="mb-3 text-sm font-semibold text-foreground">Payment submissions</h2>
          <div className="card divide-y divide-card-border p-0">
            {volunteer.paymentSubmissions.map((submission) => (
              <div key={submission.id} className="flex items-center justify-between gap-3 px-5 py-3">
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {METHOD_LABELS[submission.method]}
                    {submission.transactionId ? ` · ${submission.transactionId}` : ""}
                  </p>
                  <p className="text-xs text-muted">{formatDate(submission.submittedAt)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-foreground">
                    {formatTaka(submission.amount.toNumber())}
                  </span>
                  <span className={SUBMISSION_BADGE[submission.status]}>
                    {submission.status === "PENDING"
                      ? "Pending"
                      : submission.status === "APPROVED"
                        ? "Approved"
                        : "Rejected"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-6">
        <DuesManager volunteerId={volunteer.id} dues={dues} />
      </div>
    </div>
  );
}
