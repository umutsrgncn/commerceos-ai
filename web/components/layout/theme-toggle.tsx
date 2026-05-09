"use client";

import { useState, useTransition } from "react";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { setThemeAction } from "@/lib/actions/theme";
import type { Theme } from "@/lib/theme";

export function ThemeToggle({ initial }: { initial: Theme }) {
  const [theme, setTheme] = useState<Theme>(initial);
  const [, startTransition] = useTransition();

  function toggle() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.dataset.theme = next;
    startTransition(() => {
      setThemeAction(next);
    });
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={toggle}
      aria-label={theme === "dark" ? "Açık tema" : "Koyu tema"}
    >
      {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </Button>
  );
}
