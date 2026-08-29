export function StepDots({ total, current }: { total: number; current: number }) {
  return (
    <div className="mt-4 flex items-center gap-1.5" role="presentation">
      {Array.from({ length: total }).map((_, i) => (
        <span
          key={i}
          className={
            i === current
              ? "h-1.5 w-6 rounded-full bg-accent"
              : i < current
                ? "h-1.5 w-1.5 rounded-full bg-primary"
                : "h-1.5 w-1.5 rounded-full bg-card-border"
          }
        />
      ))}
    </div>
  );
}
