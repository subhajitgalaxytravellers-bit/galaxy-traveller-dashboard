import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import {
  IconDotsVertical,
  IconShieldLock,
  IconUsers,
  IconPencil,
  IconCopy,
  IconTrash,
} from "@tabler/icons-react";
import { ConfirmationDialog } from "../dialogs/ConfirmationDialog";
function RoleCard({
  role,
  onEdit,
  onDuplicate,
  onDelete,
  canEdit = false,
  canDelete = false,
}) {
  const [confirmAction, setConfirmAction] = useState(null);

  const canDeleteThis = !!canDelete && !role?.isSystem;
  const showEdit = !!canEdit;
  const showDuplicate = !!canEdit;
  const showMenu = showEdit || showDuplicate || canDeleteThis;

  const handleConfirm = () => {
    if (confirmAction === "duplicate") {
      onDuplicate?.();
    } else if (confirmAction === "delete") {
      onDelete?.();
    }
    setConfirmAction(null);
  };

  return (
    <>
      <div className="rounded-xl border border-transparent ring-1 ring-black/5 dark:ring-white/10 bg-white/70 dark:bg-gray-900/60 hover:shadow-sm transition">
        <div className="p-3">
          <div className="flex items-start gap-2">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <div className="text-sm font-semibold truncate">
                  {role.name}
                </div>
                {role.isSystem && (
                  <span
                    className="inline-flex items-center gap-1 text-[11px] px-1.5 py-0.5 rounded border border-black/5 dark:border-white/10"
                    title="System role"
                  >
                    <IconShieldLock className="h-3.5 w-3.5 opacity-70" />
                    System
                  </span>
                )}
              </div>
              <p className="mt-1 text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                {role.description || "—"}
              </p>
              <div className="mt-2 inline-flex items-center gap-1 text-[11px] text-gray-500">
                <IconUsers className="h-3.5 w-3.5" />
                <span>{role.userCount ?? 0} users</span>
              </div>
            </div>

            {showMenu && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                    aria-label="Open menu"
                  >
                    <IconDotsVertical className="h-4 w-4" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="min-w-[160px]">
                  {showEdit && (
                    <DropdownMenuItem onClick={onEdit} className="gap-2">
                      <IconPencil className="h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                  )}
                  {showDuplicate && (
                    <DropdownMenuItem
                      onClick={() => setConfirmAction("duplicate")}
                      className="gap-2"
                    >
                      <IconCopy className="h-4 w-4" />
                      Duplicate
                    </DropdownMenuItem>
                  )}
                  {canDeleteThis && (
                    <DropdownMenuItem
                      onClick={() => setConfirmAction("delete")}
                      className="gap-2 text-red-600 focus:text-red-600"
                    >
                      <IconTrash className="h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </div>

      <ConfirmationDialog
        open={!!confirmAction}
        onOpenChange={(open) => !open && setConfirmAction(null)}
        title={
          confirmAction === "delete"
            ? "Delete this role?"
            : "Duplicate this role?"
        }
        description={
          confirmAction === "delete"
            ? "This role will be permanently removed. This action cannot be undone."
            : "A copy of this role will be created with the same permissions."
        }
        confirmText={confirmAction === "delete" ? "Delete" : "Duplicate"}
        onConfirm={handleConfirm}
      />
    </>
  );
}

export default RoleCard;
