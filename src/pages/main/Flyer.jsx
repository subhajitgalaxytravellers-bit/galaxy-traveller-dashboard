import { useEffect, useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import FlyerFormDialog from "@/components/dialogs/FlyerFormDialog";
import { Header } from "@/components/Header";
import api from "@/lib/api";
import { IconSearch } from "@tabler/icons-react";
import FlyerCard from "@/components/FlyerCard";

/**
 * Infinite-scroll FlyersPage
 *
 * Notes:
 * - Exposes page/limit/total from server. If your API doesn't return those,
 *   it falls back to client-side assumptions.
 * - Axios must support AbortController signal (axios >= 0.22). If not, remove `signal`.
 */

export default function FlyersPage() {
  const [flyers, setFlyers] = useState({
    items: [],
    page: 1,
    limit: 20,
    total: 0,
  });

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState("new");
  const [q, setQ] = useState(""); // search query

  const [loading, setLoading] = useState(false); // for first / refresh loads
  const [loadingMore, setLoadingMore] = useState(false); // for subsequent page loads
  const [error, setError] = useState(null);

  const observerRef = useRef(null);
  const sentinelRef = useRef(null);
  const abortRef = useRef(null);
  const searchTimeoutRef = useRef(null);

  // derived
  const { items, limit, total } = flyers;
  const hasMore =
    total === 0 && items.length > 0
      ? items.length % limit === 0
      : items.length < total;

  // loadFlyers: fetch page; if append true, append new items
  const loadFlyers = useCallback(
    async ({ pageToLoad = 1, query = "", append = false } = {}) => {
      // cancel previous request
      if (abortRef.current) {
        try {
          abortRef.current.abort();
        } catch (e) {
          // ignore
          console.error(e);
        }
      }
      const controller = new AbortController();
      abortRef.current = controller;

      // toggle proper loading state
      if (append) setLoadingMore(true);
      else setLoading(true);

      setError(null);

      try {
        const res = await api().get("/api/flyers/moderation", {
          params: {
            q: (query || "").trim(),
            page: pageToLoad,
            limit: flyers.limit || 20,
          },
          // axios supports signal in modern versions
          signal: controller.signal,
        });

        const payload = res?.data?.data ?? res?.data ?? null;

        // payload may be an object { items, page, limit, total } OR an array OR { items: [...] }
        let newItems = [];
        let newPage = pageToLoad;
        let newLimit = flyers.limit || 20;
        let newTotal = 0;

        if (!payload) {
          // nothing meaningful returned
          newItems = [];
        } else if (Array.isArray(payload)) {
          newItems = payload;
          newTotal = payload.length;
        } else if (typeof payload === "object") {
          newItems = Array.isArray(payload.items) ? payload.items : [];
          newPage = payload.page ?? pageToLoad;
          newLimit = payload.limit ?? newLimit;
          newTotal =
            payload.total ??
            (Array.isArray(payload.items)
              ? payload.items.length
              : newItems.length);
        }

        setFlyers((prev) => {
          if (append) {
            // avoid duplicates (by _id)
            const existingIds = new Set(prev.items.map((i) => i._id));
            const deduped = newItems.filter((it) => !existingIds.has(it._id));
            return {
              items: [...prev.items, ...deduped],
              page: newPage,
              limit: newLimit,
              total: newTotal || prev.total,
            };
          } else {
            return {
              items: newItems,
              page: newPage,
              limit: newLimit,
              total: newTotal || 0,
            };
          }
        });
      } catch (err) {
        if (err?.name === "CanceledError" || err?.message === "canceled") {
          // ignore abort
        } else {
          console.error("Failed to load flyers", err);
          setError(err);
        }
      } finally {
        if (append) setLoadingMore(false);
        else setLoading(false);
        abortRef.current = null;
      }
    },
    [flyers.limit]
  );

  // initial mount: load first page
  useEffect(() => {
    loadFlyers({ pageToLoad: 1, query: q, append: false });
    // cleanup on unmount
    return () => {
      if (abortRef.current) {
        try {
          abortRef.current.abort();
        } catch (e) {
          console.error(e);
        }
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // debounced search: reset to page 1 and replace items
  useEffect(() => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      // reset items and load page 1 for new query
      loadFlyers({ pageToLoad: 1, query: q, append: false });
      // scroll to top of list (optional)
      // document.querySelector("#flyers-grid")?.scrollIntoView({ behavior: "smooth" });
    }, 400);

    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  // intersection observer to load next page
  useEffect(() => {
    if (!sentinelRef.current) return;

    // disconnect existing
    if (observerRef.current) {
      observerRef.current.disconnect();
      observerRef.current = null;
    }

    observerRef.current = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            // load next page if available and not already loading
            const nextPage = (flyers.page || 1) + 1;
            const shouldLoad =
              !loadingMore &&
              !loading &&
              hasMore &&
              nextPage > (flyers.page || 0);
            if (shouldLoad) {
              loadFlyers({ pageToLoad: nextPage, query: q, append: true });
            }
          }
        }
      },
      {
        root: null,
        rootMargin: "200px",
        threshold: 0.1,
      }
    );

    observerRef.current.observe(sentinelRef.current);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }
    };
  }, [flyers.page, hasMore, loadingMore, loading, loadFlyers, q]);

  // delete (optimistic)
  const deleteFlyer = async (id) => {
    if (!confirm("Delete this flyer?")) return;
    try {
      setFlyers((prev) => ({
        ...prev,
        items: (prev.items || []).filter((it) => it._id !== id),
        total: Math.max(0, (prev.total || 0) - 1),
      }));
      await api().delete(`/api/flyers/moderation/${id}`);
    } catch (err) {
      console.error("Failed to delete flyer", err);
      // re-sync if error
      loadFlyers({ pageToLoad: 1, query: q, append: false });
    }
  };

  const duplicateFlyer = async (id) => {
    try {
      // optional: show a confirmation or toast
      // const ok = confirm("Create a duplicate of this flyer?");
      // if (!ok) return;

      // call the duplicate endpoint
      const res = await api().post(`/api/flyers/moderation/${id}/duplicate`);

      // server returns { message, duplicate } per your controller
      const payload = res?.data?.data ?? res?.data ?? null;
      const duplicate = payload?.duplicate ?? payload?.doc ?? payload;

      if (!duplicate) {
        // fallback: refresh list
        await loadFlyers({ pageToLoad: 1, query: q, append: false });
        return;
      }

      // Ensure duplicate has _id; if server returned nested object, adjust accordingly
      const dupRecord = duplicate._id
        ? duplicate
        : duplicate.duplicate || duplicate.data;

      // Insert duplicate at the top of the list and open edit dialog for it
      setFlyers((prev) => ({
        ...prev,
        items: [dupRecord, ...(prev.items || [])],
        total: (prev.total || 0) + 1,
      }));

      // open the edit dialog for the duplicate (so user can modify)
      setEditingId(dupRecord._id);
      setDialogOpen(true);
    } catch (err) {
      console.error("Failed to duplicate flyer", err);
      // fallback: re-fetch list to ensure consistency
      loadFlyers({ pageToLoad: 1, query: q, append: false });
    }
  };

  const filteredItems = items; // server already filtered; client-side filtering removed for performance

  return (
    <>
      <Header
        title="Flyers"
        right={
          <Button
            onClick={() => {
              setEditingId("new");
              setDialogOpen(true);
            }}
          >
            Create Flyer
          </Button>
        }
      />
      <div className="p-4 md:p-6">
        <div className="w-full flex flex-col rounded-2xl border border-transparent ring-1 ring-black/5 dark:ring-white/10 bg-white/70 dark:bg-gray-900/60 backdrop-blur-sm">
          {/* top bar */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-black/5 dark:border-white/10">
            <div className="text-base font-semibold">Flyers</div>
            <div className="ml-auto flex items-center gap-2">
              <div className="relative">
                <IconSearch className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 opacity-60" />
                <Input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search Flyers..."
                  className="pl-8 w-56"
                />
              </div>
            </div>
          </div>

          {/* Flyers Grid */}
          <div id="flyers-grid" className="flex flex-wrap  p-4  gap-6 mt-4">
            {loading && items.length === 0 ? (
              <div className="col-span-full text-center text-gray-500">
                Loading...
              </div>
            ) : items.length === 0 ? (
              <div className="col-span-full text-center text-gray-500">
                No flyers found.
              </div>
            ) : (
              filteredItems.map((f) => (
                <FlyerCard
                  key={f._id}
                  flyer={f}
                  onEdit={(id) => {
                    setEditingId(id);
                    setDialogOpen(true);
                  }}
                  onDelete={(id) => {
                    if (!confirm("Delete this flyer?")) return;
                    deleteFlyer(id);
                  }}
                  onDuplicate={async (id) => {
                    await duplicateFlyer(id);
                  }}
                />
              ))
            )}
          </div>

          {/* sentinel / loader area */}
          <div className=" flex items-center justify-center">
            {loadingMore ? (
              <div className="text-sm p-4 text-gray-500">Loading more...</div>
            ) : hasMore ? (
              // sentinel element observed by IntersectionObserver
              <div ref={sentinelRef} className="h-2 w-full p-4" />
            ) : null}
          </div>

          {error && (
            <div className="p-4 text-sm text-red-600">
              Error loading flyers.
            </div>
          )}

          {/* Flyer Form Dialog */}
          <FlyerFormDialog
            open={dialogOpen}
            onClose={() => setDialogOpen(false)}
            flyerId={editingId}
            onSaved={() =>
              loadFlyers({ pageToLoad: 1, query: q, append: false })
            }
          />
        </div>
      </div>
    </>
  );
}
