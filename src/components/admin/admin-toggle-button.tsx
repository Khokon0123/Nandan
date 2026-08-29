"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { setVolunteerAdmin } from "@/lib/actions/admin";

export function AdminToggleButton({ volunteerId, isAdmin }: { volunteerId: string; isAdmin: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    const action = isAdmin ? "remove admin access from" : "promote";
    if (!confirm(`Are you sure you want to ${action} this volunteer?`)) return;
    setError(null);
    setLoading(true);
    const result = await setVolunteerAdmin({ volunteerId, isAdmin: !isAdmin });
    setLoading(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    router.refresh();
  }

  return (
    <div>
      <button onClick={handleClick} disabled={loading} className="btn-secondary">
        {loading ? "Saving..." : isAdmin ? "Remove admin access" : "Promote to admin"}
      </button>
      {error && <p className="error-text mt-2">{error}</p>}
    </div>
  );
}
