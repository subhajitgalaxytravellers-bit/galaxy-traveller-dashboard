// src/components/SettingsSidebar.jsx
import { getIconComponent } from "@/lib/getIconComponent";
import React from "react";
import { NavLink } from "react-router-dom";

export default function SettingsSidebar({
  tabs = [],
  title = "Settings",
  className = "",
}) {
  return (
    <aside
      className={[
        "w-64 shrink-0 border-r bg-white dark:bg-gray-900",
        "min-h-[calc(100vh-0px)]", // keep full height in shells
        className,
      ].join(" ")}
    >
      {/* Header */}
      <div className="h-14 flex items-center px-5 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500">
          {title}
        </h2>
      </div>

      {/* Nav */}
      <nav className="p-3 space-y-2">
        {tabs.map(({ to, label, icon: icon }) => {
          const Icon = getIconComponent(icon);
          return (
            <NavLink key={to} to={to} end>
              {({ isActive }) => (
                <div
                  className={[
                    "relative group flex items-center gap-3 rounded-xl px-4 py-2.5",
                    "text-sm font-medium transition-all duration-200",
                    "outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40",
                    isActive
                      ? "bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-100 shadow-sm"
                      : "text-gray-700 hover:bg-gray-50 hover:shadow-sm hover:translate-x-[2px] dark:text-gray-300 dark:hover:bg-gray-800",
                  ].join(" ")}
                  aria-current={isActive ? "page" : undefined}
                >
                  {/* Left active indicator (like AppSidebar/NavItem) */}
                  <span
                    className={[
                      "absolute left-0 inset-y-0 my-auto h-4 w-1 rounded-full",
                      "bg-gradient-to-b from-indigo-500 to-purple-500",
                      "transition-opacity duration-200",
                      isActive
                        ? "opacity-100"
                        : "opacity-0 group-hover:opacity-40",
                    ].join(" ")}
                  />

                  {/* Icon bubble */}
                  <span
                    className={[
                      "grid place-items-center h-8 w-8 rounded-lg border",
                      "transition-all duration-200",
                      isActive
                        ? "bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600"
                        : "bg-gray-50 border-gray-200 dark:bg-gray-800 dark:border-gray-600 group-hover:bg-white dark:group-hover:bg-gray-700",
                    ].join(" ")}
                  >
                    {Icon ? (
                      <Icon
                        className={[
                          "h-4 w-4 transition-transform duration-200",
                          isActive ? "scale-105" : "group-hover:scale-105",
                        ].join(" ")}
                      />
                    ) : null}
                  </span>

                  {/* Label */}
                  <span className="flex-1 truncate">{label}</span>

                  {/* Chevron on hover */}
                  <svg
                    className="h-4 w-4 opacity-0 -translate-x-1 transition-all duration-200 group-hover:opacity-60 group-hover:translate-x-0"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 111.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              )}
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
}
