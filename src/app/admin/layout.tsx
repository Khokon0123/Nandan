import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { SiteHeader } from "@/components/site-header";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session || !session.isAdmin) redirect("/login");

  const admin = await prisma.volunteer.findUnique({ where: { id: session.volunteerId } });
  if (!admin) redirect("/login");

  const pendingCount = await prisma.paymentSubmission.count({ where: { status: "PENDING" } });

  return (
    <div className="flex flex-1 flex-col">
      <SiteHeader name={admin.name} homeHref="/admin" />
      <nav className="border-b border-card-border bg-card">
        <div className="mx-auto flex w-full max-w-3xl gap-1 px-4">
          <Link
            href="/admin"
            className="border-b-2 border-transparent px-3 py-3 text-sm font-medium text-muted hover:text-foreground hover:border-primary/40"
          >
            Volunteers
          </Link>
          <Link
            href="/admin/payments"
            className="flex items-center gap-1.5 border-b-2 border-transparent px-3 py-3 text-sm font-medium text-muted hover:text-foreground hover:border-primary/40"
          >
            Pending payments
            {pendingCount > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1.5 text-xs font-semibold text-accent-foreground">
                {pendingCount}
              </span>
            )}
          </Link>
          <Link
            href="/admin/events"
            className="border-b-2 border-transparent px-3 py-3 text-sm font-medium text-muted hover:text-foreground hover:border-primary/40"
          >
            Events
          </Link>
        </div>
      </nav>
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6">{children}</main>
    </div>
  );
}
