import { cn } from "@/lib/cn";

interface GridPatternProps extends React.SVGAttributes<SVGSVGElement> {
  width?: number;
  height?: number;
  x?: number;
  y?: number;
  squares?: Array<[x: number, y: number]>;
  strokeDasharray?: string;
}

/**
 * Subtle SVG grid background. Use behind landing/marketing sections.
 */
export function GridPattern({
  width = 40,
  height = 40,
  x = -1,
  y = -1,
  squares,
  strokeDasharray = "0",
  className,
  ...props
}: GridPatternProps) {
  const id = `pattern-${Math.random().toString(36).slice(2, 9)}`;

  return (
    <svg
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute inset-0 h-full w-full fill-[color:var(--color-fg)]/[0.03] stroke-[color:var(--color-fg)]/[0.1]",
        className
      )}
      {...props}
    >
      <defs>
        <pattern id={id} width={width} height={height} patternUnits="userSpaceOnUse" x={x} y={y}>
          <path d={`M.5 ${height}V.5H${width}`} fill="none" strokeDasharray={strokeDasharray} />
        </pattern>
      </defs>
      <rect width="100%" height="100%" strokeWidth={0} fill={`url(#${id})`} />
      {squares && (
        <svg x={x} y={y} className="overflow-visible">
          {squares.map(([sx, sy]) => (
            <rect
              key={`${sx}-${sy}`}
              strokeWidth="0"
              width={width - 1}
              height={height - 1}
              x={sx * width + 1}
              y={sy * height + 1}
            />
          ))}
        </svg>
      )}
    </svg>
  );
}
