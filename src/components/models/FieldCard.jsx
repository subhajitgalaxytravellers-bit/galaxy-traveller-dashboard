import {
  IconTrash as Trash2,
  IconArrowUp as MoveUp,
  IconArrowDown as MoveDown,
  IconAsterisk as Check,
  IconCircleDashed as X,
  IconPencil as Pencil,
} from "@tabler/icons-react";
export default function FieldCard({
  field, // { _uid, key, label, type, required, ... }
  index,
  canMoveUp,
  canMoveDown,
  onEdit, // () => void
  onRemove, // () => void
  onMoveUp, // () => void
  onMoveDown, // () => void
  editable = false,
}) {
  return (
    <div
      className="group relative rounded-xl border border-transparent ring-1 ring-black/5 dark:ring-white/10
           bg-white/70 dark:bg-gray-900/60 p-3 hover:shadow-sm transition
           backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:supports-[backdrop-filter]:bg-gray-900/60"
    >
      {/* Click area */}
      <button type="button" onClick={onEdit} className="w-full text-left">
        <div className="flex items-center justify-between">
          <div className="min-w-0">
            <div className="text-sm font-medium truncate">
              {field.label || field.key || "Untitled field"}
            </div>
            <div className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">
              {field.key || "no-key"}
            </div>
          </div>

          <span className="ml-3 shrink-0 inline-flex items-center gap-2">
            <span
              className="text-[11px] px-2 py-0.5 rounded-full border
                             border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900/60"
            >
              {field.type}
            </span>
            {!editable && (
              <span
                className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full
                           border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900/60"
                title="Read-only (enable Config to edit)"
              >
                <Pencil className="h-3.5 w-3.5 opacity-70" />
                View
              </span>
            )}
            <span
              title={field.required ? "Required" : "Not Required"}
              className={`inline-flex items-center justify-center h-5 w-5 rounded-full border
                         ${
                           field.required
                             ? "border-red-500 text-red-700"
                             : "border-zinc-300 dark:border-zinc-700 text-zinc-400"
                         }`}
            >
              {field.required ? (
                <Check className="h-3.5 w-3.5" />
              ) : (
                <X className="h-3.5 w-3.5" />
              )}
            </span>
          </span>
        </div>
      </button>

      {/* Row controls */}
      {editable && (
        <div className="mt-3 flex items-center gap-1">
          <IconBtn label="Move up" onClick={onMoveUp} disabled={!canMoveUp}>
            <MoveUp className="h-4 w-4" />
          </IconBtn>
          <IconBtn
            label="Move down"
            onClick={onMoveDown}
            disabled={!canMoveDown}
          >
            <MoveDown className="h-4 w-4" />
          </IconBtn>
          <IconBtn label="Edit" onClick={onEdit}>
            <Pencil className="h-4 w-4" />
          </IconBtn>
          <IconBtn label="Delete" onClick={onRemove} tone="danger">
            <Trash2 className="h-4 w-4" />
          </IconBtn>
          <div className="ml-auto text-[11px] text-zinc-400">#{index + 1}</div>
        </div>
      )}
    </div>
  );
}

function IconBtn({ children, label, onClick, disabled, tone = "default" }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={(e) => {
        e.stopPropagation?.();
        onClick?.();
      }}
      disabled={disabled}
      className={[
        "p-1.5 rounded-md border transition",
        "bg-white/70 dark:bg-zinc-900/50",
        "border-zinc-200 dark:border-zinc-800",
        "hover:bg-zinc-50 dark:hover:bg-zinc-800",
        "disabled:opacity-40 disabled:cursor-not-allowed",
        tone === "danger" ? "hover:border-red-500 hover:text-red-600" : "",
      ].join(" ")}
    >
      {children}
    </button>
  );
}
