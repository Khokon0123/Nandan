import { prisma } from "@/lib/db";
import { PendingPaymentsManager } from "@/components/admin/pending-payments-manager";

export default async function AdminPaymentsPage() {
  const submissions = await prisma.paymentSubmission.findMany({
    where: { status: "PENDING" },
    include: { volunteer: true },
    orderBy: { submittedAt: "asc" },
  });

  const items = submissions.map((s) => ({
    id: s.id,
    volunteerId: s.volunteerId,
    volunteerName: s.volunteer.name,
    volunteerPhone: s.volunteer.phone,
    amount: s.amount.toNumber(),
    method: s.method,
    transactionId: s.transactionId,
    submittedAt: s.submittedAt.toISOString(),
  }));

  return (
    <div>
      <h1 className="text-xl font-semibold text-foreground">Pending payments</h1>
      <p className="mt-1 text-sm text-muted">
        Review payment claims submitted by volunteers. Approving records a due entry — it does not
        happen automatically.
      </p>
      <div className="mt-6">
        <PendingPaymentsManager submissions={items} />
      </div>
    </div>
  );
}
