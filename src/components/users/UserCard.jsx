import { Avatar, AvatarImage, AvatarFallback } from "../ui/avatar";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "../ui/dropdown-menu";
import { IconDotsVertical, IconPencil, IconTrash } from "@tabler/icons-react";

function avatarFallback(name = "") {
  const parts = String(name).trim().split(/\s+/);
  const first = parts[0]?.[0] || "";
  const second = parts[1]?.[0] || "";
  return (first + second || "U").toUpperCase();
}
function RolePill({ role }) {
  const map = {
    admin: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
    creator:
      "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300",
    client:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  };
  const cls =
    map[String(role).toLowerCase()] ||
    "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300";
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${cls}`}
    >
      {role}
    </span>
  );
}

// --- card ---
export default function UserCard({
  user,
  roleText,
  onEdit,
  onDelete,
  canEdit,
  canDelete,
}) {
  return (
    <div className="rounded-xl border border-transparent ring-1 ring-black/5 dark:ring-white/10 bg-white/70 dark:bg-gray-900/60 hover:shadow-sm transition">
      <div className="p-3">
        <div className="flex items-start gap-3">
          {/* avatar */}
          <div className="h-10 w-10 rounded-full ring-1 ring-black/5 dark:ring-white/10 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 grid place-items-center overflow-hidden">
            <Avatar className="w-10 h-10 ring-2 rounded-md ring-gray-200 dark:ring-gray-700">
              <AvatarImage
                className="w-10 h-10 rounded-md"
                src={user.profileImg || undefined}
                alt={user.name || "Avatar"}
              />
              <AvatarFallback className="bg-gray-100 dark:bg-gray-800 rounded-md text-gray-700 dark:text-gray-300 font-medium">
                {avatarFallback(user.name)}
              </AvatarFallback>
            </Avatar>
          </div>

          {/* user info */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <div className="text-sm font-semibold truncate">
                {user.name || "—"}
              </div>
              {["admin", "creator", "client"].includes(
                String(roleText).toLowerCase()
              ) ? (
                <RolePill role={roleText} />
              ) : (
                <span className="text-[11px] px-1.5 py-0.5 rounded border border-black/5 dark:border-white/10 text-gray-600 dark:text-gray-300">
                  {roleText}
                </span>
              )}
            </div>
            <div className="mt-0.5 text-xs text-gray-600 dark:text-gray-400 truncate">
              {user.email}
            </div>
          </div>

          {/* menu */}
          {(canEdit || canDelete) && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                  aria-label="Open menu"
                >
                  <IconDotsVertical className="h-4 w-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="min-w-[160px] border border-gray-200 dark:border-gray-700"
              >
                {canEdit && (
                  <DropdownMenuItem onClick={onEdit} className="gap-2">
                    <IconPencil className="h-4 w-4" />
                    Edit
                  </DropdownMenuItem>
                )}
                {canDelete && (
                  <DropdownMenuItem
                    onClick={onDelete}
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
  );
}
