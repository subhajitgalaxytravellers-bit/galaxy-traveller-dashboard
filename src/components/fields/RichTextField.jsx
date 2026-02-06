import "react-quill/dist/quill.snow.css";
import { IconPhoto } from "@tabler/icons-react";
import ImagePickerDialog from "../images/ImagePickerDialog";
import { useEffect, useMemo, useRef, useState } from "react";
import ReactQuill from "react-quill";
import { v4 as uuid } from "uuid";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import BlogBody from "@/components/fields/BlogBody.jsx"; // <- This is the preview renderer

// NEW: converters
import TurndownService from "turndown";
import { gfm } from "turndown-plugin-gfm";
import { marked } from "marked";
import { Eye } from "lucide-react";

const CustomButton = ({ icon, onClick }) => (
  <button
    onClick={onClick}
    className="ql-custom-btn text-black dark:text-white"
  >
    {icon}
  </button>
);

const CustomToolbar = ({ onOpenImageDialog, onOpenPreview, toolbarId }) => (
  <div id={toolbarId} className="custom-quill-toolbar">
    {/* Only H2 + paragraph */}
    <select
      className="ql-header text-black dark:text-white"
      defaultValue={""}
      onChange={(e) => e.persist()}
    >
      <option
        className="ql-custom-btn text-black dark:text-white"
        value=""
      ></option>{" "}
      {/* paragraph */}
      <option className="ql-custom-btn text-black dark:text-white" value="2">
        {" "}
        Header
      </option>{" "}
      {/* H2 only */}
    </select>

    {/* Strong only */}
    <button className="ql-bold"></button>

    {/* Blockquote */}
    <button className="ql-blockquote"></button>

    {/* Lists */}
    <button className="ql-list" value="ordered"></button>
    <button className="ql-list" value="bullet"></button>

    {/* Link + Image */}
    <button className="ql-link"></button>
    <CustomButton
      icon={<IconPhoto />}
      onClick={onOpenImageDialog}
      title="Insert image"
    />

    {/* PREVIEW BUTTON */}
    <CustomButton icon={<Eye size={18} />} onClick={onOpenPreview} />
  </div>
);

// ---------- HTML ⇄ Markdown helpers ----------
function makeTurndown() {
  const td = new TurndownService({
    headingStyle: "atx", // ## Headings
    codeBlockStyle: "fenced",
    bulletListMarker: "-", // unify bullets
    emDelimiter: "_",
  });
  td.use(gfm); // tables, strikethrough, task lists

  // Normalize <h3> to ### etc. (Quill often uses <h1..h6>)
  // Turndown handles headings automatically, so no custom rule needed.

  // Better <img> -> ![alt](src)
  td.addRule("nextImageRule", {
    filter: "img",
    replacement: function (_, node) {
      let src = node.getAttribute("src") || "";
      let alt = node.getAttribute("alt") || "";

      if (!alt && src) {
        const filename = (src.split("/").pop() || "").split(".")[0];
        alt = filename.replace(/[-_]/g, " ") || "blog image";
      }

      // >>> FIX: encode spaces safely <<<
      const encoded = src.replace(/ /g, "%20");

      return src ? `![${alt}](${encoded})` : "";
    },
  });

  // Quill inserts <p><br></p> a lot; convert extra empties to single newlines
  td.addRule("trimEmptyParas", {
    filter: (node) => node.nodeName === "P" && node.innerHTML === "<br>",
    replacement: () => "\n",
  });

  return td;
}

const tdSingleton = makeTurndown();

function htmlToMarkdown(html) {
  // Quill sometimes nests/spaces oddly; turndown copes well.
  let md = tdSingleton.turndown(html || "");
  // Minor cleanups that help your TOC extractor:
  md = md
    // Ensure each <h2> becomes `##` (Turndown does it, but keep tidy spacing)
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  return md;
}

// Only for showing existing Markdown in the editor as HTML (not for saving!)
function markdownToHtml(md) {
  return marked.parse(md || "", { breaks: true });
}

// ------------------------------------------------

export default function RichTextField({
  value = "", // can be Markdown (preferred for storage)
  onChange = () => {}, // will be called with MARKDOWN
  placeholder = "Write something...",
  disabled = false,
  maxChars = 20000,
  heightClass = "h-[70vh]",
  className = "",
}) {
  // Internally we keep HTML for the editor
  const [htmlContent, setHtmlContent] = useState("");
  const [wordCount, setWordCount] = useState(0);
  const [editorLoaded, setEditorLoaded] = useState(false);
  const [showImageDialog, setShowImageDialog] = useState(false);
  const quillRef = useRef(null);
  const [showPreview, setShowPreview] = useState(false);
  const openPreview = () => setShowPreview(true);
  const toolbarId = useMemo(() => "toolbar-" + uuid(), []);

  // Decide how to initialize the editor: if parent passes Markdown (no "<"), render it to HTML
  useEffect(() => {
    setEditorLoaded(true);
  }, []);

  const lastMdEmittedRef = useRef("");

  useEffect(() => {
    // If parent echoes back exactly what we just emitted, do nothing.
    if (value === lastMdEmittedRef.current) return;

    const looksLikeHtml = /<\/?[a-z][\s\S]*>/i.test(value);
    const html = looksLikeHtml ? value : markdownToHtml(value);
    setHtmlContent(html);

    const plainText = (html || "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    setWordCount(plainText ? plainText.split(" ").length : 0);
  }, [value]);

  const handleChange = (html) => {
    setHtmlContent(html);

    const text = html
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    setWordCount(text ? text.split(" ").length : 0);

    const md = htmlToMarkdown(html);
    lastMdEmittedRef.current = md; // <— mark what we sent
    onChange(md);
  };

  useEffect(() => {
    const editor = quillRef.current?.getEditor?.();
    if (!editor) return;
    editor.clipboard.addMatcher(Node.ELEMENT_NODE, (node, delta) => {
      // Strip pasted base64 images
      delta.ops = (delta.ops || []).filter((op) => {
        if (!op.insert || !op.insert.image) return true;
        return !String(op.insert.image).startsWith("data:");
      });
      return delta;
    });
  }, [editorLoaded]);

  const openImageDialog = () => setShowImageDialog(true);

  function handleInsertImages(urlsOrSingle) {
    const editor = quillRef.current?.getEditor?.();
    if (!editor) return;
    const urls = Array.isArray(urlsOrSingle) ? urlsOrSingle : [urlsOrSingle];
    let idx = editor.getSelection()?.index ?? editor.getLength();
    for (const url of urls) {
      if (!url) continue;
      if (!/^https?:\/\//i.test(url)) continue;
      editor.insertEmbed(idx, "image", url, "user");
      idx += 1;
      editor.insertText(idx, "\n", "user"); // newline after image
      idx += 1;
    }
    editor.setSelection(idx, 0, "user");
    setShowImageDialog(false);

    // Sync outbound markdown after programmatic change
    const updatedHtml = editor.root.innerHTML;
    setHtmlContent(updatedHtml);
    onChange(htmlToMarkdown(updatedHtml));
  }

  const modules = useMemo(
    () => ({
      toolbar: "#" + toolbarId,
      clipboard: { matchVisual: true },
    }),
    [toolbarId]
  );

  const formats = [
    "header",
    "font",
    "size",
    "bold",
    "italic",
    "underline",
    "strike",
    "blockquote",
    "list",
    "bullet",
    "link",
    "image",
  ];

  if (!editorLoaded) return <div>Loading editor...</div>;

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <CustomToolbar
        onOpenImageDialog={openImageDialog}
        onOpenPreview={openPreview}
        toolbarId={toolbarId}
      />

      <ReactQuill
        ref={quillRef}
        value={htmlContent}
        onChange={handleChange}
        modules={modules}
        formats={formats}
        placeholder={placeholder}
        theme="snow"
        readOnly={disabled}
        className={`${heightClass}  custom-y-scroll  bg-white dark:bg-gray-900 text-black dark:text-white rounded-md`}
      />

      <div className="text-xs text-gray-500 dark:text-gray-400">
        {wordCount}/{maxChars} words
      </div>

      <ImagePickerDialog
        open={showImageDialog}
        onConfirm={(vals) => handleInsertImages(vals)}
        onOpenChange={setShowImageDialog}
        initialPath=""
      />

      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-[63rem]   custom-y-scroll max-h-[90vh] border-gray-600 overflow-y-auto p-6">
          <DialogHeader>
            <DialogTitle>Preview</DialogTitle>
          </DialogHeader>

          <div className="border-t border-gray-600 custom-y-scrollbar pt-4">
            {/* Feed Markdown directly to your BlogBody renderer */}
            <BlogBody body={lastMdEmittedRef.current || value} />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
