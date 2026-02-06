import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Checkbox } from "../ui/checkbox";
import {
  IconChevronLeft,
  IconFolders,
  IconSearch,
  IconUpload,
  IconCheck,
  IconX,
} from "@tabler/icons-react";
import CreateFolderDialog from "../dialogs/CreateFolderDialog";
import AddHereUploader from "../dialogs/AddHereDialog";
import { toast } from "react-toastify";
import { useCurrentUser } from "@/hooks/use-currentuser";
import api from "@/lib/api";

// -------- utils --------
const clsx = (...args) => args.filter(Boolean).join(" ");
const ensureTrailingSlash = (p) => (p.endsWith("/") ? p : p + "/");
const getDisplayName = (fullPath) =>
  (fullPath || "").replace(/\/$/, "").split("/").pop() || fullPath;

function FolderTile({ name, onOpen }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className={clsx(
        "group relative w-full min-w-[7rem] rounded-xl border p-2 flex items-center gap-3 text-left",
        "bg-white/80 dark:bg-gray-900/60 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
      )}
    >
      <span className="grid place-items-center h-6 w-6 rounded-lg border border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800">
        <IconFolders className="h-4 w-4" />
      </span>
      <div className="flex-1 min-w-0">
        <div className="truncate font-medium text-xs leading-6 capitalize">
          {name}
        </div>
      </div>
    </button>
  );
}

function ImageTile({ item, checked, onToggle }) {
  return (
    <div className="relative rounded-lg border w-[4.5rem] sm:w-[6.9rem] bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="absolute top-2 left-2 z-10">
        <Checkbox checked={checked} onCheckedChange={onToggle} />
      </div>
      <button type="button" onClick={onToggle} className="block w-full">
        <img
          src={item.publicUrl}
          alt={getDisplayName(item.name)}
          className="w-full aspect-[4/3] object-contain bg-gray-50 dark:bg-gray-800"
        />
      </button>
      <div className="px-2 py-1 text-[11px] truncate">
        {getDisplayName(item.name)}
      </div>
    </div>
  );
}

export default function ImagePickerDialog({
  open,
  onOpenChange,
  multiple = false,
  initialPath = "",
  onConfirm,
  initialSelected = [],
}) {
  const { data: currentUser } = useCurrentUser();

  // ----- Root folder logic -----
  const rootPrefix =
    currentUser?.roleName === "creator"
      ? `uploads/user/${currentUser._id}/`
      : initialPath || "";

  const [currentPath, setCurrentPath] = useState(rootPrefix);
  const [items, setItems] = useState([]);
  const [nextPageToken, setNextPageToken] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetchingMore, setFetchingMore] = useState(false);
  const [query, setQuery] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const loadMoreRef = useRef(null);

  const [selected, setSelected] = useState(() => new Set(initialSelected));
  const [selectedThumbs, setSelectedThumbs] = useState([]);

  // -------- Debounce search --------
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(query.trim()), 400);
    return () => clearTimeout(t);
  }, [query]);

  // -------- Fetch items --------
  const fetchItems = useCallback(
    async (prefix = currentPath, pageToken = null, append = false) => {
      try {
        if (!append) setLoading(true);
        else setFetchingMore(true);

        const params = new URLSearchParams();
        if (prefix) params.set("prefix", prefix);
        if (pageToken) params.set("pageToken", pageToken);
        if (debouncedQ) params.set("q", debouncedQ);
        params.set("maxResults", "60");

        const res = await api().get(`/api/images?${params.toString()}`);
        if (res.status !== 200) throw new Error(`Fetch failed ${res.status}`);

        const { data } = res;
        if (append) setItems((prev) => [...prev, ...(data.items || [])]);
        else setItems(data.items || []);
        setNextPageToken(data.nextPageToken || null);
      } catch (e) {
        console.error(e);
        toast.error("Failed to fetch images");
      } finally {
        setLoading(false);
        setFetchingMore(false);
      }
    },
    [currentPath, debouncedQ]
  );

  // -------- Infinite scroll --------
  useEffect(() => {
    if (!loadMoreRef.current || !nextPageToken || fetchingMore) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting)
          fetchItems(currentPath, nextPageToken, true);
      },
      { rootMargin: "200px" }
    );
    observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [nextPageToken, fetchingMore, currentPath, fetchItems]);

  // -------- Reload on open/path/search change --------
  useEffect(() => {
    if (!open) return;
    fetchItems(currentPath);
  }, [open, currentPath, debouncedQ, fetchItems]);

  // -------- Folder Navigation --------
  function goBack() {
    if (!currentPath) return;

    const normalizedCurrent = currentPath.replace(/\/+$/, "");
    const normalizedRoot = rootPrefix.replace(/\/+$/, "");

    // If already at or above root, stop
    if (
      normalizedCurrent === normalizedRoot ||
      !normalizedCurrent.startsWith(normalizedRoot || "uploads") // safe default
    ) {
      return;
    }

    const parts = normalizedCurrent.split("/");
    parts.pop(); // remove last segment
    const newPath = parts.join("/");

    // Special rule: if the parent is just "uploads", skip to root ""
    if (newPath === "uploads" || newPath === "/uploads") {
      setCurrentPath("");
      return;
    }

    // Ensure we don't go above rootPrefix
    if (normalizedRoot && newPath.length < normalizedRoot.length) {
      setCurrentPath(ensureTrailingSlash(rootPrefix));
    } else {
      setCurrentPath(ensureTrailingSlash(newPath));
    }
  }

  function handleOpenFolder(folderName) {
    const next = ensureTrailingSlash(folderName);
    if (next.startsWith(rootPrefix)) {
      setCurrentPath(next);
    } else {
      toast.error("Access outside your folder is not allowed.");
    }
  }

  // -------- Selection logic --------
  function toggle(path) {
    setSelected((prev) => {
      const n = new Set(prev);
      if (multiple) {
        n.has(path) ? n.delete(path) : n.add(path);
      } else {
        n.clear();
        n.add(path);
      }
      return new Set(n);
    });
  }

  function remove(path) {
    setSelected((prev) => {
      const n = new Set(prev);
      n.delete(path);
      return new Set(n);
    });
  }

  async function handleConfirm() {
    const vals = Array.from(selected);
    if (!vals.length) return;
    onConfirm && onConfirm(vals);
    onOpenChange(false);
  }

  // -------- Track selected thumbs --------
  useEffect(() => {
    const out = Array.from(selected).map((url) => ({ url }));
    setSelectedThumbs(out);
  }, [selected]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[96vw] p-0  w-[1110px] max-h-[90vh] h-full flex flex-col overflow-hidden border border-gray-200 dark:border-gray-700">
        {/* Header */}
        <DialogHeader className="flex flex-row justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <DialogTitle className="flex items-center gap-2 text-lg font-semibold">
            <button
              type="button"
              onClick={goBack}
              className="text-gray-600 hover:text-gray-900 dark:text-gray-300"
            >
              <IconChevronLeft />
            </button>
            <span>Image Library</span>
          </DialogTitle>
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <IconSearch className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by filename"
                className="pl-8"
              />
            </div>

            <CreateFolderDialog
              parent={currentPath}
              onCreated={() => fetchItems(currentPath)}
            />
            <AddHereUploader
              folder={currentPath}
              onUploaded={() => fetchItems(currentPath)}
              listenOpenEvent="open-add-here-uploader"
            />
          </div>
        </DialogHeader>

        {/* Toolbar */}
        <div className="px-4 py-3 flex flex-col gap-3 shrink-0">
          {selected.size > 0 && (
            <div className="max-w-full overflow-x-auto pb-2 custom-x-scroll">
              <div className="flex items-center gap-2 w-max">
                {selectedThumbs.map((t) => (
                  <div key={t.url} className="relative w-12 h-12 flex-shrink-0">
                    <img
                      src={t.url}
                      alt=""
                      className="h-12 w-12 object-cover rounded"
                    />
                    <button
                      type="button"
                      onClick={() => remove(t.url)}
                      className="absolute -top-1 -right-1 bg-black/70 text-white rounded-full p-0.5"
                    >
                      <IconX className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-4 pb-3 custom-y-scroll">
          {/* Folders */}
          {items.some((i) => i.type === "folder") && (
            <div className="py-2 overflow-x-auto mb-3">
              <div className="inline-grid grid-flow-col grid-rows-2 auto-cols gap-3 pr-2">
                {items
                  .filter((i) => i.type === "folder")
                  .map((f) => (
                    <div key={f.name}>
                      <FolderTile
                        name={getDisplayName(f.name)}
                        onOpen={() => handleOpenFolder(f.name)}
                      />
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Images */}
          <div className="flex flex-wrap gap-2">
            {items
              .filter((i) => i.type === "image")
              .map((img) => (
                <ImageTile
                  key={img.name}
                  item={img}
                  checked={selected.has(img.publicUrl)}
                  onToggle={() => toggle(img.publicUrl)}
                />
              ))}
          </div>

          {/* Infinite scroll sentinel */}
          {fetchingMore && (
            <div className="py-4 text-center text-sm">Loading more…</div>
          )}
          <div ref={loadMoreRef} className="h-10" />

          {!loading && !nextPageToken && items.length === 0 && (
            <div className="py-8 text-center text-sm">No items</div>
          )}
        </div>

        {/* Footer */}
        <DialogFooter className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 flex justify-between shrink-0">
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={!selected.size}
          >
            <IconCheck className="h-4 w-4 mr-1" />
            Use
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ------- Fields (resolve path -> signed URL for preview) -------
export function ImageField({ value, onChange }) {
  const [open, setOpen] = useState(false);

  const handleRemove = (e) => {
    e.stopPropagation(); // prevent reopening picker
    onChange(null);
  };

  return (
    <div className="space-y-1 relative">
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full min-h-[42px] rounded-md border border-gray-300 dark:border-gray-700 px-3 py-2 flex items-center gap-2"
      >
        {value ? (
          <>
            <img
              src={value}
              alt=""
              className="h-10 w-10 object-cover rounded"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300 truncate">
              {value.split("/").pop()}
            </span>
          </>
        ) : (
          <span className="text-gray-500">Select image…</span>
        )}
      </button>

      {/* ❌ Centered Remove button on the right */}
      {value && (
        <button
          type="button"
          onClick={handleRemove}
          className="absolute top-1/2 -translate-y-1/2 right-2 bg-black/70 text-white rounded-full p-1 hover:bg-black/90 transition"
        >
          <IconX className="h-3.5 w-3.5" />
        </button>
      )}

      {/* Image Picker Dialog */}
      <ImagePickerDialog
        open={open}
        onOpenChange={setOpen}
        multiple={false}
        initialPath=""
        onConfirm={(vals) => {
          console.log(vals[0]);
          onChange(vals[0]);
        }}
      />
    </div>
  );
}

export function MultiImageField({ value = [], onChange }) {
  const [open, setOpen] = useState(false);

  const remove = (i) => {
    const n = value.slice();
    n.splice(i, 1);
    onChange(n);
  };
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {value.map((u, i) => (
          <div key={i} className="relative">
            <img src={u} alt="" className="h-14 w-14 object-cover rounded" />
            <Button
              type="button"
              onClick={() => remove(i)}
              className="absolute -top-1 -right-1 bg-black/70 text-white rounded-full p-0.5"
            >
              <IconX className="h-3 w-3" />
            </Button>
          </div>
        ))}
        <Button type="button" variant="secondary" onClick={() => setOpen(true)}>
          <IconUpload className="h-4 w-4 mr-1" />
          Add
        </Button>
      </div>
      <ImagePickerDialog
        open={open}
        onOpenChange={setOpen}
        multiple
        initialPath=""
        onConfirm={(vals) => {
          const next = Array.from(new Set([...(value || []), ...vals]));
          onChange(next);
        }}
        initialSelected={value}
      />
    </div>
  );
}
