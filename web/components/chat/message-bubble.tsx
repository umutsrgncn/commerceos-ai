import { Sparkles, User } from "lucide-react";
import { cn } from "@/lib/cn";
import type { ChatMessage } from "@/types/chat";

export function MessageBubble({ message, streaming }: { message: ChatMessage; streaming?: boolean }) {
  const isUser = message.role === "user";

  return (
    <div className={cn("flex gap-3", isUser && "flex-row-reverse")}>
      <div
        className={cn(
          "grid h-8 w-8 shrink-0 place-items-center rounded-full text-xs font-semibold",
          isUser
            ? "bg-[color:var(--color-fg)]/[0.08] text-[color:var(--color-fg)]"
            : "bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-white"
        )}
        aria-hidden
      >
        {isUser ? <User className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
      </div>

      <div
        className={cn(
          "relative max-w-2xl rounded-2xl px-4 py-3 text-sm whitespace-pre-wrap",
          isUser
            ? "bg-[color:var(--color-fg)]/[0.06] text-[color:var(--color-fg)]"
            : "border border-[color:var(--color-border)] bg-[color:var(--color-bg)]"
        )}
      >
        {message.content || (streaming && <span className="text-[color:var(--color-muted)]">…</span>)}
        {streaming && message.content && (
          <span className="ml-1 inline-block h-3.5 w-1.5 animate-pulse rounded-sm bg-[color:var(--color-fg)]/40 align-text-bottom" />
        )}
      </div>
    </div>
  );
}
