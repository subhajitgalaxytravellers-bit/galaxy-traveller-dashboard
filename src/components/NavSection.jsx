import { getIconComponent } from "@/lib/getIconComponent";
import { NavItem } from "./NavItem";

function normalize(items) {
  return items.map((it) => ({
    label: it.title ?? it.name ?? "",
    url: it.url ?? it.to ?? "#",
    icon: it.icon,
  }));
}

export function NavSection({ title, items, collapsed = false }) {
  const data = normalize(items || []);
  if (!data.length) return null;

  return (
    <div className={collapsed ? "mb-4" : "mb-6"}>
      {!collapsed && (
        <span className="px-3 mb-2 text-[.7rem] font-semibold uppercase tracking-wider text-gray-500">
          {title}
        </span>
      )}
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
    </div>
  );
}
