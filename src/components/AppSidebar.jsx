// components/AppSidebar.jsx
import * as React from "react";
import { NavLink } from "react-router-dom";
import { useSidebar } from "@/hooks/use-sidebar";
import { NavSection } from "@/components/NavSection";
import { NavUser } from "@/components/NavUser";

/**
 * Props:
 * - title: header text (e.g., "Galaxy Traveler" or "Settings")
 * - sections: Array<{ title: string, items: Array<{title, to, icon}> }>
 * - user: optional user object for footer (passed from layout)
 * - brandHref: optional href for header brand link (default "/"); pass null to render plain text
 */
export default function AppSidebar({
  title = "Galaxy Travel.",
  sections = [],
  user = null,
  brandHref = "/",
}) {
  const { open, closeSidebar, isMobile } = useSidebar();
  const collapsed = isMobile ? false : !open;

  React.useEffect(() => {
    if (!isMobile) return;
    document.body.style.overflow = open ? "hidden" : "";
    const onEsc = (e) => e.key === "Escape" && closeSidebar();
    if (open) document.addEventListener("keydown", onEsc);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", onEsc);
    };
  }, [isMobile, open, closeSidebar]);

  const asideClass = [
    "bg-white dark:bg-gray-900 h-screen border-r border-gray-200 dark:border-gray-700",
    isMobile
      ? "fixed inset-y-0 left-0 z-50 h-full w-64 flex flex-col min-h-0 transform transition-transform duration-300 ease-in-out shadow-xl"
      : "relative flex flex-col h-screen min-h-0 transition-all duration-300 ease-in-out",
    isMobile
      ? open
        ? "translate-x-0"
        : "-translate-x-full"
      : collapsed
      ? "w-0"
      : "w-64",
  ].join(" ");

  return (
    <>
      {isMobile && open && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[1px] md:hidden"
          onClick={closeSidebar}
        />
      )}

      <aside
        className={asideClass}
        role={isMobile ? "dialog" : undefined}
        aria-modal={isMobile ? true : undefined}
        aria-hidden={isMobile && !open ? true : undefined}
      >
        {/* Header */}
        <div
          className={`flex items-center h-16 ${
            collapsed ? "px-0" : "px-5"
          } border-b border-gray-200 dark:border-gray-700`}
        >
          {!collapsed && (
            <div className="text-lg font-bold text-gray-900 dark:text-gray-100 tracking-tight">
              {brandHref ? (
                <NavLink to={brandHref}>{title}</NavLink>
              ) : (
                <span>{title}</span>
              )}
            </div>
          )}
        </div>

        {/* Body */}
        <div
          className={`flex-1 overflow-y-auto overflow-x-hidden py-4 custom-y-scroll space-y-4 ${
            collapsed ? "px-0" : "px-2 md:px-4"
          }`}
        >
          {sections.map((section, idx) => (
            <NavSection
              key={`${section.title}-${idx}`}
              title={section.title}
              items={section.items || []}
              collapsed={collapsed}
            />
          ))}
        </div>

        {/* Footer */}
        {user && !collapsed && <NavUser user={user} />}
      </aside>
    </>
  );
}
