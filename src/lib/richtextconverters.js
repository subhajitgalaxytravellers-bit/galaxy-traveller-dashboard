// utils/htmlToMarkdown.js
import TurndownService from "turndown";
import { gfm } from "turndown-plugin-gfm";

/**
 * Convert Quill HTML output to GFM markdown compatible with your BlogBody.
 * - Preserves h1–h6, lists, links, images, blockquotes.
 * - Adds alt text fallback for images (filename -> alt).
 * - Converts <strong>/<em>/<u>/<s> to **, *, underline (via HTML kept), ~~.
 * - Keeps code fences if user pasted code blocks.
 */
export function quillHtmlToMarkdown(html = "") {
  // 1) Pre-clean: remove base64 images Quill may produce (you already filter in editor, this is extra safety)
  const cleanedHtml = html.replace(
    /<img[^>]+src=["']data:[^"']+["'][^>]*>/gi,
    ""
  );

  // 2) Turndown with GFM
  const td = new TurndownService({
    headingStyle: "atx", // # ## ###
    bulletListMarker: "-", // - list
    codeBlockStyle: "fenced", // ```code```
    emDelimiter: "*", // *italic*
    strongDelimiter: "**", // **bold**
    br: "  ", // line break -> markdown break
  });

  td.use(gfm);

  // 3) Custom rules

  // Keep underline by leaving <u> in place (ReactMarkdown will ignore; your CSS could style it).
  td.addRule("underline", {
    filter: ["u"],
    replacement: (content) => `<u>${content}</u>`,
  });

  // Keep strikethrough as ~~text~~ (already handled by GFM, but ensure <s> also maps)
  td.addRule("strike", {
    filter: ["s", "strike", "del"],
    replacement: (content) => `~~${content}~~`,
  });

  // Ensure blockquotes keep a blank line before (helps some MD renderers)
  td.addRule("blockquoteSpacing", {
    filter: "blockquote",
    replacement: (content) => `\n\n> ${content.replace(/\n/g, "\n> ")}\n\n`,
  });

  // Images: add alt fallback from filename if missing, keep absolute http(s) only
  td.addRule("imagesWithAltFallback", {
    filter: "img",
    replacement: (content, node) => {
      const src = node.getAttribute("src") || "";
      if (!/^https?:\/\//i.test(src)) return ""; // skip non-http(s)
      let alt = node.getAttribute("alt") || "";
      if (!alt) {
        try {
          const fname = src.split("/").pop()?.split(".")[0] || "blog image";
          alt = fname.replace(/[-_]/g, " ");
        } catch {
          alt = "blog image";
        }
      }
      return `![${alt}](${src})`;
    },
  });

  // Normalize headings pasted by users to avoid weird nesting
  // (optional) Example: cap at h2/h3 only
  // td.addRule("normalizeHeadings", {
  //   filter: (node) => /^H[1-6]$/.test(node.nodeName),
  //   replacement: (content, node) => {
  //     const level = Math.min(parseInt(node.nodeName[1], 10), 3); // max h3
  //     return `\n\n${"#".repeat(level)} ${content}\n\n`;
  //   },
  // });

  // 4) Convert
  let md = td.turndown(cleanedHtml);

  // 5) Post-clean: remove multiple blank lines, trim
  md = md
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]+\n/g, "\n")
    .trim();

  return md;
}
