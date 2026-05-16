"use client";

import { useEffect } from "react";

/**
 * Landing sayfası her zaman dark. Mount'ta <html data-theme="dark"> set eder,
 * unmount'ta önceki kullanıcı temasına geri döner (cookie hala saklı).
 */
export function DarkLock() {
  useEffect(() => {
    const html = document.documentElement;
    const prev = html.getAttribute("data-theme");
    html.setAttribute("data-theme", "dark");
    return () => {
      if (prev === null) html.removeAttribute("data-theme");
      else html.setAttribute("data-theme", prev);
    };
  }, []);
  return null;
}
