import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { EventForm } from "@/components/admin/event-form";

export default async function EditEventPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const event = await prisma.event.findUnique({ where: { id } });
  if (!event) notFound();

  return (
    <div>
      <Link href="/admin/events" className="text-sm text-primary hover:underline">
        ← Back to events
      </Link>
      <h1 className="mt-2 mb-6 text-xl font-semibold text-foreground">Edit event</h1>
      <EventForm
        event={{
          id: event.id,
          title: event.title,
          description: event.description,
          location: event.location,
          eventDate: event.eventDate.toISOString(),
        }}
      />
    </div>
  );
}
