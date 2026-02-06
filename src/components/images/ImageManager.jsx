import React, { useState, useEffect, useRef, useCallback } from "react";
import FolderComponent from "./FolderItem";
import ImageComponent from "./ImageCard";
import FileCard from "./FileCard";
import GCSBreadcrumb from "./Breadcrumbs";
import { IconChevronLeft } from "@tabler/icons-react";
import AddHereUploader from "../dialogs/AddHereDialog";
import CreateFolderDialog from "../dialogs/CreateFolderDialog";
import { usePermissions } from "@/hooks/use-permissions";
import { toast } from "react-toastify";
import api from "@/lib/api";

function ensureTrailingSlash(p) {
  if (!p) return "";
  return p.endsWith("/") ? p : p + "/";
}

function joinPath(prefix, name) {
  if (!prefix) return name;
  const p = ensureTrailingSlash(prefix);
  return `${p}${name}`;
}

function getFilenameFromItem(item) {
  return item.filename ?? item.name?.split("/").pop() ?? item.name;
}

const ImageManager = ({ initialPath = "", currentUser }) => {
  const rootPrefix =
    currentUser?.roleName === "creator"
      ? `uploads/user/${currentUser._id}/`
      : "";

  const [currentPath, setCurrentPath] = useState(rootPrefix || initialPath);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [nextPageToken, setNextPageToken] = useState(null); // 🧩 added
  const [fetchingMore, setFetchingMore] = useState(false); // 🧩 added
  const loadMoreRef = useRef(null); // 🧩 added
  const { can } = usePermissions();

  const downloadItem = async (item) => {
    try {
      setDownloading(true);
      const objectPath = item.name;
      const displayName = getFilenameFromItem(item);
      const r = await api().get(
        `/api/images/sign-download?path=${encodeURIComponent(
          objectPath
        )}&filename=${encodeURIComponent(displayName)}`
      );
      if (r.status !== 200) throw new Error(`Sign failed: ${r.status}`);
      const {
        data: { url },
      } = r;

      const a = document.createElement("a");
      a.href = url;
      a.download = displayName;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (e) {
      console.error("[downloadItem] ", e);
      toast.error("Failed to download.");
    } finally {
      setDownloading(false);
    }
  };

  // 🧩 Modified to handle pagination and append results
  const fetchItems = useCallback(
    async (prefix = currentPath, pageToken = null, append = false) => {
      try {
        if (!append) setLoading(true);
        else setFetchingMore(true);

        const params = new URLSearchParams();
        if (prefix) params.set("prefix", prefix);
        if (pageToken) params.set("pageToken", pageToken);
        params.set("maxResults", "50"); // fixed batch size

        const res = await api().get(`/api/images?${params.toString()}`);
        if (res.status !== 200) throw new Error(`Fetch failed: ${res.status}`);
        const { data } = res;

        if (append) {
          setItems((prev) => [...prev, ...(data.items || [])]);
        } else {
          setItems(data.items || []);
        }

        setNextPageToken(data.nextPageToken || null);
      } catch (e) {
        console.error(e);
        toast.error("Failed to fetch items.");
      } finally {
        setLoading(false);
        setFetchingMore(false);
      }
    },
    [currentPath]
  );

  // 🧩 Infinite Scroll Trigger
  useEffect(() => {
    if (!loadMoreRef.current || !nextPageToken || fetchingMore) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          fetchItems(currentPath, nextPageToken, true);
        }
      },
      { rootMargin: "200px" }
    );
    observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [nextPageToken, fetchingMore, currentPath, fetchItems]);

  function handleFolderClick(folderPrefix) {
    const next = ensureTrailingSlash(folderPrefix);
    setCurrentPath(next);
    fetchItems(next);
  }

  const deleteByName = async (filename) => {
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Not logged in.");
      return;
    }
    const fullPath = joinPath(currentPath, filename);
    try {
      setDeleting(true);
      // const r = await fetch("/api/images", {
      //   method: "DELETE",
      //   headers: {
      //     "Content-Type": "application/json",
      //     Authorization: `Bearer ${token}`,
      //   },
      //   body: JSON.stringify({ path: fullPath }),
      // });
      const r = await api().delete("/api/images", {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        data: { path: fullPath },
      });
      if (r.status !== 200) {
        const t = await r.text();
        throw new Error(`Delete failed ${r.status}: ${t}`);
      }
      await fetchItems(currentPath);
    } catch (err) {
      console.error("[delete image/file] ", err);
      toast.error("Failed to delete.");
    } finally {
      setDeleting(false);
    }
  };

  useEffect(() => {
    async function ensureCreatorRoot() {
      if (!rootPrefix) return;
      try {
        const check = await api().get(`/api/images?prefix=${rootPrefix}`);
        if (check.data.success === false) {
          await api().post("/api/images/create-folder", {
            parent: "user",
            name: `${currentUser._id}`,
          });
        }
        setCurrentPath(rootPrefix);
      } catch (err) {
        console.error("[ensureCreatorRoot] ", err);
        toast.error("Error ensuring user folder.");
      }
    }
    ensureCreatorRoot();
  }, [rootPrefix]);

  useEffect(() => {
    fetchItems(currentPath);
  }, [currentPath, fetchItems]);

  if (loading && !items.length)
    return (
      <div className=" w-full h-screen flex justify-center items-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary" />
      </div>
    );

  return (
    <div className="w-full h-full flex flex-col p-4 sm:p-6 overflow-y-auto custom-y-scroll ">
      <div className="toolbar px-2 sticky -top-6 z-10 bg-white/80 dark:bg-gray-900/80 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:supports-[backdrop-filter]:bg-gray-900/60 w-full h-fit flex items-center gap-2 py-1.5">
        <div className="min-w-0 flex-1 overflow-x-auto">
          <GCSBreadcrumb
            currentPath={currentPath}
            setCurrentPath={setCurrentPath}
            rootPrefix={rootPrefix}
          />
        </div>

        {can("images", "create") && (
          <div className="ml-auto flex items-center gap-2">
            <CreateFolderDialog
              parent={currentPath || ""}
              onCreated={() => fetchItems(currentPath)}
            />
            <AddHereUploader
              folder={currentPath || ""}
              onUploaded={() => fetchItems(currentPath)}
            />
          </div>
        )}
      </div>

      {/* Folders */}
      <div className="folders py-1.5 overflow-x-auto min-h-fit max-h-fit overscroll-x-contain scrollbar-thin ui-scrollbar-hidden">
        <div className=" inline-grid grid-flow-col grid-rows-2 auto-cols gap-3 sm:gap-4 py-2 pr-3 ">
          {items
            .filter((i) => i.type === "folder")
            .map((f) => (
              <div key={f.name} className="snap-start">
                <FolderComponent
                  name={f.displayName}
                  onClick={() => handleFolderClick(f.name)}
                />
              </div>
            ))}
        </div>
      </div>

      <div className="scrollbar-thin h-full py-1.5">
        {/* Images */}
        <div className="images grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-2 sm:gap-3">
          {items
            .filter((i) => i.type === "image")
            .map((img) => {
              const filename = getFilenameFromItem(img);
              return (
                <ImageComponent
                  key={img.name}
                  imageUrl={img.publicUrl}
                  onDelete={() => deleteByName(filename)}
                  onDownload={() => downloadItem(img)}
                  downloading={downloading}
                  deleting={deleting}
                />
              );
            })}
        </div>

        {/* Other files */}
        <div className="files grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-2 sm:gap-3">
          {items
            .filter((i) => i.type === "file")
            .map((file) => {
              const filename = getFilenameFromItem(file);
              return (
                <FileCard
                  key={file.name}
                  name={file.name}
                  url={file.url}
                  onDownload={() => downloadItem(file)}
                  downloading={downloading}
                  onDelete={() => deleteByName(filename)}
                />
              );
            })}
        </div>

        {/* 🧩 Infinite scroll loader */}
        {fetchingMore && (
          <div className="w-full flex justify-center items-center py-6">
            <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary" />
          </div>
        )}
        <div ref={loadMoreRef} className="h-10" />
      </div>
    </div>
  );
};

export default ImageManager;
