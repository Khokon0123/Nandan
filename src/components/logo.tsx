/**
 * Placeholder mark: a simple grain/wheat glyph standing in for the real Nandan
 * logo until that asset is supplied. Swap the <GrainMark> internals (or this
 * whole component) for the real logo file once it's available.
 */
function GrainMark({ className }: { className?: string }) {
  const kernels: { cx: number; cy: number; rx: number; ry: number; rotate: number }[] = [
    { cx: 11, cy: 26.5, rx: 5, ry: 2.15, rotate: -35 },
    { cx: 21, cy: 26.5, rx: 5, ry: 2.15, rotate: 35 },
    { cx: 11.5, cy: 20.5, rx: 4.6, ry: 2, rotate: -32 },
    { cx: 20.5, cy: 20.5, rx: 4.6, ry: 2, rotate: 32 },
    { cx: 12, cy: 15, rx: 4.1, ry: 1.8, rotate: -28 },
    { cx: 20, cy: 15, rx: 4.1, ry: 1.8, rotate: 28 },
    { cx: 12.6, cy: 10.3, rx: 3.4, ry: 1.55, rotate: -24 },
    { cx: 19.4, cy: 10.3, rx: 3.4, ry: 1.55, rotate: 24 },
  ];

  return (
    <svg viewBox="0 0 32 36" fill="none" className={className} aria-hidden="true">
      <path
        d="M16 34 C16.6 26 15 20 16 6.5"
        stroke="currentColor"
        strokeWidth={1.6}
        strokeLinecap="round"
        opacity={0.9}
      />
      <path d="M16 6.5 L16 3.4" stroke="currentColor" strokeWidth={1.4} strokeLinecap="round" />
      {kernels.map((k, i) => (
        <ellipse
          key={i}
          cx={k.cx}
          cy={k.cy}
          rx={k.rx}
          ry={k.ry}
          fill="currentColor"
          transform={`rotate(${k.rotate} ${k.cx} ${k.cy})`}
        />
      ))}
    </svg>
  );
}

type LogoProps = {
  variant?: "mark" | "full";
  tone?: "light" | "brand";
  size?: "sm" | "md" | "lg";
  className?: string;
};

const CHIP_SIZE = {
  sm: "h-8 w-8 rounded-lg p-1.5",
  md: "h-9 w-9 rounded-xl p-1.5",
  lg: "h-16 w-16 rounded-2xl p-3",
};

const WORD_SIZE = {
  sm: "text-base",
  md: "text-lg",
  lg: "text-2xl",
};

export function Logo({ variant = "full", tone = "light", size = "md", className }: LogoProps) {
  const markColor = tone === "light" ? "text-accent" : "text-primary";
  const wordColor = tone === "light" ? "text-white" : "text-foreground";
  const chipBg = tone === "light" ? "bg-white/15" : "bg-primary/10";

  return (
    <span className={`inline-flex items-center gap-2 ${className ?? ""}`}>
      <span className={`flex items-center justify-center ${chipBg} ${CHIP_SIZE[size]}`}>
        <GrainMark className={`h-full w-full ${markColor}`} />
      </span>
      {variant === "full" && (
        <span className={`font-semibold tracking-tight ${wordColor} ${WORD_SIZE[size]}`}>Nandan</span>
      )}
    </span>
  );
}
