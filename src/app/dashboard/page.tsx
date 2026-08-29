import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { SiteHeader } from "@/components/site-header";
import { PaymentSubmissionForm } from "@/components/payment-submission-form";
import { formatTaka, formatDate, formatDateTime } from "@/lib/format";

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

const SUBMISSION_LABEL: Record<string, string> = {
  PENDING: "Pending review",
  APPROVED: "Approved",
  REJECTED: "Rejected",
};

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const volunteer = await prisma.volunteer.findUnique({
    where: { id: session.volunteerId },
    include: {
      duePayments: { orderBy: { createdAt: "desc" } },
      paymentSubmissions: { orderBy: { submittedAt: "desc" } },
    },
  });
  if (!volunteer) redirect("/login");

  const upcomingEvents = await prisma.event.findMany({
    where: { eventDate: { gte: new Date() } },
    orderBy: { eventDate: "asc" },
  });

  const totalDue = volunteer.duePayments
    .filter((d) => d.status === "PENDING")
    .reduce((sum, d) => sum + d.amount.toNumber(), 0);

  return (
    <div className="flex flex-1 flex-col">
      <SiteHeader name={volunteer.name} homeHref="/dashboard" />
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-6">
        <section className="card">
          <p className="text-sm text-muted">Outstanding dues</p>
          <p className="mt-1 text-3xl font-semibold text-foreground">
            {totalDue > 0 ? formatTaka(totalDue) : "৳0"}
          </p>
          <p className="mt-1 text-sm text-muted">
            {totalDue > 0 ? "Please settle this with an admin." : "You're all caught up."}
          </p>
        </section>

        <section>
          <PaymentSubmissionForm />
        </section>

        {volunteer.paymentSubmissions.length > 0 && (
          <section>
            <h2 className="mb-3 text-sm font-semibold text-foreground">Your payment submissions</h2>
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
                      {SUBMISSION_LABEL[submission.status]}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {volunteer.duePayments.length > 0 && (
          <section>
            <h2 className="mb-3 text-sm font-semibold text-foreground">Due history</h2>
            <div className="card divide-y divide-card-border p-0">
              {volunteer.duePayments.map((due) => (
                <div key={due.id} className="flex items-center justify-between gap-3 px-5 py-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">{due.note}</p>
                    <p className="text-xs text-muted">{formatDate(due.createdAt)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-foreground">{formatTaka(due.amount.toNumber())}</span>
                    <span className={due.status === "PAID" ? "badge-paid" : "badge-pending"}>
                      {due.status === "PAID" ? "Paid" : "Pending"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        <section>
          <h2 className="mb-3 text-sm font-semibold text-foreground">Upcoming events</h2>
          {upcomingEvents.length === 0 ? (
            <div className="card text-sm text-muted">No upcoming events right now.</div>
          ) : (
            <div className="flex flex-col gap-3">
              {upcomingEvents.map((event) => (
                <div key={event.id} className="card">
                  <p className="font-semibold text-foreground">{event.title}</p>
                  <p className="mt-1 text-sm text-muted">{formatDateTime(event.eventDate)}</p>
                  <p className="text-sm text-muted">{event.location}</p>
                  <p className="mt-2 text-sm text-foreground">{event.description}</p>
                </div>
              ))}
            </div>
          )}
        </section>

        <section>
          <h2 className="mb-3 text-sm font-semibold text-foreground">Your profile</h2>
          <div className="card grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted">Full name</p>
              <p className="text-sm font-medium text-foreground">{volunteer.name}</p>
            </div>
            <div>
              <p className="text-xs text-muted">Phone number</p>
              <p className="text-sm font-medium text-foreground">{volunteer.phone}</p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
