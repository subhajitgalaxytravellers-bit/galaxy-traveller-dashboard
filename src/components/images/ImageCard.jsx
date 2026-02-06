import React, { useMemo, useState } from "react";
import { Button } from "../ui/button";
import { IconDownload, IconTrash, IconExternalLink } from "@tabler/icons-react";
import { ConfirmationDialog } from "../dialogs/ConfirmationDialog";
import PermButton from "../guard/PermButton";

export default function ImageCard({
  imageUrl,
  name,
  onDelete,
  onOpen,
  onDownload,
  downloading,
  className = "",
}) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);



  const fileName = useMemo(
    () => name || imageUrl.split("?")[0].split("/").pop(),
    [name, imageUrl]
  );

  const handleDelete = async () => {
    setDeleting(true);
    await onDelete(imageUrl);
    setDeleting(false);
  };

  return (
    <div
      className={[
        "w-full max-w-[9rem] select-none rounded-lg border shadow-sm",
        // theme surfaces
        "bg-white border-gray-200 text-gray-900",
        "dark:bg-gray-900 dark:border-gray-700 dark:text-gray-100",
        className,
      ].join(" ")}
      title={fileName}
    >
      {/* Image wrapper is the hover group & clip area */}
      <div className="relative group overflow-hidden rounded-t-lg">
        <img
          src={imageUrl}
          alt={fileName}
          loading="lazy"
          className="block w-full aspect-[4/3] object-contain bg-gray-50 dark:bg-gray-800"
        />
        {/* Hover overlay (desktop only) */}
        <div
          className={[
            "absolute inset-0 hidden sm:flex items-center justify-center gap-2",
            "opacity-0 pointer-events-none bg-black/0",
            "transition-all duration-200",
            "group-hover:opacity-100 group-hover:pointer-events-auto group-hover:bg-black/40",
          ].join(" ")}
        >
          <Button
            size="icon"
            variant="secondary"
            onClick={() =>
              onOpen
                ? onOpen(imageUrl)
                : window.open(imageUrl, "_blank", "noopener,noreferrer")
            }
            aria-label="View"
            title="View"
          >
            <IconExternalLink className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="secondary"
            onClick={onDownload}
            disabled={downloading}
            aria-label="Download"
            title="Download"
          >
            <IconDownload className="h-4 w-4" />
          </Button>
          <PermButton
            type="button"
            model={"images"}
            action="delete"
            size="icon"
            variant="destructive"
            onClick={() => setShowConfirm(true)}
            aria-label="Delete"
            title="Delete"
          >
            <IconTrash className="h-4 w-4 text-white" />
          </PermButton>
        </div>
      </div>

      {/* Mobile action row (always visible on touch) */}
      <div className="sm:hidden flex items-center justify-center gap-2 p-2">
        <Button
          size="icon"
          variant="secondary"
          onClick={() =>
            onOpen
              ? onOpen(imageUrl)
              : window.open(imageUrl, "_blank", "noopener,noreferrer")
          }
          aria-label="View"
          title="View"
        >
          <IconExternalLink className="h-4 w-4" />
        </Button>
        <Button
          size="icon"
          variant="secondary"
          onClick={onDownload}
          disabled={downloading}
          aria-label="Download"
          title="Download"
        >
          <IconDownload className="h-4 w-4" />
        </Button>
        <Button
          size="icon"
          variant="destructive"
          onClick={() => setShowConfirm(true)}
          aria-label="Delete"
          title="Delete"
        >
          <IconTrash className="h-4 w-4  text-white" />
        </Button>
      </div>

      {/* Filename */}
      <div className="px-2 py-2">
        <div className="truncate text-[11px] font-medium  ">{fileName}</div>
      </div>

      {/* Confirm delete */}
      <ConfirmationDialog
        open={showConfirm}
        onOpenChange={setShowConfirm}
        title="Delete this image?"
        description={`This will permanently remove "${fileName}".`}
        confirmText={deleting ? "Deleting..." : "Delete"}
        cancelText="Cancel"
        onConfirm={handleDelete}
      />
    </div>
  );
}
