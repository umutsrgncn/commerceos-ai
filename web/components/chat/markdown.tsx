"use client";

import { Fragment } from "react";

/**
 * Minimal Markdown renderer for the chat assistant's output.
 * Handles only what Gemini commonly produces:
 *   - **bold**, *italic*, `code`
 *   - Bullet lists (`- item` or `* item`)
 *   - Numbered lists (`1. item`)
 *   - Blank lines as paragraph breaks
 *
 * react-markdown veya remark eklemekten kaçındık — chat çıktısı sade,
 * regex bazlı renderer 50 satırda iş görüyor.
 */
export function MarkdownText({ text }: { text: string }) {
  if (!text) return null;

  // Split into block segments by blank lines.
  const blocks = text.split(/\n{2,}/);
  return (
    <div className="space-y-2">
      {blocks.map((block, i) => (
        <Block key={i} text={block} />
      ))}
    </div>
  );
}

function Block({ text }: { text: string }) {
  const lines = text.split("\n");

  // Bullet list?
  if (lines.every((l) => /^\s*[-*]\s+/.test(l) || l.trim() === "")) {
    const items = lines
      .filter((l) => l.trim() !== "")
      .map((l) => l.replace(/^\s*[-*]\s+/, ""));
    return (
      <ul className="list-disc space-y-1 pl-5">
        {items.map((it, i) => (
          <li key={i}>
            <Inline text={it} />
          </li>
        ))}
      </ul>
    );
  }

  // Numbered list?
  if (lines.every((l) => /^\s*\d+\.\s+/.test(l) || l.trim() === "")) {
    const items = lines
      .filter((l) => l.trim() !== "")
      .map((l) => l.replace(/^\s*\d+\.\s+/, ""));
    return (
      <ol className="list-decimal space-y-1 pl-5">
        {items.map((it, i) => (
          <li key={i}>
            <Inline text={it} />
          </li>
        ))}
      </ol>
    );
  }

  // Regular paragraph — preserve internal newlines as <br>.
  return (
    <p className="whitespace-pre-wrap">
      {lines.map((line, i) => (
        <Fragment key={i}>
          {i > 0 && <br />}
          <Inline text={line} />
        </Fragment>
      ))}
    </p>
  );
}

/**
 * Renders inline formatting: **bold**, *italic*, `code`.
 * Tokens are matched in order; the first match wins so we don't
 * accidentally nest. Good enough for assistant output.
 */
function Inline({ text }: { text: string }) {
  const TOKEN = /(\*\*[^*\n]+\*\*|\*[^*\n]+\*|`[^`\n]+`)/g;
  const parts = text.split(TOKEN);
  return (
    <>
      {parts.map((part, i) => {
        if (!part) return null;
        if (part.startsWith("**") && part.endsWith("**")) {
          return <strong key={i}>{part.slice(2, -2)}</strong>;
        }
        if (part.startsWith("*") && part.endsWith("*") && part.length > 2) {
          return <em key={i}>{part.slice(1, -1)}</em>;
        }
        if (part.startsWith("`") && part.endsWith("`")) {
          return (
            <code
              key={i}
              className="rounded bg-[color:var(--color-fg)]/[0.06] px-1 py-0.5 font-mono text-[0.85em]"
            >
              {part.slice(1, -1)}
            </code>
          );
        }
        return <Fragment key={i}>{part}</Fragment>;
      })}
    </>
  );
}
