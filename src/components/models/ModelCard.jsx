import { Card } from "../ui/card";
import { Badge } from "../ui/badge";

// src/components/ModelCard.jsx
import React from "react";
import { getIconComponent } from "@/lib/getIconComponent"; // maps "Folder" -> IconFolder, etc.
import { IconCalendar, IconFileText, IconFolder } from "@tabler/icons-react";

function cx(...c) {
  return c.filter(Boolean).join(" ");
}

function inferType(model) {
  // Support both "collectionType" and "singleton" flags
  if (typeof model?.singleton === "boolean") {
    return model.singleton ? "Singleton" : "Collection";
  }
  const t = model?.collectionType || model?.type;
  return t || "Unknown";
}

function inferIconName(model) {
  // Prefer backend-provided icon
  if (model?.ui?.icon) return model.ui.icon;
  // Fallback by type
  const t = inferType(model).toLowerCase();
  if (t === "collection") return "Folder";
  if (t === "singleton") return "FileText";
  return "Folder";
}

export default function ModelCard({
  model, // { key, name, createdAt, collectionType/singleton, ui?:{icon} }
  active = false,
  onClick = () => {},
  className = "",
}) {
  const created = model?.createdAt
    ? new Date(model.createdAt).toLocaleString()
    : "—";
  const type = inferType(model);

  // Primary icon for the model (Tabler component)
  const Icon = getIconComponent(inferIconName(model));
  // Small chip icon by type
  const TypeIcon = type === "Collection" ? "IconFolder" : "IconFileText";

  return (
    <Card
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
      aria-pressed={active}
      aria-current={active ? "true" : undefined}
      className={cx(
        // match RoleCard look/feel
        "rounded-xl border border-transparent ring-1 mb-3 ring-black/5 dark:ring-white/10",
        "bg-white/70 dark:bg-gray-900/60 hover:shadow-sm transition",
        // padding to match RoleCard
        "p-3",
        // keep active state accent
        active && "ring-2 ring-indigo-500/30",
        className
      )}
    >
      {/* Top gradient accent (distinct from NavItem’s left bar) */}

      <div className="flex items-start gap-4">
        {/* Icon tile with soft halo */}
        <span
          className={cx(
            "relative grid place-items-center h-11 w-11 shrink-0 rounded-xl border",
            "bg-gradient-to-br from-gray-50 to-white dark:from-gray-800 dark:to-gray-700",
            "border-gray-200 dark:border-gray-700",
            "shadow-[inset_0_1px_0_rgba(255,255,255,0.5)] dark:shadow-[inset_0_1px_0_rgba(0,0,0,0.2)]"
          )}
        >
          <Icon
            className={cx(
              "h-5 w-5 transition-transform duration-200",
              active
                ? "scale-[1.06] border-indigo-300 text-indigo-700 dark:border-indigo-800 dark:text-indigo-300"
                : "group-hover:scale-[1.06]"
            )}
          />
          {/* subtle halo ring */}
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 rounded-xl ring-1 ring-black/5 dark:ring-white/5"
          />
        </span>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">
                {model?.name || "Untitled"}
              </div>
              <div className="truncate text-xs text-gray-500 dark:text-gray-400">
                {model?.key || "—"}
              </div>
            </div>

            {/* Type chip (with Tabler icon) */}
            <Badge
              variant="outline"
              className={cx(
                "shrink-0 pl-1.5 pr-2 py-0.5 gap-1 flex items-center",
                active &&
                  "border-indigo-300 text-indigo-700 dark:border-indigo-800 dark:text-indigo-300"
              )}
            >
              <span className="text-[11px] leading-none">{type}</span>
            </Badge>
          </div>

          {/* Meta line */}
          {/* <div className="mt-2 flex items-center gap-2 text-[11px] text-gray-500 dark:text-gray-400">
            <IconCalendar className="h-3.5 w-3.5 opacity-70" />
            <span className="truncate">Created: {created}</span>
          </div> */}
        </div>
      </div>
    </Card>
  );
}
