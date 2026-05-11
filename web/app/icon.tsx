import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "black",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <svg width="28" height="28" viewBox="0 0 64 64" fill="none">
          <defs>
            <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#22d3ee" />
              <stop offset="55%" stopColor="#a855f7" />
              <stop offset="100%" stopColor="#ec4899" />
            </linearGradient>
          </defs>
          <path
            d="M 49 18 A 22 22 0 1 0 49 46"
            stroke="url(#g)"
            strokeWidth="6"
            strokeLinecap="round"
            fill="none"
          />
          <circle cx="36" cy="32" r="3" fill="url(#g)" />
        </svg>
      </div>
    ),
    size,
  );
}
