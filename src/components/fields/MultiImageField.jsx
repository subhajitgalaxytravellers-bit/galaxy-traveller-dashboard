import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
  DialogTrigger,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { IconPlus, IconX, IconUpload, IconCheck } from "@tabler/icons-react";
import { toast } from "react-toastify";
import api from "@/lib/api";

// ---------- helpers ----------
function safeFilename(name) {
  const n = (name || "image").trim();
  const parts = n.split(".");
  const ext = parts.length > 1 ? "." + parts.pop() : "";
  const base = parts.join(".") || "image";
  const cleaned = base.replace(/[^\w.\-()+@ ]/g, "_");
  return cleaned + ext;
}
function uniqueName(baseName) {
  const parts = baseName.split(".");
  const ext = parts.length > 1 ? "." + parts.pop() : "";
  const base = parts.join(".");
  const stamp = Date.now().toString(36);
  return `${base}-${stamp}${ext}`;
}
function stripTrailingSlash(p) {
  if (!p || p === "/") return "";
  const s = String(p).replace(/^\/+/, "");
  return s.endsWith("/") ? s.slice(0, -1) : s;
}
const looksLikeUrl = (s) => /^https?:\/\//i.test(s);

// ---------- component ----------
export default function MultipleImageInput({
  value = [], // array of PATHS (recommended) or URLs
  onChange, // (next: string[]) => void
  folder, // GCS folder prefix for uploads (e.g., "blogs/123")
  title = "Choose images",
  accept = "image/*",
  disabled = false,
  max = 0, // 0 = unlimited
  tileSize = "w-24 h-24",
  valueIsPath = true, // if true, resolve signed URLs for display
  signReadEndpoint = "/api/images/sign-read",
  signUploadEndpoint = "/api/images/sign-upload",
}) {
  const [open, setOpen] = React.useState(false);
  const [files, setFiles] = React.useState([]); // { file, preview, name, status, progress }
  const [uploading, setUploading] = React.useState(false);
  const [summary, setSummary] = React.useState(null);

  // cache of path->signedUrl
  const urlCacheRef = React.useRef(new Map());
  // resolved URLs for display
  const [displayUrls, setDisplayUrls] = React.useState([]);

  const inputRef = React.useRef(null);

  // cleanup blobs
  React.useEffect(() => {
    return () => {
      files.forEach((f) => f.preview && URL.revokeObjectURL(f.preview));
    };
  }, [files]);

  const current = Array.isArray(value) ? value : [];

  const remainingSlots = React.useMemo(() => {
    if (!max || max <= 0) return Infinity;
    return Math.max(0, max - current.length);
  }, [max, current.length]);

  const canAddMore = remainingSlots > 0;

  // ---------- resolve signed URLs when value changes ----------
  React.useEffect(() => {
    let cancelled = false;

    async function resolve() {
      if (!valueIsPath) {
        setDisplayUrls(current);
        return;
      }

      const tasks = current.map(async (item) => {
        if (looksLikeUrl(item)) return item;

        const cached = urlCacheRef.current.get(item);
        if (cached) return cached;

        try {
          // const r = await fetch(
          //   `${signReadEndpoint}?path=${encodeURIComponent(item)}`
          // );

          const r = await api().get(
            `${signReadEndpoint}?path=${encodeURIComponent(item)}`
          );
          if (!r.ok) throw new Error("sign-read failed: " + r.status);
          const data = await r.json(); // { url, expiresAt }
          urlCacheRef.current.set(item, data.url);
          return data.url;
        } catch (e) {
          toast.error(`Failed to sign read for ${item}`);
          console.error("[sign-read] failed for", item, e);
          return "";
        }
      });

      const urls = await Promise.all(tasks);
      if (!cancelled) {
        setDisplayUrls(urls.filter(Boolean));
      }
    }

    resolve();
    return () => {
      cancelled = true;
    };
  }, [current, valueIsPath, signReadEndpoint]);

  const openPicker = () => {
    if (!canAddMore) {
      toast.warning(`Limit reached (${max})`);
      return;
    }
    inputRef.current?.click();
  };

  const addFiles = (fileList) => {
    if (!fileList || !fileList.length) return;
    const limit = isFinite(remainingSlots) ? remainingSlots : fileList.length;
    const chosen = Array.from(fileList).slice(0, limit);

    const next = [];
    chosen.forEach((f) => {
      if (!f.type || !f.type.startsWith("image/")) return;
      next.push({
        file: f,
        preview: URL.createObjectURL(f),
        name: uniqueName(safeFilename(f.name || "image")),
        status: "ready",
        progress: 0,
      });
    });
    setFiles((old) => [...old, ...next]);

    if (fileList.length > limit) {
      toast.info(
        `Selected ${chosen.length}. Skipped ${
          fileList.length - limit
        } due to limit.`
      );
    }
  };

  const handlePick = (e) => {
    addFiles(e.target.files);
    e.target.value = "";
  };

  const removePendingAt = (idx) => {
    setFiles((old) => {
      const copy = [...old];
      const item = copy[idx];
      if (item?.preview) URL.revokeObjectURL(item.preview);
      copy.splice(idx, 1);
      return copy;
    });
  };

  const clearPendingAll = () => {
    setFiles((old) => {
      old.forEach((f) => f.preview && URL.revokeObjectURL(f.preview));
      return [];
    });
    setSummary(null);
  };

  const pushPath = (path) => {
    if (!onChange) return;
    const cur = Array.isArray(value) ? value : [];
    if (cur.includes(path)) return;
    onChange([...cur, path]);
  };

  const removeItem = (item) => {
    if (!onChange) return;
    const next = (Array.isArray(value) ? value : []).filter((u) => u !== item);
    onChange(next);
    if (valueIsPath && !looksLikeUrl(item)) {
      urlCacheRef.current.delete(item);
    }
  };

  async function signUpload(gcsFolder, name, contentType) {
    const body = {
      folder: stripTrailingSlash(gcsFolder || ""), // '' is root
      filename: name,
      contentType: contentType || "application/octet-stream",
    };
    // const r = await fetch(signUploadEndpoint, {
    //   method: "POST",
    //   headers: { "Content-Type": "application/json" },
    //   body: JSON.stringify(body),
    // });

    const r = await api().post(signUploadEndpoint, {
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!r.ok) throw new Error("sign-upload failed: " + r.status);
    // expected: { path, uploadUrl, publicUrl }
    return r.json();
  }

  async function putToSignedUrl(uploadUrl, file) {
    // const res = await fetch(uploadUrl, {
    //   method: "PUT",
    //   headers: { "Content-Type": file.type || "application/octet-stream" },
    //   body: file,
    // });

    const res = await api().put(uploadUrl, {
      headers: { "Content-Type": file.type || "application/octet-stream" },
      body: file,
    });
    if (!res.ok) throw new Error("PUT upload failed: " + res.status);
  }

  const uploadAll = async () => {
    if (!files.length) {
      toast.info("Please select at least one image.");
      return;
    }

    const targetFolder = typeof folder === "string" ? folder : "";
    setUploading(true);
    setSummary(null);

    let ok = 0;
    let fail = 0;

    for (let i = 0; i < files.length; i++) {
      const item = files[i];
      try {
        setFiles((old) => {
          const copy = [...old];
          copy[i] = { ...copy[i], status: "uploading", progress: 8 };
          return copy;
        });

        const { uploadUrl, path: objectPath } = await signUpload(
          targetFolder,
          item.name,
          item.file.type
        );

        await putToSignedUrl(uploadUrl, item.file);

        // store PATH in value
        pushPath(objectPath);

        // prime cache with a fresh signed read for instant display
        try {
          // const r = await fetch(
          //   `${signReadEndpoint}?path=${encodeURIComponent(objectPath)}`
          // );

          const r = await api().get(
            `${signReadEndpoint}?path=${encodeURIComponent(objectPath)}`
          );
          if (r.ok) {
            const { url } = await r.json();
            urlCacheRef.current.set(objectPath, url);
          }
        } catch {
          // ignore
        }

        setFiles((old) => {
          const copy = [...old];
          copy[i] = { ...copy[i], status: "done", progress: 100 };
          return copy;
        });
        ok += 1;
      } catch (err) {
        console.error("Upload error for", item.name, err);
        setFiles((old) => {
          const copy = [...old];
          copy[i] = { ...copy[i], status: "error", progress: 0 };
          return copy;
        });
        fail += 1;
      }
    }

    setUploading(false);
    setSummary({ ok, fail });

    if (fail === 0) {
      toast.success(`Uploaded ${ok} image${ok > 1 ? "s" : ""}.`);
      setTimeout(() => {
        setOpen(false);
        clearPendingAll();
      }, 350);
    } else {
      if (ok) toast.warning(`Uploaded ${ok}, failed ${fail}.`);
      else toast.error("All uploads failed.");
    }
  };

  const getRemovableKey = (idx) => current[idx];

  return (
    <div className="space-y-3">
      {/* Current images (resolved to displayUrls) */}
      {displayUrls.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {displayUrls.map((url, idx) => {
            const removeKey = getRemovableKey(idx);
            return (
              <figure
                key={url + idx}
                className="relative overflow-hidden rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 aspect-square"
                title={removeKey}
              >
                <img
                  src={url}
                  alt={`image-${idx}`}
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
                <button
                  type="button"
                  onClick={() => removeItem(removeKey)}
                  className="absolute right-1 top-1 inline-flex items-center justify-center rounded-md bg-black/60 text-white p-1 hover:bg-black/70"
                  aria-label="Remove image"
                >
                  <IconX className="h-4 w-4" />
                </button>
              </figure>
            );
          })}
        </div>
      )}

      {/* Trigger tile */}
      <Dialog
        open={open}
        onOpenChange={(o) => {
          if (!o) clearPendingAll();
          setOpen(o);
        }}
      >
        <DialogTrigger asChild>
          <button
            type="button"
            disabled={disabled || !canAddMore}
            className={[
              "rounded-lg border border-dashed border-gray-300 dark:border-gray-700",
              "hover:border-gray-400 dark:hover:border-gray-500",
              "bg-white/60 dark:bg-gray-900/60",
              "grid place-items-center text-sm text-gray-600 dark:text-gray-300",
              tileSize,
              disabled || !canAddMore
                ? "opacity-50 cursor-not-allowed"
                : "cursor-pointer",
            ].join(" ")}
            aria-label="Add images"
            title={canAddMore ? "Add images" : "Limit reached"}
          >
            <div className="flex flex-col items-center gap-1">
              <IconPlus className="h-5 w-5" />
              <span>{current.length ? "Add more" : "Choose images"}</span>
              {isFinite(remainingSlots) && (
                <span className="text-[11px] opacity-80">
                  left: {remainingSlots}
                </span>
              )}
            </div>
          </button>
        </DialogTrigger>

        <DialogContent className="sm:max-w-[720px]">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
          </DialogHeader>

          <input
            ref={inputRef}
            type="file"
            accept={accept}
            multiple
            className="hidden"
            onChange={handlePick}
          />

          <div
            onClick={openPicker}
            className={[
              "mb-3 rounded-md border border-dashed border-gray-300 dark:border-gray-700",
              "bg-white/60 dark:bg-gray-900/60 p-4 text-center",
              "text-sm text-gray-600 dark:text-gray-300 cursor-pointer",
            ].join(" ")}
          >
            Click to select images or use “Add more”.
          </div>

          {files.length === 0 ? (
            <div className="text-sm text-gray-500">
              No new images selected yet.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {files.map((it, idx) => (
                <figure
                  key={idx}
                  className="relative overflow-hidden rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 aspect-square"
                  title={it.name}
                >
                  <img
                    src={it.preview}
                    alt={it.name}
                    className="h-full w-full object-cover"
                  />
                  {it.status === "uploading" && (
                    <span className="absolute left-1.5 bottom-1.5 text-[11px] px-1.5 py-0.5 rounded bg-black/60 text-white">
                      Uploading…
                    </span>
                  )}
                  {it.status === "done" && (
                    <span className="absolute left-1.5 bottom-1.5 inline-flex items-center gap-1 text-[11px] px-1.5 py-0.5 rounded bg-green-600 text-white">
                      <IconCheck className="h-3.5 w-3.5" /> Done
                    </span>
                  )}
                  {it.status === "error" && (
                    <span className="absolute left-1.5 bottom-1.5 text-[11px] px-1.5 py-0.5 rounded bg-red-600 text-white">
                      Failed
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removePendingAt(idx);
                    }}
                    className="absolute right-1 top-1 inline-flex items-center justify-center rounded-md bg-black/60 text-white p-1 hover:bg-black/70"
                    aria-label="Remove selected"
                  >
                    <IconX className="h-4 w-4" />
                  </button>
                </figure>
              ))}
            </div>
          )}

          {summary && (
            <div className="mt-2 text-sm">
              <span className="font-medium">Uploaded:</span> {summary.ok}{" "}
              &nbsp;|&nbsp;
              <span className="font-medium">Failed:</span> {summary.fail}
            </div>
          )}

          <DialogFooter className="gap-2">
            <DialogClose asChild>
              <Button variant="outline" disabled={uploading}>
                Close
              </Button>
            </DialogClose>
            <Button
              onClick={uploadAll}
              disabled={uploading || files.length === 0}
              className="gap-2 bg-indigo-600 text-white hover:bg-indigo-700"
            >
              <IconUpload className="h-4 w-4" />
              {uploading ? "Uploading…" : "Upload"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
