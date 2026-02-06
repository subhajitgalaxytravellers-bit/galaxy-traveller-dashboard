// CreateCreatorRequestDialog.jsx
import React, { useMemo, useRef, useState } from "react";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { Loader2, UploadCloud, FileText, Check } from "lucide-react";
import api from "@/lib/api";
import { toast } from "react-toastify";
import PermButton from "../guard/PermButton";
import axios from "axios";

export default function CreateCreatorRequestDialog({ onCreated }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [objectPath, setObjectPath] = useState("");
  const [previewUrl, setPreviewUrl] = useState("");
  const [note, setNote] = useState("");
  const inputRef = useRef(null);

  const fileInfo = useMemo(() => {
    if (!file) return "No file selected";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(file.size) / Math.log(k));
    const sizeTxt = `${parseFloat((file.size / Math.pow(k, i)).toFixed(2))} ${
      sizes[i]
    }`;
    return `${file.name} • ${file.type || "unknown"} • ${sizeTxt}`;
  }, [file]);

  const acceptTypes = ".pdf,.doc,.docx";
  const MAX_SIZE = 15 * 1024 * 1024; // 15 MB

  function handleFileChange(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > MAX_SIZE) {
      toast.error("File too large (max 15 MB)");
      e.target.value = "";
      return;
    }
    setFile(f);
  }
  async function uploadToGcs() {
    if (!file) {
      toast.error("Select a file first");
      return null;
    }
    try {
      setUploading(true);

      // 1) Get signed upload URL from the server
      const signRes = await api().post("/api/docs/sign-upload", {
        filename: file.name,
        contentType: file.type || "application/octet-stream",
      });
      // console.log("signRes");

      const { uploadUrl, path } = signRes.data || {};
      if (!uploadUrl || !path) throw new Error("Failed to sign upload");

      // 2) PUT the file to GCS (this actually creates the object)
      // const putRes = await fetch(uploadUrl, {
      //   method: "PUT",
      //   headers: { "Content-Type": file.type || "application/octet-stream" },
      //   body: file,
      // });

      const putRes = await axios.put(uploadUrl, file, {
        headers: { "Content-Type": file.type || "application/octet-stream" },
      });

      if (!putRes.ok) throw new Error(`Upload failed (${putRes.status})`);

      // 3) Get a signed READ URL for preview (retry a couple of times if needed)
      let readUrl = "";
      for (let i = 0; i < 3; i++) {
        try {
          const readRes = await api().get("/api/docs/sign-read", {
            params: { path },
          });
          readUrl = readRes.data?.url || "";
          if (readUrl) break;
        } catch (e) {
          toast.error(e?.message || "Failed to sign read");
          await new Promise((r) => setTimeout(r, 250)); // retry delay
        }
      }

      setObjectPath(path); // store PATH in DB (documentPath)
      setPreviewUrl(readUrl); // signed preview URL (time-limited)
      toast.success("Document uploaded");
      return path;
    } catch (err) {
      console.error("[CreateCreatorRequestDialog] upload error:", err);
      toast.error(err?.message || "Upload failed");
      return null;
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit() {
    try {
      if (!name?.trim()) return toast.error("Name required");

      let documentPath = objectPath;
      if (!documentPath) {
        const p = await uploadToGcs();
        if (!p) return;
        documentPath = p;
      }

      // current user comes from backend (req.user), no need to pass userId
      await api().post("/api/creator-requests/apply", {
        name,
        documentPath,
        note,
      });

      toast.success("Request submitted. We will review it shortly.");
      setOpen(false);
      setName("");
      setFile(null);
      setObjectPath("");
      setPreviewUrl("");
      setNote("");
      if (inputRef.current) inputRef.current.value = "";
      onCreated && onCreated();
    } catch (err) {
      console.error("[CreateCreatorRequestDialog] submit error:", err);
      toast.error(
        err?.response?.data?.error || err?.message || "Submit failed"
      );
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <PermButton model="creatorRequest" action="create" className="gap-2">
          <UploadCloud className="h-4 w-4" /> New Request
        </PermButton>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg border border-gray-300 dark:border-gray-800">
        <DialogHeader>
          <DialogTitle>Become a Creator</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 flex flex-col gap-4">
          <div className="space-y-2">
            <Label className="text-sm mb-2" htmlFor="creator-name">
              Your Name
            </Label>
            <Input
              id="creator-name"
              placeholder="Enter your full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm mb-2">
              Verification Document (PDF/Image/Doc)
            </Label>
            <div className="rounded-xl flex items-center justify-center border border-border/60 bg-muted/20 p-3">
              <div className=" w-full">
                <input
                  ref={inputRef}
                  type="file"
                  accept={acceptTypes}
                  onChange={handleFileChange}
                  className="block w-full text-sm border border-border/60 bg-muted/20 rounded-lg px-3 py-2"
                />
                <p className="mt-2 px-3 text-xs text-muted-foreground wrap-anywhere">
                  {fileInfo}
                </p>
              </div>
              {fileInfo !== "No file selected" && (
                <div className=" px-3 flex flex-wrap justify-center items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={uploadToGcs}
                    className="gap-2 border border-gray-200 dark:border-gray-700 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {uploading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <UploadCloud className="h-4 w-4" />
                    )}
                    Upload
                  </Button>
                  {objectPath && (
                    <span className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <Check className="h-4 w-4" /> Uploaded
                    </span>
                  )}
                </div>
              )}
            </div>
            {previewUrl && (
              <a
                href={previewUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-2 inline-flex items-center gap-2 text-sm underline"
              >
                <FileText className="h-4 w-4" /> Preview document
              </a>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="secondary" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={uploading || !name?.trim()}
            className="gap-2"
          >
            Submit
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
