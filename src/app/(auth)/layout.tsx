import { Logo } from "@/components/logo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="brand-surface flex flex-1 flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex items-center justify-center">
          <Logo variant="full" tone="light" />
        </div>
        <div className="card">{children}</div>
      </div>
    </div>
  );
}
