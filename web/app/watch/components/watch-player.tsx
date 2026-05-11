"use client";

import { useRef, useState } from "react";
import { Pause, Play, Volume2, VolumeX } from "lucide-react";

import { cn } from "@/lib/cn";

/**
 * Cinematic video player — dummy video, custom controls.
 * Dummy MP4 yoksa poster + play UI gösterir.
 */
export function WatchPlayer() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(true);
  const [hovering, setHovering] = useState(false);

  function togglePlay() {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      v.play();
      setPlaying(true);
    } else {
      v.pause();
      setPlaying(false);
    }
  }

  function toggleMute() {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    setMuted(v.muted);
  }

  return (
    <div
      className="group relative aspect-video overflow-hidden rounded-2xl border border-white/10 bg-black shadow-2xl"
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
    >
      {/* Browser frame */}
      <div className="absolute inset-x-0 top-0 z-20 flex items-center gap-1.5 border-b border-white/[0.06] bg-black/50 px-4 py-2.5 backdrop-blur">
        <span className="h-2.5 w-2.5 rounded-full bg-red-500/70" />
        <span className="h-2.5 w-2.5 rounded-full bg-amber-500/70" />
        <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/70" />
        <span className="ml-3 text-[10px] font-mono text-white/40">
          commerceos.dev/watch — 1 dakikalık tanıtım
        </span>
      </div>

      {/* Video */}
      <video
        ref={videoRef}
        muted={muted}
        playsInline
        loop
        poster="/team/shot-dashboard.jpg"
        className="absolute inset-0 h-full w-full object-cover"
        onClick={togglePlay}
      >
        <source src="/watch-promo.mp4" type="video/mp4" />
      </video>

      {/* Dark overlay when not playing */}
      <div
        className={cn(
          "absolute inset-0 z-10 bg-gradient-to-b from-black/50 via-black/30 to-black/70 transition-opacity",
          playing && !hovering ? "opacity-0" : "opacity-100",
        )}
      />

      {/* Big play button (when paused) */}
      {!playing && (
        <button
          type="button"
          onClick={togglePlay}
          className="absolute inset-0 z-30 flex items-center justify-center"
          aria-label="Oynat"
        >
          <span className="grid h-20 w-20 place-items-center rounded-full bg-white/95 text-black shadow-2xl shadow-fuchsia-500/40 transition group-hover:scale-105 group-hover:bg-white">
            <Play className="ml-1 h-8 w-8 fill-black" />
          </span>
        </button>
      )}

      {/* Bottom controls */}
      <div
        className={cn(
          "absolute inset-x-0 bottom-0 z-30 flex items-center gap-3 bg-gradient-to-t from-black/80 via-black/40 to-transparent px-4 pb-4 pt-10 transition-opacity",
          hovering || !playing ? "opacity-100" : "opacity-0",
        )}
      >
        <button
          type="button"
          onClick={togglePlay}
          className="grid h-9 w-9 place-items-center rounded-full bg-white/95 text-black transition hover:bg-white"
          aria-label={playing ? "Duraklat" : "Oynat"}
        >
          {playing ? (
            <Pause className="h-4 w-4 fill-black" />
          ) : (
            <Play className="ml-0.5 h-4 w-4 fill-black" />
          )}
        </button>
        <div className="flex-1 text-xs font-medium text-white/85">
          CommerceOS · AI ile e-ticaret operasyonu
        </div>
        <button
          type="button"
          onClick={toggleMute}
          className="grid h-9 w-9 place-items-center rounded-full bg-white/10 text-white backdrop-blur transition hover:bg-white/20"
          aria-label={muted ? "Sesi aç" : "Sesi kapat"}
        >
          {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}
