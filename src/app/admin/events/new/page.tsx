import Link from "next/link";
import { EventForm } from "@/components/admin/event-form";

export default function NewEventPage() {
  return (
    <div>
      <Link href="/admin/events" className="text-sm text-primary hover:underline">
        ← Back to events
      </Link>
      <h1 className="mt-2 mb-6 text-xl font-semibold text-foreground">New event</h1>
      <EventForm />
    </div>
  );
}
