// FileCard.jsx
import React, { useMemo, useState } from "react";
import { Button } from "../ui/button";
import {
  IconExternalLink,
  IconDownload,
  IconTrash,
  IconFile,
  IconFileText,
  IconFileSpreadsheet,
  IconFileZip,
  IconFileCode,
  IconFileDatabase,
} from "@tabler/icons-react";
import { ConfirmationDialog } from "../dialogs/ConfirmationDialog";

function getExt(name = "") {
  const n = name.toLowerCase();
  const m = n.match(/\.([a-z0-9]+)$/i);
  return m ? m[1] : "";
}

function pickIcon(ext) {
  if (["pdf"].includes(ext))
    return { Icon: IconFileText, tint: "text-red-600 dark:text-red-400" };
  if (["xls", "xlsx", "csv"].includes(ext))
    return {
      Icon: IconFileSpreadsheet,
      tint: "text-green-600 dark:text-green-400",
    };
  if (["zip", "rar", "7z"].includes(ext))
    return { Icon: IconFileZip, tint: "text-amber-600 dark:text-amber-400" };
  if (["js", "ts", "json", "css", "html"].includes(ext))
    return { Icon: IconFileCode, tint: "text-indigo-600 dark:text-indigo-400" };
  if (["sql", "db"].includes(ext))
    return {
      Icon: IconFileDatabase,
      tint: "text-fuchsia-600 dark:text-fuchsia-400",
    };
  if (["doc", "docx", "txt", "md", "rtf"].includes(ext))
    return { Icon: IconFileText, tint: "text-blue-600 dark:text-blue-400" };
  return { Icon: IconFile, tint: "text-gray-500 dark:text-gray-400" };
}

export default function FileCard({
  name,
  url, // signed READ url
  onDelete, // callback; will be called with no args (like your current usage)
  onDownload,
  downloading,
  className = "",
}) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const displayName = useMemo(() => name.split("/").pop(), [name]);
  const ext = useMemo(() => getExt(displayName), [displayName]);
  const { Icon, tint } = pickIcon(ext);

  const handleDelete = async () => {
    setDeleting(true);
    await onDelete?.(); // keep compatible with your current usage
    setDeleting(false);
  };

  return (
    <div
      className={[
        "w-full max-w-[9rem] select-none rounded-lg border shadow-sm",
        "bg-white border-gray-200 text-gray-900",
        "dark:bg-gray-900 dark:border-gray-700 dark:text-gray-100",
        className,
      ].join(" ")}
      title={displayName}
    >
      {/* Preview box (portrait), hover group + clipping */}
      <div className="relative group overflow-hidden rounded-t-lg">
        <div className="flex items-center justify-center w-full aspect-[3/4] bg-gray-50 dark:bg-gray-800">
          <Icon className={`h-10 w-10 ${tint}`} aria-hidden="true" />
        </div>

        {/* Extension pill */}
        {ext && (
          <span className="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded-md text-[10px] font-medium bg-white/90 text-gray-700 shadow-sm dark:bg-gray-900/80 dark:text-gray-200">
            {ext.toUpperCase()}
          </span>
        )}

        {/* Hover overlay (clipped to preview) */}
        <div
          className={[
            "absolute inset-0 flex items-center justify-center gap-2",
            "opacity-0 pointer-events-none bg-black/0",
            "transition-all duration-200",
            "group-hover:opacity-100 group-hover:pointer-events-auto group-hover:bg-black/40",
          ].join(" ")}
        >
          {/* View */}
          <Button
            size="icon"
            variant="secondary"
            className="bg-white/90 border border-gray-200 hover:bg-white dark:bg-gray-900/80 dark:border-gray-700 dark:hover:bg-gray-900"
            onClick={() => window.open(url, "_blank", "noopener,noreferrer")}
            aria-label="View"
            title="View"
          >
            <IconExternalLink className="h-4 w-4" />
            <span className="sr-only">View</span>
          </Button>

          {/* Download */}

          <Button
            size="icon"
            onClick={onDownload}
            disabled={downloading}
            variant="secondary"
            className="bg-white/90 border border-gray-200 hover:bg-white dark:bg-gray-900/80 dark:border-gray-700 dark:hover:bg-gray-900"
          >
            <IconDownload className="h-4 w-4" />
            <span className="sr-only">Download</span>
          </Button>

          {/* Delete */}
          <Button
            size="icon"
            disabled={downloading || deleting}
            variant="destructive"
            onClick={() => setShowConfirm(true)}
            aria-label="Delete"
            title="Delete"
          >
            <IconTrash className="h-4 w-4" />
            <span className="sr-only">Delete</span>
          </Button>
        </div>
      </div>

      {/* Filename */}
      <div className="px-2 py-2">
        <div className="truncate text-[11px] font-medium">{displayName}</div>
      </div>

      {/* Confirmation dialog */}
      <ConfirmationDialog
        open={showConfirm}
        onOpenChange={setShowConfirm}
        title="Delete this file?"
        description={`This will permanently remove "${displayName}".`}
        confirmText={deleting ? "Deleting..." : "Delete"}
        cancelText="Cancel"
        onConfirm={handleDelete}
      />
    </div>
  );
}
