// CreateFolderDialog.jsx
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
import { IconFolderPlus } from "@tabler/icons-react";
import { toast } from "react-toastify";
import api from "@/lib/api";

function stripToPrefix(p) {
  if (!p || p === "/") return "";
  const s = String(p).replace(/^\/+/, "");
  return s.endsWith("/") ? s : s + "/";
}

export default function CreateFolderDialog({
  parent = "",
  onCreated,
  title = "Create new folder",
}) {
  const [open, setOpen] = React.useState(false);
  const [name, setName] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  const reset = () => {
    setName("");
    setBusy(false);
  };

  const createFolder = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      toast.info("Please enter a folder name.");
      return;
    }
    // client-side validation to keep names clean
    if (trimmed.includes("/") || trimmed.includes("..")) {
      toast.error('Folder name cannot contain "/" or ".."');
      return;
    }
    setBusy(true);
    try {
      // const r = await fetch(`/api/images/create-folder`, {
      //   method: "POST",
      //   headers: {
      //     "Content-Type": "application/json",
      //     Authorization: `Bearer ${localStorage.getItem("token")}`,
      //   },
      //   body: JSON.stringify({
      //     parent: stripToPrefix(parent || ""),
      //     name: trimmed,
      //   }),
      // });
      const { data } = await api().post(`/api/images/create-folder`, {
        parent: stripToPrefix(parent || ""),
        name: trimmed,
      });

      if (data.error) {
        toast.error(data.error);
        setBusy(false);
        return;
      }
      toast.success("Folder created.");
      setOpen(false);
      reset();
      onCreated && onCreated(data.prefix);
    } catch (e) {
      console.error("[CreateFolder] ", e);
      toast.error("Failed to create folder.");
      setBusy(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) reset();
        setOpen(o);
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2" aria-label="New folder">
          <IconFolderPlus className="h-5 w-5" />
          <span className="hidden sm:inline">New folder</span>
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[420px]  border border-gray-300 dark:border-gray-700">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-2">
          <label className="text-sm text-gray-600 dark:text-gray-300">
            Folder name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !busy) createFolder();
            }}
            className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="e.g. images-2025"
            autoFocus
          />
          <div className="text-xs text-gray-500">
            Will be created under:{" "}
            <code>{stripToPrefix(parent || "") || "/"}</code>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <DialogClose asChild>
            <Button variant="outline" disabled={busy}>
              Cancel
            </Button>
          </DialogClose>
          <Button
            onClick={createFolder}
            disabled={busy}
            className="bg-indigo-600 text-white hover:bg-indigo-700"
          >
            {busy ? "Creating…" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
