import { CheckCircle2, Loader2, User, XCircle } from "lucide-react";
import { cn } from "@/lib/cn";
import type { ChatMessage } from "@/types/chat";
import { CommerceOSLogo } from "@/components/brand/logo";
import { ChartBlock } from "./chart-block";
import { MarkdownText } from "./markdown";

const TOOL_LABELS: Record<string, string> = {
  query_database: "Veritabanına sorgu atılıyor",
  render_chart: "Grafik hazırlanıyor",
};

export function MessageBubble({
  message,
  streaming,
}: {
  message: ChatMessage;
  streaming?: boolean;
}) {
  const isUser = message.role === "user";

  return (
    <div className={cn("flex gap-3", isUser && "flex-row-reverse")}>
      <div
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
          isUser && "bg-[color:var(--color-fg)]/[0.08] text-[color:var(--color-fg)]",
        )}
        aria-hidden
      >
        {isUser ? <User className="h-4 w-4" /> : <CommerceOSLogo size={32} />}
      </div>

      <div className="flex max-w-2xl flex-col gap-2">
        {message.toolCalls && message.toolCalls.length > 0 && (
          <ul className="space-y-1">
            {message.toolCalls.map((call) => {
              const label = TOOL_LABELS[call.name] ?? call.name;
              return (
                <li
                  key={call.id}
                  className={cn(
                    "flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs",
                    call.status === "running"
                      ? "border-[color:var(--color-border)] bg-[color:var(--color-fg)]/[0.025] text-[color:var(--color-muted)]"
                      : call.status === "ok"
                        ? "border-emerald-500/20 bg-emerald-500/[0.06] text-emerald-600 dark:text-emerald-400"
                        : "border-red-500/30 bg-red-500/10 text-red-500"
                  )}
                >
                  {call.status === "running" ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : call.status === "ok" ? (
                    <CheckCircle2 className="h-3 w-3" />
                  ) : (
                    <XCircle className="h-3 w-3" />
                  )}
                  <span>{label}</span>
                  <span className="ml-auto font-mono text-[10px] opacity-60">
                    {call.name}
                  </span>
                </li>
              );
            })}
          </ul>
        )}

        {(message.content || streaming) && (
          <div
            className={cn(
              "relative rounded-2xl px-4 py-3 text-sm",
              isUser
                ? "whitespace-pre-wrap bg-[color:var(--color-fg)]/[0.06] text-[color:var(--color-fg)]"
                : "border border-[color:var(--color-border)] bg-[color:var(--color-bg)]"
            )}
          >
            {/* User mesajı düz metin; assistant çıktısı markdown render edilir. */}
            {isUser ? (
              message.content
            ) : message.content ? (
              <MarkdownText text={message.content} />
            ) : (
              streaming && (
                <span className="text-[color:var(--color-muted)]">…</span>
              )
            )}
            {streaming && message.content && (
              <span className="ml-1 inline-block h-3.5 w-1.5 animate-pulse rounded-sm bg-[color:var(--color-fg)]/40 align-text-bottom" />
            )}
          </div>
        )}

        {message.charts && message.charts.length > 0 && (
          <div className="space-y-2">
            {message.charts.map((chart, i) => (
              <ChartBlock key={i} chart={chart} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
