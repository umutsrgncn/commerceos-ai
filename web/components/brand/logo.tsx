/**
 * CommerceOS logo — temiz SVG, vector ölçekli.
 *
 * Tasarım:
 *  - Açık halka 'C' (sağ tarafta boşluk)
 *  - İç tarafta devre kartı izleri + 3 node noktası
 *  - Lineer gradient: cyan → purple → magenta
 *  - Neon glow (Gaussian blur filter)
 */

export function CommerceOSLogo({
  size = 36,
  className,
  glow = true,
}: {
  size?: number;
  className?: string;
  glow?: boolean;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="CommerceOS"
    >
      <defs>
        <linearGradient id="cos-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#22d3ee" />
          <stop offset="55%" stopColor="#a855f7" />
          <stop offset="100%" stopColor="#ec4899" />
        </linearGradient>
        <linearGradient id="cos-grad-2" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#22d3ee" />
          <stop offset="50%" stopColor="#8b5cf6" />
          <stop offset="100%" stopColor="#ec4899" />
        </linearGradient>
        {glow && (
          <filter id="cos-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="1.6" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        )}
      </defs>

      <g filter={glow ? "url(#cos-glow)" : undefined}>
        {/* Açık 'C' halkası */}
        <path
          d="M 49 18 A 22 22 0 1 0 49 46"
          stroke="url(#cos-grad)"
          strokeWidth="5"
          strokeLinecap="round"
          fill="none"
        />

        {/* İç devre izleri */}
        <g stroke="url(#cos-grad-2)" strokeWidth="1.5" strokeLinecap="round" fill="none">
          <line x1="18" y1="26" x2="30" y2="26" />
          <line x1="18" y1="32" x2="34" y2="32" />
          <line x1="18" y1="38" x2="30" y2="38" />
        </g>

        {/* Node noktaları */}
        <g fill="url(#cos-grad)">
          <circle cx="32" cy="26" r="2" />
          <circle cx="36" cy="32" r="2.5" />
          <circle cx="32" cy="38" r="2" />
        </g>

        {/* Vurgu node — orta-sağ */}
        <circle
          cx="36"
          cy="32"
          r="1"
          fill="white"
          opacity="0.85"
        />
      </g>
    </svg>
  );
}
