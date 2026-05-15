import { useState } from "react";
import { getIconComponent } from "@/lib/getIconComponent";
import { NavItem } from "./NavItem";
import { IconChevronDown, IconChevronRight } from "@tabler/icons-react";

function normalize(items) {
  return items.map((it) => ({
    label: it.title ?? it.name ?? "",
    url: it.url ?? it.to ?? "#",
    icon: it.icon,
  }));
}

export function NavSection({ title, items, collapsed = false, isCollapsible = false }) {
  const [isExpanded, setIsExpanded] = useState(!isCollapsible);
  const data = normalize(items || []);
  if (!data.length) return null;

  return (
    <div className={collapsed ? "mb-4" : "mb-6"}>
      {!collapsed && (
        <div 
          className={`flex items-center justify-between px-3 mb-2 ${isCollapsible ? "cursor-pointer hover:text-gray-800 dark:hover:text-gray-200" : ""}`}
          onClick={() => isCollapsible && setIsExpanded(!isExpanded)}
        >
          <span className="text-[.7rem] font-semibold uppercase tracking-wider text-gray-500 transition-colors">
            {title}
          </span>
          {isCollapsible && (
            <span className="text-gray-400">
              {isExpanded ? <IconChevronDown size={14} /> : <IconChevronRight size={14} />}
            </span>
          )}
        </div>
      )}
      
      {(!collapsed && isExpanded) || collapsed ? (
        <ul className="space-y-1">
          {data.map((item) => (
            <NavItem
              key={item.url}
              to={item.url}
              icon={getIconComponent(item.icon || "Folder")}
              label={item.label}
            />
          ))}
        </ul>
      ) : null}
    </div>
  );
}
