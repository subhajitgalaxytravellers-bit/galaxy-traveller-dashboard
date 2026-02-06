import { Button } from "@/components/ui/button";
import {
  IconLayoutSidebarLeftCollapse,
  IconPlus,
  IconLayoutSidebarLeftExpand,
} from "@tabler/icons-react";
import { useSidebar } from "../hooks/use-sidebar";
import PermButton from "./guard/PermButton";

export function Header({
  modelKey,
  title,
  right,
  onCreate,
  createLabel = "Create",
}) {
  const { toggle } = useSidebar();

  return (
    <header className="flex items-center justify-between min-h-16 h-16 px-5 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
      <div className="flex items-center gap-3">
        <button
          onClick={toggle}
          className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          aria-label={open ? "Collapse sidebar" : "Expand sidebar"}
          aria-expanded={open}
          title={open ? "Collapse" : "Expand"}
        >
          {open ? (
            <IconLayoutSidebarLeftCollapse className="h-5 w-5 text-gray-700 dark:text-gray-300" />
          ) : (
            <IconLayoutSidebarLeftExpand className="h-5 w-5 text-gray-700 dark:text-gray-300" />
          )}
        </button>
        <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100 tracking-tight capitalize">
          {title}
        </h1>
      </div>

      {right ??
        (onCreate && (
          <PermButton
            model={modelKey}
            action="create"
            onClick={onCreate}
            className="flex items-center px-3 py-2 gap-2 bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            <IconPlus className="h-4 w-4" />
            {createLabel}
          </PermButton>
        ))}
    </header>
  );
}
