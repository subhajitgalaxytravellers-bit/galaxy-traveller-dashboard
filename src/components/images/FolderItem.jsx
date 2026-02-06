import React from "react";
import { IconFolders, IconChevronRight } from "@tabler/icons-react";

/**
 * FolderItem
 * - Modern, bordered card with subtle hover/press effects
 * - Theme-aware (dark mode supported)
 * - Adaptive width: min-w 12rem; grows to fill available space
 *
 * Props:
 *  - name: string
 *  - onClick: () => void
 *  - isActive?: boolean
 *  - subtitle?: string (optional small text under name)
 *  - className?: string
 */
export default function FolderItem({
  name,
  onClick,
  isActive = false,
  subtitle,
  className = "",
}) {
  return (
    <li className={`list-none ${className}`}>
      <button
        type="button"
        onClick={onClick}
        aria-label={`Open folder ${name}`}
        className={[
          // sizing & layout
          "group relative w-full min-w-[12rem] rounded-xl border px-4 py-3",
          "flex items-center gap-3 text-left",
          // theming
          "bg-white/80 backdrop-blur-sm dark:bg-gray-900/60",
          "border-gray-200 dark:border-gray-900",
          "text-gray-900 dark:text-gray-200",
          // interaction
          "transition-all duration-200 ease-out",
          "hover:shadow-sm hover:-translate-y-[1px]",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40",
          // active state
          isActive
            ? "ring-1 ring-indigo-400/60 border-indigo-300 dark:ring-indigo-500/40 dark:border-indigo-500/50 bg-indigo-50/40 dark:bg-indigo-900/20"
            : "hover:border-indigo-300/70 dark:hover:border-indigo-400/60",
        ].join(" ")}
      >
        {/* Icon bubble */}
        <span
          className={[
            "grid place-items-center h-10 w-10 shrink-0 rounded-lg border",
            "border-gray-200 bg-gray-50 dark:border-gray-900 dark:bg-gray-900",
            "transition-all duration-200",
            isActive
              ? "ring-1 ring-indigo-300/60 dark:ring-indigo-500/40 bg-white dark:bg-gray-900"
              : "group-hover:ring-1 group-hover:ring-indigo-200/70 dark:group-hover:ring-indigo-400/40",
          ].join(" ")}
        >
          <IconFolders
            className={[
              "h-5 w-5 transition-transform duration-200",
              isActive
                ? "scale-110 text-indigo-600 dark:text-indigo-400"
                : "text-gray-500 dark:text-gray-400 group-hover:scale-110",
            ].join(" ")}
          />
        </span>

        {/* Text block */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="truncate font-medium leading-6 capitalize">
              {name}
            </span>
            {/* Active pill */}
            {isActive && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300">
                active
              </span>
            )}
          </div>
          {subtitle ? (
            <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400 truncate">
              {subtitle}
            </p>
          ) : null}
        </div>

        {/* Chevron */}
        <IconChevronRight
          className="h-4 w-4 shrink-0 text-gray-400 dark:text-gray-500 opacity-0 -translate-x-1 transition-all duration-200 group-hover:opacity-80 group-hover:translate-x-0"
          aria-hidden="true"
        />

        {/* subtle gradient edge on hover */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 left-0 w-[3px] rounded-l-xl bg-gradient-to-b from-indigo-400/0 via-indigo-500/10 to-purple-500/0 opacity-0 transition-opacity duration-200 group-hover:opacity-100"
        />
      </button>
    </li>
  );
}
