import * as React from "react";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "../ui/dialog";
import { IconPlus, IconX, IconUpload } from "@tabler/icons-react";
import AddHereUploader from "../dialogs/AddHereDialog";
import { toast } from "react-toastify";

/**
 * ImageInputSingle
 * Props:
 * - value: string                        // current image URL (single)
 * - onChange: (next: string | null) => void
 * - uploadFn: (file: File) => Promise<string>   // resolves to single URL
 * - accept?: string                      // default "image/*"
 * - title?: string                       // dialog title
 * - tileSize?: string                    // Tailwind tile size, default "w-24 h-24"
 * - disabled?: boolean
 * - onUploadStart?: () => void
 * - onUploadEnd?: (ok: boolean) => void
 */
export default function ImageInputSingle({
  value = "",
  onChange,
  uploadFn,
  accept = "image/*",
  title = "Choose image",
  tileSize = "w-24 h-24",
  disabled = false,
  onUploadStart,
  onUploadEnd,
  multiple,
}) {
  const [open, setOpen] = React.useState(false);
  const [file, setFile] = React.useState(null); // { file, preview }
  const [uploading, setUploading] = React.useState(false);
  const inputRef = React.useRef(null);

  // revoke blob URL on cleanup / when file changes
  React.useEffect(() => {
    return () => {
      if (file?.preview) URL.revokeObjectURL(file.preview);
    };
  }, [file]);

  const openPicker = () => {
    if (inputRef.current) inputRef.current.click();
  };

  const handlePick = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    // cleanup old preview if any
    if (file?.preview) URL.revokeObjectURL(file.preview);
    setFile({ file: f, preview: URL.createObjectURL(f) });
    e.target.value = ""; // reset input
  };

  const clearPending = () => {
    if (file?.preview) URL.revokeObjectURL(file.preview);
    setFile(null);
  };

  const removeImage = () => {
    onChange?.("");
  };

  const importNow = async () => {
    if (!uploadFn || !file) return;
    try {
      setUploading(true);
      onUploadStart?.();

      const url = await uploadFn(file.file); // must return a string
      if (typeof url === "string" && url.trim()) {
        onChange?.(url.trim());
        // reset
        clearPending();
        setOpen(false);
        onUploadEnd?.(true);
      } else {
        console.error("uploadFn did not return a string URL");
        toast.error("Failed to upload image.");
        onUploadEnd?.(false);
      }
    } catch (err) {
      console.error("ImageInputSingle upload error:", err);
      toast.error("Failed to upload image.");
      onUploadEnd?.(false);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-1 gap-3">
        {/* Tile: either image or choose button */}
        {value ? (
          <figure
            className={`relative overflow-hidden rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 ${tileSize}`}
          >
            <img
              src={value}
              alt="selected"
              className="h-full w-full object-cover"
              loading="lazy"
            />
            <button
              type="button"
              onClick={removeImage}
              className="absolute right-1 top-1 inline-flex items-center justify-center rounded-md bg-black/60 text-white p-1 hover:bg-black/70"
              aria-label="Remove image"
            >
              <IconX className="h-4 w-4" />
            </button>
          </figure>
        ) : multiple ? (
          <AddHereUploader
            accept={accept}
            title={title}
            tileSize={tileSize}
            disabled={disabled}
            onUploadStart={onUploadStart}
            onUploadEnd={onUploadEnd}
          />
        ) : (
          <Dialog
            open={open}
            onOpenChange={(o) => {
              // when closing, clear pending preview
              if (!o && file) clearPending();
              setOpen(o);
            }}
          >
            <DialogTrigger asChild>
              <button
                type="button"
                disabled={disabled}
                className={[
                  "rounded-lg border border-dashed border-gray-300 dark:border-gray-700",
                  "hover:border-gray-400 dark:hover:border-gray-500",
                  "bg-white/60 dark:bg-gray-900/60",
                  "grid place-items-center text-sm text-gray-600 dark:text-gray-300",
                  tileSize,
                  disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer",
                ].join(" ")}
                aria-label="Choose file"
                title="Choose file"
              >
                <div className="flex flex-col items-center gap-1">
                  <IconPlus className="h-5 w-5" />
                  <span>Choose file</span>
                </div>
              </button>
            </DialogTrigger>

            <DialogContent className="sm:max-w-[520px]">
              <DialogHeader>
                <DialogTitle>{title}</DialogTitle>
              </DialogHeader>

              <input
                ref={inputRef}
                type="file"
                accept={accept}
                className="hidden"
                onChange={handlePick}
              />

              {/* Picker + Preview Area */}
              <div className="rounded-lg border border-gray-200 dark:border-gray-800 p-4 space-y-3">
                {!file ? (
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-sm text-gray-600 dark:text-gray-300">
                      Click the button to select an image.
                    </div>
                    <Button
                      type="button"
                      onClick={openPicker}
                      className="gap-2"
                    >
                      <IconUpload className="h-4 w-4" />
                      Upload file
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="text-sm text-gray-600 dark:text-gray-300">
                      Preview
                    </div>
                    <figure className="relative overflow-hidden rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 w-full aspect-square">
                      <img
                        src={file.preview}
                        alt="preview"
                        className="h-full w-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={clearPending}
                        className="absolute right-1 top-1 inline-flex items-center justify-center rounded-md bg-black/60 text-white p-1 hover:bg-black/70"
                        aria-label="Remove selected"
                      >
                        <IconX className="h-4 w-4" />
                      </button>
                    </figure>
                  </>
                )}
              </div>

              <DialogFooter className="gap-2">
                <DialogClose asChild>
                  <Button variant="outline" disabled={uploading}>
                    Cancel
                  </Button>
                </DialogClose>
                <Button
                  onClick={importNow}
                  disabled={uploading || !file}
                  className="gap-2 bg-indigo-600 text-white hover:bg-indigo-700"
                >
                  {uploading ? "Uploading…" : "Upload"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
}
