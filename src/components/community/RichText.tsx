"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { renderTiptapToHtml } from "@/lib/tiptap-renderer";
import { MemberAvatarHoverCard } from "@/components/community/MemberAvatarHoverCard";
import { MemberProfileDialog } from "@/components/community/MemberProfileDialog";

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

type TiptapMark = { type: string; attrs?: Record<string, string> };
type TiptapNode = {
  type: string;
  text?: string;
  content?: TiptapNode[];
  attrs?: Record<string, unknown>;
  marks?: TiptapMark[];
  circle_ios_fallback_text?: string;
};
type TiptapBody = {
  body?: TiptapNode;
  sgids_to_object_map?: Record<string, Record<string, unknown>>;
};

function renderMarksReact(text: string, marks?: TiptapMark[]) {
  const base: React.ReactNode = text;
  if (!marks || marks.length === 0) return base;

  return marks.reduce<React.ReactNode>((acc, mark) => {
    switch (mark.type) {
      case "bold":
        return <strong>{acc}</strong>;
      case "italic":
        return <em>{acc}</em>;
      case "strike":
        return <s>{acc}</s>;
      case "underline":
        return <u>{acc}</u>;
      case "code":
        return <code>{acc}</code>;
      case "highlight":
        return <mark>{acc}</mark>;
      case "link": {
        const href = mark.attrs?.href || undefined;
        const target = mark.attrs?.target || undefined;
        const rel = target === "_blank" ? "noopener noreferrer" : undefined;
        return (
          <a href={href} target={target} rel={rel}>
            {acc}
          </a>
        );
      }
      default:
        return acc;
    }
  }, base);
}

function asNumber(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim() && !Number.isNaN(Number(v))) return Number(v);
  return null;
}

function renderNodeReact(
  node: TiptapNode,
  sgidsMap: Record<string, Record<string, unknown>> | undefined,
  opts: {
    onOpenProfile: (memberId: number, name?: string, avatarUrl?: string | null) => void;
  },
  key: string,
): React.ReactNode {
  switch (node.type) {
    case "doc":
      return (node.content || []).map((c, idx) =>
        renderNodeReact(c, sgidsMap, opts, `${key}-d${idx}`),
      );

    case "paragraph":
      return (
        <p key={key}>
          {(node.content || []).map((c, idx) =>
            renderNodeReact(c, sgidsMap, opts, `${key}-p${idx}`),
          )}
        </p>
      );

    case "heading": {
      const level = (node.attrs?.level as number) || 2;
      const inner = (node.content || []).map((c, idx) =>
        renderNodeReact(c, sgidsMap, opts, `${key}-h${idx}`),
      );
      if (level <= 1) return <h1 key={key}>{inner}</h1>;
      if (level === 2) return <h2 key={key}>{inner}</h2>;
      if (level === 3) return <h3 key={key}>{inner}</h3>;
      if (level === 4) return <h4 key={key}>{inner}</h4>;
      if (level === 5) return <h5 key={key}>{inner}</h5>;
      return <h6 key={key}>{inner}</h6>;
    }

    case "text": {
      const content = renderMarksReact(node.text || "", node.marks);
      return <span key={key}>{content}</span>;
    }

    case "bulletList":
      return (
        <ul key={key}>
          {(node.content || []).map((c, idx) =>
            renderNodeReact(c, sgidsMap, opts, `${key}-ul${idx}`),
          )}
        </ul>
      );

    case "orderedList":
      return (
        <ol key={key} start={asNumber(node.attrs?.start) || 1}>
          {(node.content || []).map((c, idx) =>
            renderNodeReact(c, sgidsMap, opts, `${key}-ol${idx}`),
          )}
        </ol>
      );

    case "listItem":
      return (
        <li key={key}>
          {(node.content || []).map((c, idx) =>
            renderNodeReact(c, sgidsMap, opts, `${key}-li${idx}`),
          )}
        </li>
      );

    case "blockquote":
      return (
        <blockquote key={key}>
          {(node.content || []).map((c, idx) =>
            renderNodeReact(c, sgidsMap, opts, `${key}-bq${idx}`),
          )}
        </blockquote>
      );

    case "codeBlock": {
      const code = (node.content || []).map((c) => c.text || "").join("\n");
      const lang = (node.attrs?.language as string) || undefined;
      return (
        <pre key={key}>
          <code className={lang ? `language-${lang}` : undefined}>{code}</code>
        </pre>
      );
    }

    case "hardBreak":
      return <br key={key} />;

    case "horizontalRule":
      return <hr key={key} />;

    case "image": {
      const url = node.attrs?.url as string;
      if (!url) return null;
      return <img key={key} src={url} alt="" />;
    }

    case "mention": {
      const sgid = node.attrs?.sgid as string | undefined;
      const fallback = node.circle_ios_fallback_text || "";
      const obj = sgid && sgidsMap ? sgidsMap[sgid] : undefined;
      const name = (obj?.name as string) || fallback.replace(/^@/, "") || "Member";
      const memberId =
        asNumber(obj?.community_member_id) ?? asNumber(obj?.id) ?? asNumber(obj?.communityMemberId);
      const avatarUrl = (obj?.avatar_url as string) || null;

      if (!memberId) {
        return (
          <span key={key} className="mention">
            @{name}
          </span>
        );
      }

      return (
        <MemberAvatarHoverCard
          key={key}
          memberId={memberId}
          memberName={name}
          avatarUrl={avatarUrl}
        >
          <button
            type="button"
            className="mention inline-flex items-center rounded px-1 py-0.5 hover:bg-muted/70"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              opts.onOpenProfile(memberId, name, avatarUrl);
            }}
          >
            @{name}
          </button>
        </MemberAvatarHoverCard>
      );
    }

    // For embed/file/entity/poll/etc, fall back to HTML renderer output for now.
    default: {
      if (node.content) {
        return (node.content || []).map((c, idx) =>
          renderNodeReact(c, sgidsMap, opts, `${key}-x${idx}`),
        );
      }
      if (node.text) return <span key={key}>{node.text}</span>;
      return null;
    }
  }
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
  enableMentions = true,
}: {
  tiptap?: unknown;
  html?: string | null;
  text?: string | null;
  className?: string;
  enableMentions?: boolean;
}) {
  const [profileOpen, setProfileOpen] = useState(false);
  const [profileMemberId, setProfileMemberId] = useState<number | null>(null);
  const [profileInitialName, setProfileInitialName] = useState<string | undefined>(undefined);
  const [profileInitialAvatar, setProfileInitialAvatar] = useState<string | null>(null);

  const normalized = useMemo(() => normalizeTiptapBody(tiptap), [tiptap]);
  const reactTree = useMemo(() => {
    if (!enableMentions || !normalized || typeof normalized !== "object") return null;
    const tb = normalized as TiptapBody;
    const doc = tb.body;
    if (!doc || typeof doc !== "object" || !doc.type) return null;
    return renderNodeReact(
      doc,
      tb.sgids_to_object_map,
      {
        onOpenProfile: (memberId, name, avatarUrl) => {
          setProfileMemberId(memberId);
          setProfileInitialName(name);
          setProfileInitialAvatar(avatarUrl ?? null);
          setProfileOpen(true);
        },
      },
      "rt",
    );
  }, [enableMentions, normalized]);

  const content = useMemo(() => {
    if (reactTree) return null;
    return toHtml({ tiptap: normalized, html, text });
  }, [reactTree, normalized, html, text]);

  if (!reactTree && !content) return null;

  return (
    <>
      {profileMemberId != null && (
        <MemberProfileDialog
          open={profileOpen}
          onOpenChange={setProfileOpen}
          memberId={profileMemberId}
          initialName={profileInitialName}
          initialAvatarUrl={profileInitialAvatar}
        />
      )}
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
          // TipTap mentions styling
          "[&_.mention]:font-semibold [&_.mention]:text-primary",
          "[&_.embed-wrapper]:my-2 [&_.embed-wrapper]:overflow-hidden [&_.embed-wrapper]:rounded-lg [&_.embed-wrapper]:border",
          className,
        )}
        {...(reactTree
          ? {}
          : { dangerouslySetInnerHTML: { __html: content as string } })}
      >
        {reactTree}
      </div>
    </>
  );
}

