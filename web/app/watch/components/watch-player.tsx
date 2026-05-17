"use client";

import { useEffect, useRef, useState } from "react";
import { Maximize, Minimize, Pause, Play, Volume2, VolumeX } from "lucide-react";

import { cn } from "@/lib/cn";

/**
 * CommerceOS tanıtım video oynatıcı — özel kontroller, browser frame'li.
 * Video: /watch-promo.mp4, poster: /team/watch-cover.jpg
 *
 * Özellikler:
 *  - Play/pause, seek bar (ileri/geri sarma), zaman göstergesi
 *  - Volume slider + sessize alma
 *  - Default ses AÇIK (autoplay yok, kullanıcı tıkladığında ses gelir)
 */
export function WatchPlayer() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(0.85);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [hovering, setHovering] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Hover otomatik gizleme — sadece oynarken
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.volume = volume;
    v.muted = muted;
  }, [volume, muted]);

  // Fullscreen change dinle (ESC ile çıkış durumunda state senk)
  useEffect(() => {
    const onChange = () => setFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  async function toggleFullscreen() {
    const el = containerRef.current;
    if (!el) return;
    try {
      if (!document.fullscreenElement) {
        await el.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch {
      // bazı tarayıcılarda video element'inde de denenebilir
      const v = videoRef.current as (HTMLVideoElement & { webkitEnterFullscreen?: () => void }) | null;
      if (v?.webkitEnterFullscreen) v.webkitEnterFullscreen();
    }
  }

  function togglePlay() {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      v.play().catch(() => {});
      setPlaying(true);
    } else {
      v.pause();
      setPlaying(false);
    }
  }

  function toggleMute() {
    setMuted((m) => !m);
  }

  function onVolumeChange(e: React.ChangeEvent<HTMLInputElement>) {
    const next = Number(e.target.value);
    setVolume(next);
    if (next === 0) setMuted(true);
    else if (muted) setMuted(false);
  }

  function onSeek(e: React.ChangeEvent<HTMLInputElement>) {
    const v = videoRef.current;
    if (!v || !duration) return;
    const next = Number(e.target.value);
    v.currentTime = next;
    setCurrent(next);
  }

  function fmt(t: number): string {
    if (!Number.isFinite(t) || t < 0) return "0:00";
    const m = Math.floor(t / 60);
    const s = Math.floor(t % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  }

  const progressPct = duration > 0 ? (current / duration) * 100 : 0;

  return (
    <div
      ref={containerRef}
      className={cn(
        "group relative overflow-hidden border border-white/10 bg-black shadow-2xl",
        fullscreen ? "h-screen w-screen" : "aspect-video rounded-2xl",
      )}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
    >
      {/* Browser frame */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-center gap-1.5 border-b border-white/[0.06] bg-black/50 px-4 py-2.5 backdrop-blur">
        <span className="h-2.5 w-2.5 rounded-full bg-red-500/70" />
        <span className="h-2.5 w-2.5 rounded-full bg-amber-500/70" />
        <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/70" />
        <span className="ml-3 text-[10px] font-mono text-white/40">
          commerceos.cloud/watch — tanıtım
        </span>
      </div>

      {/* Video — object-contain ki kompozisyon kırpılmasın */}
      <video
        ref={videoRef}
        playsInline
        preload="metadata"
        poster="/team/watch-cover.jpg"
        className="absolute inset-0 h-full w-full bg-black object-contain"
        onClick={togglePlay}
        onTimeUpdate={(e) => setCurrent(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
      >
        <source src="/watch-promo.mp4" type="video/mp4" />
        Tarayıcınız videoyu desteklemiyor.
      </video>

      {/* Dark overlay sadece paused durumda — playing iken (fullscreen dahil) tamamen şeffaf */}
      <div
        className={cn(
          "pointer-events-none absolute inset-0 z-10 bg-gradient-to-b from-black/50 via-black/30 to-black/70 transition-opacity duration-300",
          playing ? "opacity-0" : "opacity-100",
        )}
      />

      {/* Big play button (paused) */}
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

      {/* Bottom controls — seek + play + zaman + volume */}
      <div
        className={cn(
          "absolute inset-x-0 bottom-0 z-30 flex flex-col gap-2 bg-gradient-to-t from-black/85 via-black/55 to-transparent px-4 pb-3 pt-10 transition-opacity",
          hovering || !playing ? "opacity-100" : "opacity-0",
        )}
      >
        {/* Seek bar */}
        <input
          type="range"
          min={0}
          max={duration || 0}
          step={0.05}
          value={current}
          onChange={onSeek}
          aria-label="İleri/geri sar"
          className="watch-seek h-1.5 w-full cursor-pointer appearance-none rounded-full bg-white/15"
          style={{
            backgroundImage: `linear-gradient(to right, rgb(217,70,239) 0%, rgb(217,70,239) ${progressPct}%, rgba(255,255,255,0.15) ${progressPct}%, rgba(255,255,255,0.15) 100%)`,
          }}
        />

        <div className="flex items-center gap-3">
          {/* Play/pause */}
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

          {/* Zaman */}
          <div className="font-mono text-xs tabular-nums text-white/85">
            {fmt(current)}
            <span className="mx-1.5 text-white/40">/</span>
            {fmt(duration)}
          </div>

          <div className="flex-1 text-xs font-medium text-white/85">
            CommerceOS · AI ile e-ticaret operasyonu
          </div>

          {/* Volume — mute toggle + slider */}
          <div className="group/vol flex items-center gap-2">
            <button
              type="button"
              onClick={toggleMute}
              className="grid h-9 w-9 place-items-center rounded-full bg-white/10 text-white backdrop-blur transition hover:bg-white/20"
              aria-label={muted || volume === 0 ? "Sesi aç" : "Sesi kapat"}
            >
              {muted || volume === 0 ? (
                <VolumeX className="h-4 w-4" />
              ) : (
                <Volume2 className="h-4 w-4" />
              )}
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={muted ? 0 : volume}
              onChange={onVolumeChange}
              aria-label="Ses seviyesi"
              className="watch-volume h-1.5 w-20 cursor-pointer appearance-none rounded-full"
              style={{
                backgroundImage: `linear-gradient(to right, white 0%, white ${(muted ? 0 : volume) * 100}%, rgba(255,255,255,0.2) ${(muted ? 0 : volume) * 100}%, rgba(255,255,255,0.2) 100%)`,
              }}
            />
          </div>

          {/* Fullscreen */}
          <button
            type="button"
            onClick={toggleFullscreen}
            className="grid h-9 w-9 place-items-center rounded-full bg-white/10 text-white backdrop-blur transition hover:bg-white/20"
            aria-label={fullscreen ? "Tam ekrandan çık" : "Tam ekran"}
          >
            {fullscreen ? (
              <Minimize className="h-4 w-4" />
            ) : (
              <Maximize className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      {/* Slider thumb stilleri — Tailwind ile zor, inline */}
      <style jsx>{`
        .watch-seek::-webkit-slider-thumb,
        .watch-volume::-webkit-slider-thumb {
          appearance: none;
          width: 12px;
          height: 12px;
          border-radius: 9999px;
          background: white;
          border: 0;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.5);
          cursor: pointer;
        }
        .watch-seek::-moz-range-thumb,
        .watch-volume::-moz-range-thumb {
          width: 12px;
          height: 12px;
          border-radius: 9999px;
          background: white;
          border: 0;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.5);
          cursor: pointer;
        }
      `}</style>
    </div>
  );
}
