"use client";

import { cn } from "@/lib/utils";
import { renderTiptapToHtml } from "@/lib/tiptap-renderer";

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function normalizeTiptapBody(input: unknown): unknown {
  if (!input || typeof input !== "object") return input;
  // Circle often returns wrapper: { body: { type:'doc', ... }, ... }
  if ("body" in (input as Record<string, unknown>)) return input;
  // Sometimes raw doc node: { type:'doc', ... }
  if ("type" in (input as Record<string, unknown>)) return { body: input };
  return input;
}

function toHtml({
  tiptap,
  html,
  text,
}: {
  tiptap?: unknown;
  html?: string | null;
  text?: string | null;
}): string {
  if (tiptap) {
    const rendered = renderTiptapToHtml(normalizeTiptapBody(tiptap));
    if (rendered) return rendered;
  }

  if (html && typeof html === "string" && html.trim()) return html;

  if (text && typeof text === "string" && text.trim()) {
    // Treat as plain text; preserve line breaks.
    const escaped = escapeHtml(text).replace(/\n/g, "<br />");
    return `<p>${escaped}</p>`;
  }

  return "";
}

export function RichText({
  tiptap,
  html,
  text,
  className,
}: {
  tiptap?: unknown;
  html?: string | null;
  text?: string | null;
  className?: string;
}) {
  const content = toHtml({ tiptap, html, text });
  if (!content) return null;

  return (
    <div
      className={cn(
        // Consistent Circle-like rendering across community chat/DM
        "prose prose-sm max-w-none text-foreground",
        "prose-p:my-1 prose-li:my-0.5 prose-ul:my-2 prose-ol:my-2",
        "prose-a:text-blue-600 prose-a:underline hover:prose-a:text-blue-700",
        "prose-blockquote:border-l-2 prose-blockquote:pl-3 prose-blockquote:text-muted-foreground",
        "prose-code:rounded prose-code:bg-muted prose-code:px-1 prose-code:py-0.5 prose-code:text-[12px]",
        "prose-pre:rounded-lg prose-pre:bg-muted prose-pre:p-3 prose-pre:text-xs",
        "prose-img:my-2 prose-img:max-w-full prose-img:rounded-lg",
        "prose-hr:my-4",
        // TipTap mentions + embeds from our renderer
        "[&_span.mention]:font-semibold [&_span.mention]:text-primary",
        "[&_.embed-wrapper]:my-2 [&_.embed-wrapper]:overflow-hidden [&_.embed-wrapper]:rounded-lg [&_.embed-wrapper]:border",
        className,
      )}
      dangerouslySetInnerHTML={{ __html: content }}
    />
  );
}

