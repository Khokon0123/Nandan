"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createEvent, updateEvent } from "@/lib/actions/admin";

type EventFormProps = {
  event?: {
    id: string;
    title: string;
    description: string;
    location: string;
    eventDate: string; // ISO string
  };
};

function toLocalInputValue(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function EventForm({ event }: EventFormProps) {
  const router = useRouter();
  const [title, setTitle] = useState(event?.title ?? "");
  const [description, setDescription] = useState(event?.description ?? "");
  const [location, setLocation] = useState(event?.location ?? "");
  const [eventDate, setEventDate] = useState(event ? toLocalInputValue(event.eventDate) : "");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const result = event
      ? await updateEvent({ id: event.id, title, description, location, eventDate })
      : await createEvent({ title, description, location, eventDate });
    setLoading(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    router.push("/admin/events");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="card flex flex-col gap-4">
      <div>
        <label className="label" htmlFor="title">Title</label>
        <input
          id="title"
          className="input-field"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
      </div>
      <div>
        <label className="label" htmlFor="eventDate">Date &amp; time</label>
        <input
          id="eventDate"
          type="datetime-local"
          className="input-field"
          value={eventDate}
          onChange={(e) => setEventDate(e.target.value)}
          required
        />
      </div>
      <div>
        <label className="label" htmlFor="location">Location</label>
        <input
          id="location"
          className="input-field"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          required
        />
      </div>
      <div>
        <label className="label" htmlFor="description">Description</label>
        <textarea
          id="description"
          className="input-field min-h-24"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
        />
      </div>
      {error && <p className="error-text">{error}</p>}
      <button type="submit" className="btn-primary self-start" disabled={loading}>
        {loading ? "Saving..." : event ? "Save changes" : "Create event"}
      </button>
    </form>
  );
}
