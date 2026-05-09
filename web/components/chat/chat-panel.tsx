"use client";

import { useEffect, useRef, useState } from "react";
import { Send, Sparkles, Square } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/cn";
import type { ChatMessage } from "@/types/chat";
import { MessageBubble } from "./message-bubble";

const SUGGESTIONS = [
  "Bugün dikkat etmem gereken siparişler nelerdir?",
  "İptal siparişe nasıl mesaj atmalıyım?",
  "Pamuklu tişört ürün açıklaması yaz.",
  "Stok azalan kalemleri bana hatırlat.",
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

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || streaming) return;

    const userMsg: ChatMessage = { id: newId(), role: "user", content: trimmed };
    const assistantMsg: ChatMessage = { id: newId(), role: "assistant", content: "" };

    setMessages((prev) => [...prev, userMsg, assistantMsg]);
    setInput("");
    setStreaming(true);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch("/api/ai/chat", {
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
      let acc = "";

      // eslint-disable-next-line no-constant-condition
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        setMessages((prev) =>
          prev.map((m) => (m.id === assistantMsg.id ? { ...m, content: acc } : m))
        );
      }
    } catch (err) {
      if ((err as Error).name === "AbortError") {
        // user-initiated stop, leave partial content
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

  return (
    <div className="flex h-[calc(100vh-7rem)] flex-col gap-4">
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-bg)] p-6"
      >
        {messages.length === 0 ? (
          <EmptyState onPick={(text) => send(text)} />
        ) : (
          <div className="space-y-4">
            {messages.map((msg, i) => (
              <MessageBubble
                key={msg.id}
                message={msg}
                streaming={streaming && i === messages.length - 1 && msg.role === "assistant"}
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
        className="flex items-end gap-2 rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-bg)] p-3"
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
          placeholder="Bir soru yaz… Enter göndermek için, Shift+Enter satır arası."
          rows={2}
          className="min-h-12 resize-none border-none focus-visible:ring-0"
        />
        {streaming ? (
          <Button type="button" variant="outline" size="icon" onClick={stop} aria-label="Durdur">
            <Square className="h-4 w-4" />
          </Button>
        ) : (
          <Button type="submit" size="icon" disabled={!input.trim()} aria-label="Gönder">
            <Send className="h-4 w-4" />
          </Button>
        )}
      </form>
    </div>
  );
}

function EmptyState({ onPick }: { onPick: (text: string) => void }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-6 text-center">
      <div className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-white shadow-lg">
        <Sparkles className="h-6 w-6" />
      </div>
      <div className="space-y-1">
        <h3 className="text-lg font-semibold">CommerceOS Asistan</h3>
        <p className="max-w-md text-sm text-[color:var(--color-muted)]">
          Ürün metni yaz, sipariş süreçlerini sorgula, müşteri mesajı taslakla.
          Gemini ile çalışıyor.
        </p>
      </div>

      <div className="flex w-full max-w-2xl flex-wrap justify-center gap-2">
        {SUGGESTIONS.map((suggestion) => (
          <button
            key={suggestion}
            type="button"
            onClick={() => onPick(suggestion)}
            className={cn(
              "rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-fg)]/[0.025] px-3 py-1.5 text-xs",
              "text-[color:var(--color-muted)] transition hover:bg-[color:var(--color-fg)]/[0.06] hover:text-[color:var(--color-fg)]"
            )}
          >
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  );
}
