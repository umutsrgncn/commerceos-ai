"use client";

/**
 * Smooth-looping video helper.
 *
 * Yo-yo (forward+reverse) etkisi için video dosyası FFmpeg ile zaten
 * pre-rendered olmalı (ileri çal → ters çal → tek dosya). Bu component
 * sadece autoplay/muted/loop/playsInline default'larını veriyor.
 *
 * Eskiden requestAnimationFrame ile manuel currentTime kontrol ediyorduk
 * ama browser her frame'de seek + decode → stutter. Pre-rendered yo-yo
 * + native loop pürüzsüz.
 */

import { type VideoHTMLAttributes } from "react";

type Props = VideoHTMLAttributes<HTMLVideoElement>;

export function SmoothLoopVideo(props: Props) {
  return <video autoPlay muted loop playsInline preload="auto" {...props} />;
}
