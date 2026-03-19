interface TiptapMark {
  type: string;
  attrs?: Record<string, string>;
}

interface TiptapNode {
  type: string;
  text?: string;
  content?: TiptapNode[];
  attrs?: Record<string, unknown>;
  marks?: TiptapMark[];
  circle_ios_fallback_text?: string;
}

interface TiptapBody {
  body?: TiptapNode;
  circle_ios_fallback_text?: string;
  sgids_to_object_map?: Record<string, Record<string, unknown>>;
  inline_attachments?: Array<Record<string, unknown>>;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function renderMarks(text: string, marks?: TiptapMark[]): string {
  if (!marks || marks.length === 0) return escapeHtml(text);

  let result = escapeHtml(text);
  for (const mark of marks) {
    switch (mark.type) {
      case "bold":
        result = `<strong>${result}</strong>`;
        break;
      case "italic":
        result = `<em>${result}</em>`;
        break;
      case "strike":
        result = `<s>${result}</s>`;
        break;
      case "underline":
        result = `<u>${result}</u>`;
        break;
      case "code":
        result = `<code>${result}</code>`;
        break;
      case "highlight":
        result = `<mark>${result}</mark>`;
        break;
      case "link": {
        const href = mark.attrs?.href ? ` href="${escapeHtml(mark.attrs.href)}"` : "";
        const target = mark.attrs?.target ? ` target="${escapeHtml(mark.attrs.target)}"` : "";
        const rel = mark.attrs?.target === "_blank" ? ' rel="noopener noreferrer"' : "";
        result = `<a${href}${target}${rel}>${result}</a>`;
        break;
      }
    }
  }
  return result;
}

function renderNode(
  node: TiptapNode,
  sgidsMap?: Record<string, Record<string, unknown>>,
): string {
  switch (node.type) {
    case "doc":
      return (node.content || []).map((c) => renderNode(c, sgidsMap)).join("");

    case "paragraph": {
      const inner = (node.content || []).map((c) => renderNode(c, sgidsMap)).join("");
      return `<p>${inner || ""}</p>`;
    }

    case "heading": {
      const level = (node.attrs?.level as number) || 2;
      const tag = `h${Math.min(Math.max(level, 1), 6)}`;
      return `<${tag}>${(node.content || []).map((c) => renderNode(c, sgidsMap)).join("")}</${tag}>`;
    }

    case "text":
      return renderMarks(node.text || "", node.marks);

    case "bulletList":
      return `<ul>${(node.content || []).map((c) => renderNode(c, sgidsMap)).join("")}</ul>`;

    case "orderedList": {
      const start = (node.attrs?.start as number) || 1;
      const startAttr = start !== 1 ? ` start="${start}"` : "";
      return `<ol${startAttr}>${(node.content || []).map((c) => renderNode(c, sgidsMap)).join("")}</ol>`;
    }

    case "listItem":
      return `<li>${(node.content || []).map((c) => renderNode(c, sgidsMap)).join("")}</li>`;

    case "blockquote":
      return `<blockquote>${(node.content || []).map((c) => renderNode(c, sgidsMap)).join("")}</blockquote>`;

    case "codeBlock": {
      const lang = node.attrs?.language as string;
      const cls = lang ? ` class="language-${escapeHtml(lang)}"` : "";
      const code = (node.content || []).map((c) => escapeHtml(c.text || "")).join("\n");
      return `<pre><code${cls}>${code}</code></pre>`;
    }

    case "hardBreak":
      return "<br>";

    case "horizontalRule":
      return "<hr>";

    case "image": {
      const url = node.attrs?.url as string;
      if (!url) return "";
      const width = node.attrs?.width as string;
      const alignment = node.attrs?.alignment as string;
      let style = "";
      if (width) style += `width:${width};`;
      if (alignment === "center") style += "display:block;margin-left:auto;margin-right:auto;";
      else if (alignment === "right") style += "display:block;margin-left:auto;";
      const styleAttr = style ? ` style="${style}"` : "";
      return `<img src="${escapeHtml(url)}"${styleAttr} />`;
    }

    case "mention": {
      const sgid = node.attrs?.sgid as string;
      const fallback = node.circle_ios_fallback_text || "";
      if (sgid && sgidsMap?.[sgid]) {
        const obj = sgidsMap[sgid];
        const name = (obj.name as string) || fallback;
        return `<span class="mention">@${escapeHtml(name)}</span>`;
      }
      return fallback ? `<span class="mention">${escapeHtml(fallback)}</span>` : "";
    }

    case "embed": {
      const sgid = node.attrs?.sgid as string;
      if (sgid && sgidsMap?.[sgid]) {
        const obj = sgidsMap[sgid];
        const embedUrl = (obj.url as string) || (obj.embed_url as string);
        if (embedUrl) {
          return `<div class="embed-wrapper"><iframe src="${escapeHtml(embedUrl)}" frameborder="0" allowfullscreen style="width:100%;aspect-ratio:16/9;"></iframe></div>`;
        }
        const html = obj.embed_html as string;
        if (html) return `<div class="embed-wrapper">${html}</div>`;
      }
      return "";
    }

    case "file": {
      const sgid = node.attrs?.sgid as string;
      if (sgid && sgidsMap?.[sgid]) {
        const obj = sgidsMap[sgid];
        const fileUrl = obj.url as string;
        const filename = (obj.filename as string) || "Download file";
        if (fileUrl) {
          return `<p><a href="${escapeHtml(fileUrl)}" target="_blank" rel="noopener noreferrer">${escapeHtml(filename)}</a></p>`;
        }
      }
      return "";
    }

    case "entity": {
      const sgid = node.attrs?.sgid as string;
      if (sgid && sgidsMap?.[sgid]) {
        const obj = sgidsMap[sgid];
        const name = (obj.name as string) || (obj.title as string) || "";
        const url = obj.url as string;
        if (url && name) {
          return `<a href="${escapeHtml(url)}">${escapeHtml(name)}</a>`;
        }
        if (name) return escapeHtml(name);
      }
      return "";
    }

    case "poll":
      return `<p><em>[Poll]</em></p>`;

    default:
      if (node.content) {
        return (node.content || []).map((c) => renderNode(c, sgidsMap)).join("");
      }
      return node.text ? escapeHtml(node.text) : "";
  }
}

export function renderTiptapToHtml(tiptapBody: unknown): string {
  if (!tiptapBody || typeof tiptapBody !== "object") return "";

  const tb = tiptapBody as TiptapBody;
  const doc = tb.body;
  if (!doc || typeof doc !== "object" || !doc.type) return "";

  return renderNode(doc, tb.sgids_to_object_map);
}

export function getTiptapPlainText(tiptapBody: unknown): string {
  if (!tiptapBody || typeof tiptapBody !== "object") return "";

  const tb = tiptapBody as TiptapBody;
  if (tb.circle_ios_fallback_text) return tb.circle_ios_fallback_text;

  const doc = tb.body;
  if (!doc || typeof doc !== "object") return "";

  function extractText(node: TiptapNode): string {
    if (node.type === "text") return node.text || "";
    if (node.type === "hardBreak") return "\n";
    if (node.type === "mention") return node.circle_ios_fallback_text || "";
    const children = (node.content || []).map(extractText).join("");
    if (["paragraph", "heading", "listItem", "blockquote"].includes(node.type)) {
      return children + "\n";
    }
    return children;
  }

  return extractText(doc).trim();
}

/**
 * Determines the best HTML to display for a post/comment body.
 * Priority: tiptap_body (rendered) > custom_html > body.html (if not fallback) > body_plain_text
 */
export function resolveBodyHtml(data: {
  tiptap_body?: unknown;
  custom_html?: string | null;
  body?: unknown;
  body_plain_text?: string;
  body_text?: string;
}): { html: string; plainText: string } {
  const tiptapHtml = renderTiptapToHtml(data.tiptap_body);
  if (tiptapHtml) {
    return {
      html: tiptapHtml,
      plainText: getTiptapPlainText(data.tiptap_body) || stripHtml(tiptapHtml),
    };
  }

  if (data.custom_html) {
    return { html: data.custom_html, plainText: stripHtml(data.custom_html) };
  }

  const bodyHtml = extractBodyHtml(data.body);
  if (bodyHtml && !isFallbackBody(bodyHtml)) {
    return { html: bodyHtml, plainText: stripHtml(bodyHtml) };
  }

  const plainText = data.body_plain_text || data.body_text || "";
  if (plainText) {
    return { html: "", plainText };
  }

  return { html: "", plainText: "" };
}

function extractBodyHtml(body: unknown): string {
  if (typeof body === "string") return body;
  if (body && typeof body === "object" && "html" in body) {
    const html = (body as { html?: unknown }).html;
    if (typeof html === "string") return html;
  }
  return "";
}

function isFallbackBody(html: string): boolean {
  const lower = html.toLowerCase();
  return (
    lower.includes("update available") ||
    lower.includes("please update the app to view") ||
    lower.includes("update the app")
  );
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").trim();
}
