"use client";

import { useEffect, useRef, useState } from "react";
import {
  Boxes,
  MessageSquare,
  Package,
  Send,
  Square,
  TrendingUp,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { CommerceOSLogo } from "@/components/brand/logo";
import { cn } from "@/lib/cn";
import type {
  AgentEvent,
  ChartPayload,
  ChatMessage,
  ToolCall,
} from "@/types/chat";
import { MessageBubble } from "./message-bubble";

const SUGGESTIONS: Array<{
  icon: React.ComponentType<{ className?: string }>;
  text: string;
  hint: string;
}> = [
  {
    icon: TrendingUp,
    text: "Son 30 günün ciro trendini grafikle göster.",
    hint: "Analitik",
  },
  {
    icon: Package,
    text: "En son eklediğim ürün hangisi?",
    hint: "Katalog",
  },
  {
    icon: Boxes,
    text: "Stoğu 5'in altında olan ürünleri listele.",
    hint: "Envanter",
  },
  {
    icon: MessageSquare,
    text: "Geçen hafta İptal edilmiş siparişlerin toplamı kaç ₺?",
    hint: "Operasyon",
  },
];

function newId() {
  return Math.random().toString(36).slice(2);
}

export function ChatPanel() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  function applyEvent(evt: AgentEvent, msgId: string) {
    setMessages((prev) =>
      prev.map((m) => {
        if (m.id !== msgId) return m;
        switch (evt.type) {
          case "tool_call": {
            const isChart = evt.name === "render_chart";
            const newToolCall: ToolCall = {
              id: newId(),
              name: evt.name,
              status: "running",
            };
            return {
              ...m,
              toolCalls: [...(m.toolCalls ?? []), newToolCall],
              charts: isChart
                ? [...(m.charts ?? []), evt.args as unknown as ChartPayload]
                : m.charts,
            };
          }
          case "tool_result": {
            const toolCalls = [...(m.toolCalls ?? [])];
            for (let i = toolCalls.length - 1; i >= 0; i--) {
              if (
                toolCalls[i].name === evt.name &&
                toolCalls[i].status === "running"
              ) {
                toolCalls[i] = {
                  ...toolCalls[i],
                  status: evt.ok ? "ok" : "error",
                };
                break;
              }
            }
            return { ...m, toolCalls };
          }
          case "delta":
            return { ...m, content: m.content + evt.text };
          case "done":
            return m;
          default:
            return m;
        }
      })
    );
  }

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || streaming) return;

    const userMsg: ChatMessage = {
      id: newId(),
      role: "user",
      content: trimmed,
    };
    const assistantMsg: ChatMessage = {
      id: newId(),
      role: "assistant",
      content: "",
      toolCalls: [],
      charts: [],
    };

    setMessages((prev) => [...prev, userMsg, assistantMsg]);
    setInput("");
    setStreaming(true);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch("/api/ai/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMsg].map(({ role, content }) => ({
            role,
            content,
          })),
        }),
        signal: controller.signal,
      });

      if (!res.ok || !res.body) {
        throw new Error(`AI servisi ${res.status}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      // ndjson satır bazlı tüketim
      // eslint-disable-next-line no-constant-condition
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let nl = buffer.indexOf("\n");
        while (nl >= 0) {
          const line = buffer.slice(0, nl).trim();
          buffer = buffer.slice(nl + 1);
          nl = buffer.indexOf("\n");
          if (!line) continue;

          let evt: AgentEvent;
          try {
            evt = JSON.parse(line) as AgentEvent;
          } catch {
            continue;
          }
          applyEvent(evt, assistantMsg.id);
        }
      }
    } catch (err) {
      if ((err as Error).name === "AbortError") {
        // user cancel
      } else {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsg.id
              ? { ...m, content: m.content || "(yanıt alınamadı)" }
              : m
          )
        );
      }
    } finally {
      setStreaming(false);
      abortRef.current = null;
      textareaRef.current?.focus();
    }
  }

  function stop() {
    abortRef.current?.abort();
  }

  function reset() {
    setMessages([]);
    abortRef.current?.abort();
  }

  return (
    <div className="flex h-[calc(100vh-7rem)] flex-col gap-4">
      <div className="flex items-center justify-between rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-bg)] px-5 py-3">
        <div className="flex items-center gap-3">
          <CommerceOSLogo size={36} />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold">Asistan</span>
              <span className="rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-fg)]/[0.04] px-2 py-0.5 text-[10px] font-mono text-[color:var(--color-muted)]">
                gemini-2.5-flash · read-only DB
              </span>
            </div>
            <div className="text-xs text-[color:var(--color-muted)]">
              {messages.length === 0
                ? "Panel verine erişebilirim — sor ve grafik iste"
                : `${Math.ceil(messages.length / 2)} tur · ${
                    streaming ? "düşünüyor…" : "bekleniyor"
                  }`}
            </div>
          </div>
        </div>
        {messages.length > 0 && (
          <Button type="button" variant="ghost" size="sm" onClick={reset}>
            Yeni sohbet
          </Button>
        )}
      </div>

      <div
        ref={scrollRef}
        className="flex-1 themed-scroll overflow-y-auto rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-bg)] p-6"
      >
        {messages.length === 0 ? (
          <EmptyState onPick={(text) => send(text)} />
        ) : (
          <div className="mx-auto max-w-3xl space-y-4">
            {messages.map((msg, i) => (
              <MessageBubble
                key={msg.id}
                message={msg}
                streaming={
                  streaming &&
                  i === messages.length - 1 &&
                  msg.role === "assistant"
                }
              />
            ))}
          </div>
        )}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="mx-auto flex w-full max-w-3xl items-end gap-2 rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-bg)] p-2 shadow-sm focus-within:border-[color:var(--color-accent)]/40 focus-within:ring-2 focus-within:ring-[color:var(--color-accent)]/15"
      >
        <Textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send(input);
            }
          }}
          placeholder="Bir soru yaz… ⏎ gönder, Shift+⏎ satır arası"
          rows={2}
          className="min-h-12 resize-none border-none bg-transparent focus-visible:ring-0"
        />
        {streaming ? (
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={stop}
            aria-label="Durdur"
          >
            <Square className="h-4 w-4" />
          </Button>
        ) : (
          <Button
            type="submit"
            size="icon"
            disabled={!input.trim()}
            aria-label="Gönder"
          >
            <Send className="h-4 w-4" />
          </Button>
        )}
      </form>
    </div>
  );
}

function EmptyState({ onPick }: { onPick: (text: string) => void }) {
  return (
    <div className="mx-auto flex h-full max-w-3xl flex-col items-center justify-center gap-8 text-center">
      <div className="space-y-3">
        <div className="mx-auto flex h-16 w-16 items-center justify-center">
          <CommerceOSLogo size={64} />
        </div>
        <h3 className="text-xl font-semibold tracking-tight">
          CommerceOS Asistan
        </h3>
        <p className="mx-auto max-w-md text-sm text-[color:var(--color-muted)]">
          Panel verine doğrudan erişimim var. Ürün, sipariş, müşteri ve
          envanter sorularını sor — gerektiğinde grafik üretirim.
        </p>
      </div>

      <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2">
        {SUGGESTIONS.map((s) => {
          const Icon = s.icon;
          return (
            <button
              key={s.text}
              type="button"
              onClick={() => onPick(s.text)}
              className={cn(
                "group flex items-start gap-3 rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-fg)]/[0.025] p-4 text-left transition",
                "hover:border-[color:var(--color-accent)]/40 hover:bg-[color:var(--color-fg)]/[0.05]"
              )}
            >
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[color:var(--color-bg)] text-[color:var(--color-muted)] transition group-hover:text-[color:var(--color-accent)]">
                <Icon className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <div className="text-[10px] font-medium uppercase tracking-wider text-[color:var(--color-muted)]">
                  {s.hint}
                </div>
                <div className="mt-0.5 text-sm">{s.text}</div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
