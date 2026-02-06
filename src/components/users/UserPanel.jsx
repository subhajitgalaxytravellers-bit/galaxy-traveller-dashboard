import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { Input } from "../ui/input";
import { IconSearch, IconPlus } from "@tabler/icons-react";
import CreateUserDialog from "./CreateUserDialog";
import PermButton from "../guard/PermButton";
import { usePermissions } from "@/hooks/use-permissions";
import { toast } from "react-toastify";
import { ConfirmationDialog } from "../dialogs/ConfirmationDialog";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useInView } from "react-intersection-observer";
import UserCard from "./UserCard";

// --- helpers ---
function roleDisplayName(user, rolesById) {
  return user.roleName || rolesById.get(user.roleId)?.name || "—";
}

// --- panel ---
export default function UserPanel() {
  const qc = useQueryClient();
  // const navigate = useNavigate();
  const { can } = usePermissions();
  const [editingUser, setEditingUser] = React.useState(null);
  const [confirmUser, setConfirmUser] = React.useState(null);
  const { ref, inView } = useInView();

  const fetchUsers = async ({ pageParam = 1, queryKey }) => {
    const [_key, { q, status }] = queryKey;
    const { data } = await api().get("/api/users/moderation", {
      params: { page: pageParam, limit: 20, q, status },
    });
    return data;
  };

  function asUserArray(payload) {
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.data)) return payload.data;
    if (Array.isArray(payload?.items)) return payload.items;
    if (Array.isArray(payload?.results)) return payload.results;
    if (Array.isArray(payload?.users)) return payload.users;
    return [];
  }

  const { data: roles = [] } = useQuery({
    queryKey: ["roles", "for-user-dialog"],
    queryFn: async () => {
      const { data } = await api().get("/api/roles");
      return data || [];
    },
    staleTime: 10 * 60 * 1000,
  });

  const [q, setQ] = React.useState("");
  const [openCreate, setOpenCreate] = React.useState(false);

  const { data, isLoading, isFetchingNextPage, fetchNextPage, hasNextPage } =
    useInfiniteQuery({
      queryKey: ["users", { q, status }],
      queryFn: fetchUsers,
      getNextPageParam: (lastPage, allPages) => {
        const loaded = allPages.flatMap((p) => p.items).length;
        return loaded < lastPage.total ? lastPage.page + 1 : undefined;
      },
    });

  React.useEffect(() => {
    if (inView && hasNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, fetchNextPage]);

  const users = data?.pages.flatMap((p) => p.items) || [];

  const rolesById = React.useMemo(() => {
    const m = new Map();
    roles.forEach((r) => m.set(String(r._id || r.id), r));
    return m;
  }, [roles]);

  const filtered = React.useMemo(() => {
    const base = Array.isArray(users) ? users : asUserArray(users);
    const needle = q.trim().toLowerCase();
    if (!needle) return base;
    return base.filter((u) =>
      [u.name, u.email, rolesById.get(String(u.roleId))?.name]
        .filter(Boolean)
        .some((s) => String(s).toLowerCase().includes(needle))
    );
  }, [users, q, rolesById]);

  const del = useMutation({
    mutationFn: async (user) => {
      await api().delete(`/api/users/${user._id || user.id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["users"] });
      toast.success("User deleted successfully");
    },
  });

  const handleDelete = (u) => {
    if (!can("users", "delete")) {
      toast.error(`You don’t have permission to delete users.`);
      return;
    }
    setConfirmUser(u); // open dialog for this user
  };

  return (
    <div className="p-4 md:p-6">
      <div className="rounded-2xl border border-transparent ring-1 ring-black/5 dark:ring-white/10 bg-white/70 dark:bg-gray-900/60 backdrop-blur-sm">
        {/* top bar */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-black/5 dark:border-white/10">
          <div className="text-base font-semibold">Users</div>
          <div className="ml-auto flex items-center gap-2">
            <div className="relative">
              <IconSearch className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 opacity-60" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search users…"
                className="pl-8 w-56"
              />
            </div>
            <PermButton
              model="users"
              action="create"
              onClick={() => setOpenCreate(true)}
              className="gap-1"
            >
              <IconPlus className="h-4 w-4" />
              New
            </PermButton>
          </div>
        </div>

        {/* grid */}
        <div className="p-4">
          {isLoading ? (
            <div className="text-sm text-muted-foreground">Loading users…</div>
          ) : filtered.length === 0 ? (
            <div className="text-sm text-muted-foreground">No users found.</div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                {filtered.map((u) => (
                  <UserCard
                    key={u._id || u.id || u.email}
                    user={u}
                    roleText={roleDisplayName(u, rolesById)}
                    canEdit={can("users", "update")}
                    canDelete={can("users", "delete")}
                    onEdit={() => {
                      if (!can("users", "update")) {
                        toast.error(`You don’t have permission to edit users.`);
                        return;
                      }
                      setEditingUser(u); // set selected user
                      setOpenCreate(true); // open dialog
                    }}
                    onDelete={() => handleDelete(u)}
                  />
                ))}
              </div>
              <div ref={ref} className="h-10 flex items-center justify-center">
                {isFetchingNextPage && <span>Loading more…</span>}
              </div>
            </>
          )}
        </div>
      </div>

      <CreateUserDialog
        open={openCreate}
        onOpenChange={(open) => {
          setOpenCreate(open);
          if (!open) setEditingUser(null); // reset on close
        }}
        user={editingUser}
        roles={roles}
        onCreated={() => qc.invalidateQueries({ queryKey: ["users"] })}
        onEdited={() => qc.invalidateQueries({ queryKey: ["users"] })}
      />

      {confirmUser && (
        <ConfirmationDialog
          open={!!confirmUser}
          onOpenChange={(open) => !open && setConfirmUser(null)}
          title="Delete user"
          message={`Are you sure you want to delete user “${confirmUser.name}”?`}
          onConfirm={() => {
            del.mutate(confirmUser);
            setConfirmUser(null);
          }}
          onCancel={() => setConfirmUser(null)}
        />
      )}
    </div>
  );
}
