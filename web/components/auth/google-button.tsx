"use client";

import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";

export function GoogleButton() {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      variant="outline"
      size="lg"
      disabled={pending}
      className="w-full"
    >
      <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
        <path
          fill="#FFC107"
          d="M21.8 12.2c0-.7-.1-1.4-.2-2H12v3.8h5.5c-.2 1.3-1 2.4-2 3.1v2.6h3.3c2-1.8 3-4.5 3-7.5z"
        />
        <path
          fill="#FF3D00"
          d="M6.3 14.1l-.7.6L3 16.9c1.6 3.2 5 5.4 8.9 5.4 2.7 0 5-1 6.6-2.6L15.2 17c-.9.6-2 1-3.2 1-2.5 0-4.6-1.7-5.4-4l-.3-.4z"
        />
        <path
          fill="#4CAF50"
          d="M3 7.1C2.4 8.4 2 9.9 2 11.5s.4 3.1 1 4.4c0 0 3.3-2.6 3.3-2.6-.2-.6-.3-1.2-.3-1.8s.1-1.2.3-1.8L3 7.1z"
        />
        <path
          fill="#1976D2"
          d="M11.9 5.5c1.5 0 2.8.5 3.8 1.5l2.9-2.9C16.9 2.5 14.6 1.5 11.9 1.5c-3.9 0-7.3 2.2-8.9 5.4L6.3 9.7c.8-2.3 2.9-4 5.4-4z"
        />
      </svg>
      {pending ? "Yönlendiriliyor..." : "Google ile devam et"}
    </Button>
  );
}
