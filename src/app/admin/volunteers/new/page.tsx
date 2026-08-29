"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createVolunteer } from "@/lib/actions/admin";

export default function NewVolunteerPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const result = await createVolunteer({ name, phone, password, isAdmin });
    setLoading(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    router.push("/admin");
    router.refresh();
  }

  return (
    <div>
      <Link href="/admin" className="text-sm text-primary hover:underline">
        ← Back to volunteers
      </Link>
      <h1 className="mt-2 text-xl font-semibold text-foreground">Add a volunteer</h1>
      <p className="mt-1 text-sm text-muted">
        For volunteers who couldn&apos;t self-register. Share the password with them directly.
      </p>

      <form onSubmit={handleSubmit} className="card mt-6 flex flex-col gap-4">
        <div>
          <label className="label" htmlFor="name">Full name</label>
          <input
            id="name"
            className="input-field"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="label" htmlFor="phone">Phone number</label>
          <input
            id="phone"
            className="input-field"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="01712345678"
            inputMode="numeric"
            required
          />
        </div>
        <div>
          <label className="label" htmlFor="password">Initial password</label>
          <input
            id="password"
            type="text"
            className="input-field"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 8 characters"
            required
          />
        </div>
        <label className="flex items-center gap-2 text-sm text-foreground">
          <input
            type="checkbox"
            checked={isAdmin}
            onChange={(e) => setIsAdmin(e.target.checked)}
            className="h-4 w-4 rounded border-card-border"
          />
          Grant admin access
        </label>
        {error && <p className="error-text">{error}</p>}
        <button type="submit" className="btn-primary mt-1" disabled={loading}>
          {loading ? "Adding..." : "Add volunteer"}
        </button>
      </form>
    </div>
  );
}
