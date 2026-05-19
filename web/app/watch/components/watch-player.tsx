"use client";

import "@vidstack/react/player/styles/default/theme.css";
import "@vidstack/react/player/styles/default/layouts/video.css";

import { MediaPlayer, MediaProvider } from "@vidstack/react";
import {
  DefaultVideoLayout,
  defaultLayoutIcons,
} from "@vidstack/react/player/layouts/default";

/**
 * CommerceOS tanıtım video oynatıcı — Vidstack 1.12 üstüne markaya uyarlanmış.
 * Browser frame chrome dots korunur, kontroller default layout'tan.
 */
export function WatchPlayer() {
  return (
    <div className="commerceos-watch-player group relative overflow-hidden rounded-2xl border border-white/10 bg-black shadow-2xl">
      {/* Browser frame chrome (dots + URL) */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-30 flex items-center gap-1.5 border-b border-white/[0.06] bg-black/50 px-4 py-2.5 backdrop-blur">
        <span className="h-2.5 w-2.5 rounded-full bg-red-500/70" />
        <span className="h-2.5 w-2.5 rounded-full bg-amber-500/70" />
        <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/70" />
        <span className="ml-3 text-[10px] font-mono text-white/40">
          commerceos.cloud/watch — tanıtım
        </span>
      </div>

      <MediaPlayer
        title="CommerceOS — AI ile e-ticaret operasyonu"
        src="/watch-promo.mp4"
        poster="/team/watch-cover.jpg"
        crossOrigin
        playsInline
        volume={0.85}
        aspectRatio="16/9"
        className="aspect-video w-full bg-black"
      >
        <MediaProvider />
        <DefaultVideoLayout icons={defaultLayoutIcons} />
      </MediaPlayer>

      {/* Markaya özel tint — Vidstack default'un üzerine fuchsia accent */}
      <style jsx global>{`
        .commerceos-watch-player {
          --media-brand: #d946ef;
          --media-focus-ring: 2px solid #d946ef80;
        }
        .commerceos-watch-player [data-media-player] {
          --media-tooltip-bg-color: rgba(0, 0, 0, 0.85);
          --media-tooltip-color: #fff;
          --media-slider-track-fill-bg: #d946ef;
          --media-slider-thumb-bg: #fff;
          --media-slider-focused-track-fill-bg: #d946ef;
          --media-button-hover-bg: rgba(217, 70, 239, 0.18);
          background: #000;
        }
        /* Browser frame için video üst kısmına padding bırak */
        .commerceos-watch-player [data-media-controls] {
          padding-top: 48px;
        }
      `}</style>
    </div>
  );
}
