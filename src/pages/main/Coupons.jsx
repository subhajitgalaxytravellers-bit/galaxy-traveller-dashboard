import { useEffect, useState } from "react";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import api from "@/lib/api";
import {
  IconTicket,
  IconCircleCheck,
  IconCircleOff,
  IconMail,
  IconX,
  IconEdit,
  IconTrash,
} from "@tabler/icons-react";
import CouponFormDialog from "@/components/dialogs/CouponFormDialog";
import CouponSendDialog from "@/components/dialogs/CouponSendDialog";
import { usePermissions } from "@/hooks/use-permissions";

const statusBadge = (status) =>
  status === "active" ? (
    <span className="inline-flex items-center gap-1 text-green-600 text-xs font-semibold">
      <IconCircleCheck size={14} /> Active
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 text-amber-600 text-xs font-semibold">
      <IconCircleOff size={14} /> Paused
    </span>
  );

export default function CouponsPage() {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [sendOpen, setSendOpen] = useState(false);
  const [sendCoupon, setSendCoupon] = useState(null);
  const { can } = usePermissions();

  const canCreate = can("coupon", "create");
  const canUpdate = can("coupon", "update");
  const canDelete = can("coupon", "delete");
  const canRead = can("coupon", "read");

  const loadCoupons = async () => {
    setLoading(true);
    try {
      const res = await api().get("/api/coupons", {
        params: { q },
      });
      const payload = res?.data?.data || res?.data;
      setCoupons(payload?.items || payload || []);
    } catch (err) {
      console.error("Failed to load coupons", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCoupons();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = coupons.filter((c) =>
    (q || "").trim()
      ? c.code?.toLowerCase().includes(q.toLowerCase()) ||
        c.notes?.toLowerCase().includes(q.toLowerCase())
      : true
  );

  const onDelete = async (id) => {
    if (!window.confirm("Delete this coupon?")) return;
    try {
      await api().delete(`/api/coupons/${id}`);
      setCoupons((prev) => prev.filter((c) => c._id !== id));
    } catch (err) {
      console.error("Delete failed", err);
    }
  };

  return (
    <>
      <Header
        title="Coupons"
        right={
          canCreate && (
            <Button
              onClick={() => {
                setEditing(null);
                setDialogOpen(true);
              }}
            >
              Add Coupon
            </Button>
          )
        }
      />

      <div className="p-4 md:p-6">
        <div className="rounded-2xl border border-black/5 dark:border-white/10 bg-white/70 dark:bg-gray-900/60 backdrop-blur-sm shadow-sm">
          <div className="flex items-center gap-3 px-4 py-3 border-b border-black/5 dark:border-white/10">
            <IconTicket size={18} className="text-primary" />
            <div className="text-base font-semibold">Coupons</div>
            <div className="ml-auto flex items-center gap-2">
              <div className="relative">
                <Input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && loadCoupons()}
                  placeholder="Search coupon code..."
                  className="pl-3 w-56"
                />
              </div>
              <Button variant="ghost" size="sm" onClick={loadCoupons}>
                Refresh
              </Button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase tracking-wide text-muted-foreground border-b border-black/5 dark:border-white/10">
                <tr>
                  <th className="px-4 py-3">Code</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Value</th>
                  <th className="px-4 py-3">Max Off</th>
                  <th className="px-4 py-3">Usage</th>
                  <th className="px-4 py-3">Window</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td className="px-4 py-6 text-center text-muted-foreground" colSpan={8}>
                      Loading...
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td className="px-4 py-6 text-center text-muted-foreground" colSpan={8}>
                      No coupons found.
                    </td>
                  </tr>
                ) : (
                  filtered.map((c) => (
                    <tr
                      key={c._id}
                      className="border-b border-black/5 dark:border-white/5 last:border-0"
                    >
                      <td className="px-4 py-3 font-semibold">{c.code}</td>
                      <td className="px-4 py-3 capitalize">{c.type}</td>
                      <td className="px-4 py-3">
                        {c.type === "percent" ? `${c.value}%` : `₹${c.value}`}
                      </td>
                      <td className="px-4 py-3">{c.maxOff ? `₹${c.maxOff}` : "—"}</td>
                      <td className="px-4 py-3">
                        {c.timesUsed || 0}
                        {c.maxUses ? ` / ${c.maxUses}` : " / ∞"}
                        {c.maxUsesPerUser ? ` (per user ${c.maxUsesPerUser})` : ""}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {c.startsAt ? new Date(c.startsAt).toLocaleDateString() : "Now"} —{" "}
                        {c.expiresAt ? new Date(c.expiresAt).toLocaleDateString() : "No expiry"}
                      </td>
                      <td className="px-4 py-3">{statusBadge(c.status)}</td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => {
                              setSendCoupon(c);
                              setSendOpen(true);
                            }}
                            title="Send"
                          >
                            <IconMail size={16} />
                          </Button>
                          {canUpdate && (
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => {
                                setEditing(c);
                                setDialogOpen(true);
                              }}
                              title="Edit"
                            >
                              <IconEdit size={16} />
                            </Button>
                          )}
                          {canDelete && (
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => onDelete(c._id)}
                              title="Delete"
                            >
                              <IconTrash size={16} className="text-red-500" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <CouponFormDialog
        open={dialogOpen}
        onClose={() => {
          setDialogOpen(false);
          setEditing(null);
        }}
        coupon={editing}
        onSaved={() => {
          setDialogOpen(false);
          setEditing(null);
          loadCoupons();
        }}
      />

      <CouponSendDialog
        open={sendOpen}
        coupon={sendCoupon}
        onClose={() => {
          setSendOpen(false);
          setSendCoupon(null);
        }}
        onSent={() => {
          setSendOpen(false);
          setSendCoupon(null);
        }}
      />
    </>
  );
}
