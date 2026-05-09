import { ChatPanel } from "@/components/chat/chat-panel";

export const metadata = { title: "AI Asistan — CommerceOS" };

export default function AiPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">AI Asistan</h1>
        <p className="mt-1 text-sm text-[color:var(--color-muted)]">
          Gemini ile düşün, taslak çıkar, soru sor.
        </p>
      </div>
      <ChatPanel />
    </div>
  );
}
