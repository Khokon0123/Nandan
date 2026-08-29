import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { Logo } from "@/components/logo";

export default async function Home() {
  const session = await getSession();
  if (session) {
    redirect(session.isAdmin ? "/admin" : "/dashboard");
  }

  return (
    <div className="brand-surface flex flex-1 flex-col items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm text-center">
        <div className="mx-auto mb-6 flex justify-center">
          <Logo variant="mark" tone="light" size="lg" />
        </div>
        <h1 className="text-2xl font-semibold text-white">Nandan Volunteer Portal</h1>
        <p className="mt-2 text-sm text-white/90">
          Manage your membership dues and stay up to date with upcoming events.
        </p>

        <div className="mt-8 flex flex-col gap-3">
          <Link href="/login" className="btn-primary w-full">
            Log in
          </Link>
          <Link href="/signup" className="btn-on-brand w-full">
            Create an account
          </Link>
        </div>
      </div>
    </div>
  );
}
