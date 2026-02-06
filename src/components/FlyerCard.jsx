import React from "react";
import { usePermissions } from "@/hooks/use-permissions";
import { Pencil, Trash2, MoreVertical } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu"; // adjust path if needed
import { IconCopyPlus } from "@tabler/icons-react";

export default function FlyerCard({ flyer, onEdit, onDelete, onDuplicate }) {
  const { can } = usePermissions();
  const canEdit = can("flyers", "update");
  const canDelete = can("flyers", "delete");
  const canCreate = can("flyers", "create"); // used for duplicate

  const hasActions = canEdit || canDelete || canCreate;

  const img =
    flyer?.image ||
    (flyer?.images && flyer.images.length > 0 && flyer.images[0]) ||
    "/images/placeholder.png";

  const isPublished = flyer?.status === "published" || flyer?.status === true;

  return (
    <div className="relative group max-w-[12rem] rounded-lg overflow-hidden shadow-md bg-white dark:bg-gray-800">
      {/* Image */}
      <div className="w-full h-56 bg-gray-100">
        <img
          src={img}
          alt={flyer?.title || "Flyer"}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Status Dot */}
      <div
        className={`w-2 h-2 rounded-full absolute top-2 left-2 ${
          isPublished ? "bg-green-500" : "bg-red-500"
        }`}
      />

      {/* Options Dropdown */}
      {hasActions && (
        <div className="absolute top-2 right-2 z-10">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              {/* native button avoids ref-forwarding issues */}
              <button
                onClick={(e) => {
                  e.preventDefault();
                }}
                type="button"
                aria-label="Open menu"
                className="p-2 rounded-full bg-white/90 dark:bg-gray-900/40 shadow hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <MoreVertical size={16} />
              </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent
              align="end"
              className="min-w-[160px] border border-gray-200 dark:border-gray-700"
            >
              {canEdit && (
                <DropdownMenuItem
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onEdit?.(flyer._id);
                  }}
                  className="flex items-center gap-2"
                >
                  <Pencil className="h-4 w-4" />
                  <span>Edit</span>
                </DropdownMenuItem>
              )}

              {canCreate && (
                <DropdownMenuItem
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onDuplicate?.(flyer._id);
                  }}
                  className="flex items-center gap-2"
                >
                  <IconCopyPlus className="h-4 w-4" />
                  <span>Duplicate</span>
                </DropdownMenuItem>
              )}

              {canDelete && (
                <DropdownMenuItem
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onDelete?.(flyer._id);
                  }}
                  className="flex items-center gap-2 text-red-600 focus:text-red-600"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>Delete</span>
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex flex-col justify-end p-4 text-white">
        <h3 className="text-lg font-semibold">{flyer?.title}</h3>
        <p className="text-sm line-clamp-2">{flyer?.description}</p>
      </div>
    </div>
  );
}
