import Link from "next/link";
import { logout } from "@/lib/actions/auth";
import { Logo } from "@/components/logo";

export function SiteHeader({
  name,
  homeHref,
}: {
  name: string;
  homeHref: string;
}) {
  return (
    <header className="brand-surface">
      <div className="mx-auto flex w-full max-w-3xl items-center justify-between px-4 py-3">
        <Link href={homeHref}>
          <Logo />
        </Link>
        <div className="flex items-center gap-3">
          <span className="hidden text-sm text-white/90 sm:inline">{name}</span>
          <form action={logout}>
            <button
              type="submit"
              className="rounded-full border border-white/30 bg-white/10 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-white/20"
            >
              Log out
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
