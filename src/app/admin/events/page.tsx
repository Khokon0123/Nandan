import Link from "next/link";
import { prisma } from "@/lib/db";
import { formatDateTime } from "@/lib/format";
import { DeleteEventButton } from "@/components/admin/delete-event-button";

export default async function AdminEventsPage() {
  const now = new Date();
  const events = await prisma.event.findMany({ orderBy: { eventDate: "asc" } });
  const upcoming = events.filter((e) => e.eventDate >= now);
  const past = events.filter((e) => e.eventDate < now).reverse();

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-semibold text-foreground">Events</h1>
        <Link href="/admin/events/new" className="btn-primary">
          New event
        </Link>
      </div>

      <section className="mt-6">
        <h2 className="mb-2 text-sm font-semibold text-foreground">Upcoming</h2>
        {upcoming.length === 0 ? (
          <div className="card text-sm text-muted">No upcoming events.</div>
        ) : (
          <div className="flex flex-col gap-3">
            {upcoming.map((event) => (
              <div key={event.id} className="card">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-foreground">{event.title}</p>
                    <p className="mt-1 text-sm text-muted">{formatDateTime(event.eventDate)}</p>
                    <p className="text-sm text-muted">{event.location}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <Link href={`/admin/events/${event.id}/edit`} className="text-sm font-medium text-primary hover:underline">
                      Edit
                    </Link>
                    <DeleteEventButton id={event.id} />
                  </div>
                </div>
                <p className="mt-2 text-sm text-foreground">{event.description}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="mt-8">
        <h2 className="mb-2 text-sm font-semibold text-foreground">Past</h2>
        {past.length === 0 ? (
          <div className="card text-sm text-muted">No past events yet.</div>
        ) : (
          <div className="flex flex-col gap-3">
            {past.map((event) => (
              <div key={event.id} className="card opacity-70">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-foreground">{event.title}</p>
                    <p className="mt-1 text-sm text-muted">{formatDateTime(event.eventDate)}</p>
                    <p className="text-sm text-muted">{event.location}</p>
                  </div>
                  <DeleteEventButton id={event.id} />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
