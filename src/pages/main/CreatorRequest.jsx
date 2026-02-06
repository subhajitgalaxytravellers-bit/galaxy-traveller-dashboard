import React, { useEffect, useMemo, useState } from "react";
import CreatorRequestCard from "@/components/CreatorRequestCard";

import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { RefreshCw, Search } from "lucide-react";
import api from "@/lib/api";
import { toast } from "react-toastify";
import { Header } from "@/components/Header"; // 👈 NEW
import CreateCreatorRequestDialog from "@/components/dialogs/CreateRequestDialog";

export default function CreatorRequestsPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("pending");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [limit] = useState(12);
  const [total, setTotal] = useState(0);
  const pages = useMemo(
    () => Math.max(1, Math.ceil(total / limit)),
    [total, limit]
  );

  async function fetchData({ keepPage = false, pageOverride } = {}) {
    try {
      setLoading(true);
      const currentPage =
        typeof pageOverride === "number" ? pageOverride : keepPage ? page : 1;
      const params = { status, page: currentPage, limit };
      if (q?.trim()) params.q = q.trim();
      const res = await api().get("/api/creator-requests", { params });
      setItems(res.data?.items || []);
      setTotal(res.data?.total || 0);
      if (!keepPage && typeof pageOverride !== "number") setPage(1);
    } catch (e) {
      console.error("[CreatorRequestsPage] fetch error", e);
      toast.error("Failed to load requests");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  async function handleApprove(id) {
    try {
      // If your backend uses /accept instead of /approve, swap here.
      await api().patch(`/api/creator-requests/${id}/approve`, {});
      toast.success("Approved. User promoted to Creator and notified.");
      fetchData({ keepPage: true, pageOverride: page });
    } catch (e) {
      console.error("approve error", e);
      toast.error("Approve failed");
    }
  }

  async function handleReject(id, reason) {
    try {
      await api().patch(`/api/creator-requests/${id}/reject`, {
        rejectReason: reason,
      });
      toast.success("Rejected. User has been notified with reason.");
      fetchData({ keepPage: true, pageOverride: page });
    } catch (e) {
      console.error("reject error", e);
      toast.error("Reject failed");
    }
  }

  async function handleDelete(id) {
    try {
      await api().delete(`/api/creator-requests/${id}`);
      toast.success("Request deleted.");
      // If current page becomes empty, you may want to go back a page.
      fetchData({ keepPage: true, pageOverride: page });
    } catch (e) {
      console.error("delete error", e);
      toast.error("Delete failed");
    }
  }

  return (
    <div className="min-h-screen w-full">
      <Header
        title="Creator Requests"
        right={
          <div className="flex gap-2">
            <CreateCreatorRequestDialog
              onCreated={() =>
                fetchData({ keepPage: true, pageOverride: page })
              }
            />
            <Button
              variant="outline"
              onClick={() => fetchData({ keepPage: true, pageOverride: page })}
              className="gap-2"
            >
              <RefreshCw className="h-4 w-4" /> Refresh
            </Button>
          </div>
        }
      />
      <div className="px-4 md:px-6 py-6">
        <Card className="border border-border/60 bg-card">
          <CardContent className="pt-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <Tabs
                value={status}
                onValueChange={setStatus}
                className="w-full sm:w-auto"
              >
                <TabsList>
                  <TabsTrigger value="pending">Pending</TabsTrigger>
                  <TabsTrigger value="approved">Approved</TabsTrigger>
                  <TabsTrigger value="rejected">Rejected</TabsTrigger>
                </TabsList>
              </Tabs>

              <div className="flex w-full sm:w-80 items-center gap-2">
                <div className="relative w-full">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name…"
                    className="pl-8"
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && fetchData()}
                  />
                </div>
                <Button variant="secondary" onClick={() => fetchData()}>
                  Search
                </Button>
              </div>
            </div>

            {/* Grid */}
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {loading &&
                Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-48 w-full rounded-xl" />
                ))}

              {!loading && items.length === 0 && (
                <div className="col-span-full">
                  <Card className="border border-border/60">
                    <CardContent className="py-10 text-center text-muted-foreground">
                      No requests found.
                    </CardContent>
                  </Card>
                </div>
              )}

              {!loading &&
                items.map((item) => (
                  <CreatorRequestCard
                    key={item.id || item._id}
                    item={item}
                    onApprove={() => handleApprove(item.id || item._id)}
                    onReject={(reason) =>
                      handleReject(item.id || item._id, reason)
                    }
                    onDelete={() => handleDelete(item.id || item._id)}
                  />
                ))}
            </div>

            {/* Pagination */}
            {!loading && pages > 1 && (
              <div className="mt-6 flex items-center justify-center gap-2">
                <Button
                  variant="outline"
                  disabled={page <= 1}
                  onClick={() => {
                    const np = Math.max(1, page - 1);
                    setPage(np);
                    fetchData({ keepPage: true, pageOverride: np });
                  }}
                >
                  Prev
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {page} / {pages}
                </span>
                <Button
                  variant="outline"
                  disabled={page >= pages}
                  onClick={() => {
                    const np = Math.min(pages, page + 1);
                    setPage(np);
                    fetchData({ keepPage: true, pageOverride: np });
                  }}
                >
                  Next
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
