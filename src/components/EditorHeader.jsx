// components/editor/EditorHeader.jsx
import * as React from "react";
import { Button } from "@/components/ui/button";
import { IconRocket, IconChevronLeft } from "@tabler/icons-react";

export default function EditorHeader({
  title, // string | ReactNode
  status = "draft", // 'draft' | 'published'
  onBack, // () => void
  backAriaLabel = "Go back",
  onEdit, // () => void (for default config button)
  editButton = null, // ReactNode (custom button if provided)
  className = "",
}) {
  return (
    <header
      className={[
        "flex h-16 items-center justify-between",
        "border-b border-gray-200 bg-white px-4 md:px-6",
        "dark:border-gray-800 dark:bg-gray-900",
        className,
      ].join(" ")}
    >
      {/* Left Section */}
      <div className="flex items-center gap-3">
        {onBack && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onBack}
            aria-label={backAriaLabel}
            className="mr-1"
          >
            <IconChevronLeft className="h-5 w-5 text-gray-700 dark:text-gray-300" />
          </Button>
        )}
        <StatusBadge status={status} />
        {typeof title === "string" ? (
          <h1 className="text-lg font-semibold tracking-tight text-gray-900 dark:text-gray-100 capitalize">
            {title}
          </h1>
        ) : (
          title
        )}
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-2">
        {editButton ? (
          editButton
        ) : onEdit ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onEdit}
            aria-label="Edit settings"
          >
            <IconSettings className="h-5 w-5 text-gray-700 dark:text-gray-300" />
          </Button>
        ) : null}
      </div>
    </header>
  );
}
function StatusBadge({ status = "draft" }) {
  let cls, label;

  switch (status) {
    case "pending":
      cls =
        "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300";
      label = "Pending";
      break;

    case "partial":
      cls =
        "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300";
      label = "Partial";
      break;

    case "confirmed":
      cls =
        "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300";
      label = "Confirmed";
      break;

    case "paid":
      cls =
        "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300";
      label = "Paid";
      break;

    case "cancelled":
      cls =
        "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300";
      label = "Cancelled";
      break;

    case "published":
      cls =
        "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300";
      label = "Published";
      break;

    case "rejected":
      cls = "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300";
      label = "Rejected";
      break;

    case "draft":
    default:
      cls =
        "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300";
      label = "Draft";
      break;
  }

  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${cls}`}>
      {label}
    </span>
  );
}
