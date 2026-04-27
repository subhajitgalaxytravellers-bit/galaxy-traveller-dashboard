import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import { useEffect, useMemo, useRef, useState } from "react";
import { marked } from "marked";
import TurndownService from "turndown";
import { gfm } from "turndown-plugin-gfm";
import {
  Bold,
  Heading2,
  List,
  ListOrdered,
  Quote,
  Link2,
  ImageIcon,
  Eye,
} from "lucide-react";
import { IconPhoto } from "@tabler/icons-react";
import ImagePickerDialog from "../images/ImagePickerDialog";
import BlogBody from "@/components/fields/BlogBody.jsx";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// ---------- HTML ⇄ Markdown helpers ----------
function makeTurndown() {
  const td = new TurndownService({
    headingStyle: "atx",
    codeBlockStyle: "fenced",
    bulletListMarker: "-",
    emDelimiter: "_",
  });
  td.use(gfm);

  td.addRule("nextImageRule", {
    filter: "img",
    replacement: function (_, node) {
      let src = node.getAttribute("src") || "";
      let alt = node.getAttribute("alt") || "";
      if (!alt && src) {
        const filename = (src.split("/").pop() || "").split(".")[0];
        alt = filename.replace(/[-_]/g, " ") || "blog image";
      }
      const encoded = src.replace(/ /g, "%20");
      return src ? `![${alt}](${encoded})` : "";
    },
  });

  td.addRule("trimEmptyParas", {
    filter: (node) => node.nodeName === "P" && node.innerHTML === "<br>",
    replacement: () => "\n",
  });

  return td;
}

const tdSingleton = makeTurndown();

function htmlToMarkdown(html) {
  let md = tdSingleton.turndown(html || "");
  md = md.replace(/\n{3,}/g, "\n\n").trim();
  return md;
}

function markdownToHtml(md) {
  return marked.parse(md || "", { breaks: true });
}

// ---------- Toolbar ----------
function ToolbarButton({ onClick, active, title, children }) {
  return (
    <button
      type="button"
      onMouseDown={(e) => {
        e.preventDefault();
        onClick();
      }}
      title={title}
      className={`p-1.5 rounded text-sm transition-colors ${
        active
          ? "bg-gray-300 dark:bg-gray-600 text-black dark:text-white"
          : "text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
      }`}
    >
      {children}
    </button>
  );
}

// ------------------------------------------------

export default function RichTextField({
  value = "",
  onChange = () => {},
  placeholder = "Write something...",
  disabled = false,
  maxChars = 20000,
  heightClass = "h-[70vh]",
  className = "",
}) {
  const [showImageDialog, setShowImageDialog] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const lastMdEmittedRef = useRef("");

  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { rel: "noopener noreferrer" },
      }),
      Image.configure({ inline: false }),
      Placeholder.configure({ placeholder }),
    ],
    content: "",
    editable: !disabled,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      const md = htmlToMarkdown(html);
      lastMdEmittedRef.current = md;
      onChange(md);
    },
  });

  // Sync incoming value → editor (only when parent changes it externally)
  useEffect(() => {
    if (!editor) return;
    if (value === lastMdEmittedRef.current) return;
    const looksLikeHtml = /<\/?[a-z][\s\S]*>/i.test(value);
    const html = looksLikeHtml ? value : markdownToHtml(value);
    editor.commands.setContent(html, false);
  }, [value, editor]);

  function handleSetLink() {
    const url = window.prompt("Enter URL:");
    if (!url) return;
    editor.chain().focus().setLink({ href: url }).run();
  }

  function handleInsertImages(urlsOrSingle) {
    if (!editor) return;
    const urls = Array.isArray(urlsOrSingle) ? urlsOrSingle : [urlsOrSingle];
    for (const url of urls) {
      if (!url || !/^https?:\/\//i.test(url)) continue;
      editor.chain().focus().setImage({ src: url }).run();
    }
    setShowImageDialog(false);
    // Sync markdown after programmatic change
    const html = editor.getHTML();
    const md = htmlToMarkdown(html);
    lastMdEmittedRef.current = md;
    onChange(md);
  }

  const wordCount = useMemo(() => {
    if (!editor) return 0;
    const text = editor.getText().replace(/\s+/g, " ").trim();
    return text ? text.split(" ").length : 0;
  }, [editor?.state]);

  if (!editor) return <div>Loading editor...</div>;

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {/* Toolbar */}
      <div className="flex flex-wrap gap-1 p-2 border border-gray-300 dark:border-gray-600 rounded-t-md bg-gray-50 dark:bg-gray-800">
        <ToolbarButton
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 2 }).run()
          }
          active={editor.isActive("heading", { level: 2 })}
          title="Heading 2"
        >
          <Heading2 size={16} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          active={editor.isActive("bold")}
          title="Bold"
        >
          <Bold size={16} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          active={editor.isActive("blockquote")}
          title="Blockquote"
        >
          <Quote size={16} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          active={editor.isActive("orderedList")}
          title="Ordered List"
        >
          <ListOrdered size={16} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          active={editor.isActive("bulletList")}
          title="Bullet List"
        >
          <List size={16} />
        </ToolbarButton>
        <ToolbarButton
          onClick={handleSetLink}
          active={editor.isActive("link")}
          title="Link"
        >
          <Link2 size={16} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => setShowImageDialog(true)}
          active={false}
          title="Insert Image"
        >
          <IconPhoto size={18} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => setShowPreview(true)}
          active={false}
          title="Preview"
        >
          <Eye size={16} />
        </ToolbarButton>
      </div>

      {/* Editor area */}
      <EditorContent
        editor={editor}
        className={`${heightClass} overflow-y-auto custom-y-scroll bg-white dark:bg-gray-900 text-black dark:text-white border border-t-0 border-gray-300 dark:border-gray-600 rounded-b-md`}
        style={{ padding: "0.75rem" }}
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
        <DialogContent className="max-w-[63rem] custom-y-scroll max-h-[90vh] border-gray-600 overflow-y-auto p-6">
          <DialogHeader>
            <DialogTitle>Preview</DialogTitle>
          </DialogHeader>
          <div className="border-t border-gray-600 custom-y-scrollbar pt-4">
            <BlogBody body={lastMdEmittedRef.current || value} />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
