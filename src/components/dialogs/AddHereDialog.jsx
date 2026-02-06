import React from "react";
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
import { IconPlus, IconX, IconUpload, IconCheck } from "@tabler/icons-react";
import { toast } from "react-toastify"; // ✅ use toastify
import api from "@/lib/api";
import axios from "axios";

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

export default function AddHereUploader({
  folder,
  onUploaded,
  title = "Upload images",
  accept = "image/*",
  multiple = true,
}) {
  const [open, setOpen] = React.useState(false);
  const [files, setFiles] = React.useState([]);
  const [uploading, setUploading] = React.useState(false);
  const [summary, setSummary] = React.useState(null);
  const inputRef = React.useRef(null);

  React.useEffect(() => {
    return () => {
      files.forEach((f) => f.preview && URL.revokeObjectURL(f.preview));
    };
  }, [files]);

  const openPicker = () => inputRef.current && inputRef.current.click();

  const addFiles = (fileList) => {
    if (!fileList || !fileList.length) return;
    const next = [];
    Array.from(fileList).forEach((f) => {
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
  };

  const handlePick = (e) => {
    addFiles(e.target.files);
    e.target.value = "";
  };

  const removeAt = (idx) => {
    setFiles((old) => {
      const copy = [...old];
      const item = copy[idx];
      if (item?.preview) URL.revokeObjectURL(item.preview);
      copy.splice(idx, 1);
      return copy;
    });
  };

  const clearAll = () => {
    setFiles((old) => {
      old.forEach((f) => f.preview && URL.revokeObjectURL(f.preview));
      return [];
    });
    setSummary(null);
  };

  function stripTrailingSlash(p) {
    if (!p || p === "/") return ""; // ✅ treat "/" or empty as root
    const s = String(p).replace(/^\/+/, "");
    return s.endsWith("/") ? s.slice(0, -1) : s;
  }

  async function signUpload(gcsFolder, name, contentType) {
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Not logged in.");
      return;
    }
    const body = {
      folder: stripTrailingSlash(gcsFolder || ""), // '' is root
      filename: name,
      contentType: contentType || "application/octet-stream",
    };
    const { data } = await api().post("/api/images/sign-upload", body);
    return data;
  }

  async function putToSignedUrl(uploadUrl, file) {
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Not logged in.");
      return;
    }
    // const res = await fetch(uploadUrl, {
    //   method: "PUT",
    //   headers: {
    //     "Content-Type": file.type || "application/octet-stream",
    //     "x-goog-acl": "public-read", // 👈 must match signed headers
    //   },
    //   body: file,
    // });

    const res = await axios.put(uploadUrl, file, {
      headers: {
        "Content-Type": file.type || "application/octet-stream",
        "x-goog-acl": "public-read",
      },
    });
    if (res.status < 200 || res.status >= 300)
      throw new Error("PUT upload failed: " + res.status);
    return res;
  }

  const uploadAll = async () => {
    const targetFolder = typeof folder === "string" ? folder : "";

    if (!files.length) {
      toast.info("Please select at least one image.");
      return;
    }

    setUploading(true);
    setSummary(null);

    let ok = 0;
    let fail = 0;

    for (let i = 0; i < files.length; i++) {
      const item = files[i];
      try {
        setFiles((old) => {
          const copy = [...old];
          copy[i] = { ...copy[i], status: "uploading", progress: 5 };
          return copy;
        });

        // 1. get signed URL
        const { uploadUrl, path } = await signUpload(
          targetFolder,
          item.name,
          item.file.type
        );

        console.log("uploadUrl", uploadUrl, "path", path);

        const token = localStorage.getItem("token");
        if (!token) {
          toast.error("Not logged in.");
          return;
        }

        // 2. upload file
        await putToSignedUrl(uploadUrl, item.file);

        // 3. finalize (make public)
        // await fetch("/api/images/finalize", {
        //   method: "POST",
        //   headers: {
        //     "Content-Type": "application/json",
        //     Authorization: `Bearer ${token}`,
        //   },
        //   body: JSON.stringify({ path }),
        // });

        // await api().post("/api/images/finalize", { path });

        setFiles((old) => {
          const copy = [...old];
          copy[i] = { ...copy[i], status: "done", progress: 100 };
          return copy;
        });
        ok += 1;
      } catch (err) {
        toast.error(`Failed to upload ${item.name}: ${err}`);
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
        clearAll();
        onUploaded && onUploaded();
      }, 400);
    } else {
      if (ok) toast.warn(`Uploaded ${ok}, failed ${fail}.`);
      else toast.error("All uploads failed.");
      onUploaded && onUploaded();
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) clearAll();
        setOpen(o);
      }}
    >
      <DialogTrigger asChild>
        <Button className="gap-2" aria-label="Add here">
          <IconPlus className="h-5 w-5" />
          <span className="hidden sm:inline">Add Here</span>
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[720px]  border border-gray-300 dark:border-gray-700">
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
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
          Click to select {multiple ? "images" : "an image"} or use “Add more”.
        </div>

        {files.length === 0 ? (
          <div className="text-sm text-gray-500">No images selected yet.</div>
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
                  loading="lazy"
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
                    removeAt(idx);
                  }}
                  className="absolute right-1 top-1 inline-flex items-center justify-center rounded-md bg-black/60 text-white p-1 hover:bg-black/70"
                  aria-label="Remove image"
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
  );
}
