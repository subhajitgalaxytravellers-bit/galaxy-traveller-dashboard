import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "../ui/dropdown-menu";
import { Input } from "../ui/input";
import {
  IconDotsVertical,
  IconUsers,
  IconShieldLock,
  IconPlus,
  IconCopy,
  IconPencil,
  IconTrash,
  IconSearch,
} from "@tabler/icons-react";
import api from "@/lib/api";
import { usePermissions } from "@/hooks/use-permissions";
import RoleCard from "./RoleCard";
import { toast } from "react-toastify";

export default function RolePanel() {
  const navigate = useNavigate();
  const [roles, setRoles] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [q, setQ] = React.useState("");
  const { can } = usePermissions();

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const { data } = await api().get("/api/roles", {
          params: { withCounts: 1 },
        });
        if (mounted) setRoles(data || []);
      } catch (e) {
        console.error(e);
        toast.error("Failed to load roles");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const filtered = React.useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return roles;
    return roles.filter((r) =>
      [r.name, r.description]
        .filter(Boolean)
        .some((s) => s.toLowerCase().includes(needle))
    );
  }, [roles, q]);

  const handleEdit = (role) => {
    if (!can("roles", "update")) {
      toast.error("You don’t have permission to update roles.");
      return;
    }
    navigate(`/roles/${role._id}/edit`);
  };

  const handleDuplicate = async (role) => {
    if (!can("roles", "create")) {
      toast.error("You don’t have permission to create roles.");
      return;
    }
    try {
      const { data: newRole } = await api().post(
        `/api/roles/${role._id}/duplicate`
      );
      setRoles((prev) => [newRole, ...prev]);
    } catch (e) {
      toast.error(e.message || "Failed to duplicate role");
    }
  };

  const handleDelete = async (role) => {
    if (!can("roles", "delete")) {
      toast.error("You don’t have permission to delete roles.");
      return;
    }

    try {
      await api().delete(`/api/roles/${role._id}`);
      setRoles((prev) => prev.filter((r) => r._id !== role._id));
    } catch (e) {
      toast.error(e.message || "Failed to delete role");
    }
  };

  return (
    <div className="p-4 md:p-6">
      <div className="rounded-2xl border border-transparent ring-1 ring-black/5 dark:ring-white/10 bg-white/70 dark:bg-gray-900/60 backdrop-blur-sm">
        {/* Top bar */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-black/5 dark:border-white/10">
          <div className="text-base font-semibold">Roles</div>
          <div className="ml-auto flex items-center gap-2">
            <div className="relative">
              <IconSearch className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 opacity-60" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search roles…"
                className="pl-8 w-56"
              />
            </div>
            {can("roles", "create") && (
              <Button onClick={() => navigate("/roles/new")} className="gap-1">
                <IconPlus className="h-4 w-4" />
                New
              </Button>
            )}
          </div>
        </div>

        {/* Grid */}
        <div className="p-4">
          {
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
              {loading
                ? Array.from({ length: 6 }).map((_, i) => (
                    <RoleCardSkeleton key={i} />
                  ))
                : filtered.map((role) => (
                    <RoleCard
                      key={role._id}
                      role={role}
                      onEdit={() => handleEdit(role)}
                      onDuplicate={() => handleDuplicate(role)}
                      onDelete={() => handleDelete(role)}
                      canEdit={can("roles", "update")}
                      canDelete={can("roles", "delete")}
                    />
                  ))}
            </div>
          }
        </div>
      </div>
    </div>
  );
}

function RoleCardSkeleton() {
  return (
    <div className="rounded-xl border border-transparent ring-1 ring-black/5 dark:ring-white/10 bg-white/70 dark:bg-gray-900/60 animate-pulse">
      <div className="p-3 flex flex-col gap-2">
        {/* Name */}

        <div className="h-4 w-3/4 bg-gray-300 dark:bg-gray-700 rounded"></div>

        {/* Description */}
        <div className="h-3 w-full bg-gray-200 dark:bg-gray-600 rounded mt-1"></div>

        {/* User count */}
        <div className="mt-2 h-3 w-1/4 bg-gray-300 dark:bg-gray-700 rounded"></div>
      </div>
    </div>
  );
}
