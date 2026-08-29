import Link from "next/link";
import { prisma } from "@/lib/db";
import { formatDate, formatTaka } from "@/lib/format";

export default async function AdminVolunteersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = q?.trim() ?? "";

  const volunteers = await prisma.volunteer.findMany({
    where: query
      ? {
          OR: [
            { name: { contains: query, mode: "insensitive" } },
            { phone: { contains: query } },
          ],
        }
      : undefined,
    include: { duePayments: { where: { status: "PENDING" } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-semibold text-foreground">Volunteers</h1>
        <Link href="/admin/volunteers/new" className="btn-primary">
          Add volunteer
        </Link>
      </div>

      <form className="mt-4" method="get">
        <input
          type="text"
          name="q"
          defaultValue={query}
          placeholder="Search by name or phone"
          className="input-field"
        />
      </form>

      <div className="mt-4 flex flex-col gap-2">
        {volunteers.length === 0 && (
          <div className="card text-sm text-muted">No volunteers found.</div>
        )}
        {volunteers.map((volunteer) => {
          const totalDue = volunteer.duePayments.reduce((sum, d) => sum + d.amount.toNumber(), 0);
          return (
            <Link
              key={volunteer.id}
              href={`/admin/volunteers/${volunteer.id}`}
              className="card flex items-center justify-between gap-3 transition-colors hover:bg-accent-soft/40"
            >
              <div>
                <p className="font-medium text-foreground">{volunteer.name}</p>
                <p className="text-sm text-muted">{volunteer.phone}</p>
                <p className="text-xs text-muted">Joined {formatDate(volunteer.createdAt)}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-foreground">
                  {totalDue > 0 ? formatTaka(totalDue) : "৳0"}
                </p>
                <p className="text-xs text-muted">{totalDue > 0 ? "due" : "cleared"}</p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
