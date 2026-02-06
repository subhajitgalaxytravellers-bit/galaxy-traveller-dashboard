import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  IconEye,
  IconChecks,
  IconX,
  IconDotsVertical,
  IconPencil,
  IconTrash,
  IconCopyCheck,
} from "@tabler/icons-react";
import { ConfirmationDialog } from "./dialogs/ConfirmationDialog";
import { usePermissions } from "@/hooks/use-permissions";

/* -------------------------------------------------------------------------- */
/*                              Main Component                                */
/* -------------------------------------------------------------------------- */
export default function DataTable({
  model,
  columns = [],
  data = [],
  storageKey = "datatable:default",
  defaultVisible,
  rightActions = null,
  leftActions = null,
  rowKey = (row, i) => row.id ?? i,
  className = "",
  emptyMessage = "No data.",
  maxBodyHeight,
  minVisible = 1,
  onLoadMore,
  hasNextPage,
  isFetchingNextPage,
  onEdit,
  onDelete,
  onDuplicate,
  onRowClick,
}) {
  const { can } = usePermissions();

  /* ------------------------------- Column state ------------------------------ */
  const lockedKeys = React.useMemo(
    () => columns.filter((c) => c.hideable === false).map((c) => c.key),
    [columns]
  );
  const allKeys = React.useMemo(() => columns.map((c) => c.key), [columns]);

  const initialVisible = React.useMemo(() => {
    const saved = safeParse(localStorage.getItem(storageKey));
    let vis =
      saved ??
      defaultVisible ??
      Object.fromEntries(allKeys.map((k) => [k, true]));

    for (const k of allKeys) if (vis[k] === undefined) vis[k] = true;
    for (const k of lockedKeys) vis[k] = true;

    // ensure minimum visible columns
    if (countVisible(vis, columns) < Math.max(minVisible, lockedKeys.length)) {
      const need =
        Math.max(minVisible, lockedKeys.length) - countVisible(vis, columns);
      let turnedOn = 0;
      for (const c of columns) {
        if (vis[c.key]) continue;
        if (c.hideable === false) continue;
        vis[c.key] = true;
        if (++turnedOn >= need) break;
      }
    }
    return vis;
  }, [columns, allKeys, lockedKeys, defaultVisible, storageKey, minVisible]);

  const [visible, setVisible] = React.useState(initialVisible);

  React.useEffect(() => {
    const v = { ...visible };
    for (const k of lockedKeys) v[k] = true;
    localStorage.setItem(storageKey, JSON.stringify(v));
  }, [visible, storageKey, lockedKeys]);

  const activeCols = React.useMemo(
    () => columns.filter((c) => c.hideable === false || visible[c.key]),
    [columns, visible]
  );

  /* ----------------------------- Column toggles ----------------------------- */
  const canHide = React.useCallback(
    (key) => {
      const col = columns.find((c) => c.key === key);
      if (!col) return false;
      if (col.hideable === false) return false;
      const current = countVisible(visible, columns);
      const next = current - (visible[key] ? 1 : 0);
      const minReq = Math.max(minVisible, lockedKeys.length);
      return next >= minReq;
    },
    [columns, visible, lockedKeys, minVisible]
  );

  const toggleCol = React.useCallback(
    (key) => {
      const col = columns.find((c) => c.key === key);
      if (!col) return;
      if (col.hideable === false) return;
      if (visible[key] && !canHide(key)) return;
      setVisible((v) => ({ ...v, [key]: !v[key] }));
    },
    [columns, visible, canHide]
  );

  const setAll = React.useCallback(
    (val) => {
      const v = { ...visible };
      for (const c of columns) {
        v[c.key] = c.hideable === false ? true : !!val;
      }
      if (countVisible(v, columns) < Math.max(minVisible, lockedKeys.length)) {
        for (const c of columns) {
          if (
            countVisible(v, columns) >= Math.max(minVisible, lockedKeys.length)
          )
            break;
          if (c.hideable === false) continue;
          v[c.key] = true;
        }
      }
      setVisible(v);
    },
    [columns, lockedKeys, minVisible, visible]
  );

  /* ----------------------------- Delete handling ---------------------------- */
  const [open, setOpen] = React.useState(false);
  const [deleteItem, setDeleteItem] = React.useState(null);
  const handleDeleteClick = React.useCallback((row) => {
    setDeleteItem(row);
    setOpen(true);
  }, []);

  /* ---------------------------- Infinite scroll ----------------------------- */
  const loadMoreRef = React.useRef();
  const scrollContainerRef = React.useRef();

  React.useEffect(() => {
    if (!onLoadMore || !hasNextPage) return;
    const el = loadMoreRef.current;
    const container = scrollContainerRef.current;
    if (!el || !container) return;

    let ticking = false;
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting && !ticking) {
          ticking = true;
          onLoadMore()
            .catch(() => {})
            .finally(() => (ticking = false));
        }
      },
      {
        root: container,
        rootMargin: "150px",
        threshold: 0.1,
      }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [onLoadMore, hasNextPage]);

  /* ------------------------------ Render table ------------------------------ */
  const RenderRow = React.useCallback(
    ({ row, i }) => (
      <tr
        key={rowKey(row, i)}
        className="border-top border-gray-100 dark:border-gray-800 hover:bg-gray-50/60 dark:hover:bg-gray-800/50 transition-colors"
        onClick={() => onRowClick?.(row)}
        role={onRowClick ? 'button' : undefined}
        style={onRowClick ? { cursor: 'pointer' } : undefined}
      >
        {activeCols.map((col) => {
          if (
            col.key === "__actions" &&
            (can(model, "update") || can(model, "delete"))
          ) {
            return (
              <td key={col.key} className="px-3 py-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <IconDotsVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="w-40 border border-gray-300 dark:border-gray-600"
                  >
                    {can(model, "update") && (
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          onEdit?.(row);
                        }}
                        className="gap-2"
                      >
                        <IconPencil className="h-4 w-4" /> Edit
                      </DropdownMenuItem>
                    )}
                    {can(model, "create") && model !== "months" && (
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          onDuplicate?.(row);
                        }}
                        className="gap-2"
                      >
                        <IconCopyCheck className="h-4 w-4" /> Duplicate
                      </DropdownMenuItem>
                    )}
                    {can(model, "delete") && (
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteClick(row);
                        }}
                        className="gap-2 text-rose-600 focus:text-rose-600"
                      >
                        <IconTrash className="h-4 w-4" /> Delete
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </td>
            );
          }

          const value =
            typeof col.cell === "function"
              ? col.cell(row)
              : typeof col.accessor === "function"
              ? col.accessor(row)
              : row[col.key];

          return (
            <td
              key={col.key}
              className="px-3 py-2 text-gray-800 dark:text-gray-100 max-w-[20rem] truncate overflow-hidden whitespace-nowrap"
            >
              {value}
            </td>
          );
        })}
      </tr>
    ),
    [activeCols, can, handleDeleteClick, model, onEdit, rowKey]
  );

  /* ------------------------------- Component UI ------------------------------ */
  return (
    <div className={["w-full", className].join(" ")}>
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        {leftActions}
        <div className="flex items-center gap-2">
          {rightActions}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="gap-2 dark:border-gray-600 border border-gray-300"
              >
                <IconEye className="h-4 w-4" />
                View
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-56 dark:border-gray-600 border border-gray-300"
            >
              <DropdownMenuLabel>Toggle Columns</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <div className="px-2 py-1.5 flex items-center gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  className="gap-1"
                  onClick={() => setAll(true)}
                >
                  <IconChecks className="h-4 w-4" /> Show all
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="gap-1"
                  onClick={() => setAll(false)}
                >
                  <IconX className="h-4 w-4" /> Hide all
                </Button>
              </div>
              <DropdownMenuSeparator />
              {columns.map((col) => (
                <DropdownMenuCheckboxItem
                  key={col.key}
                  checked={!!visible[col.key] || col.hideable === false}
                  onCheckedChange={() => toggleCol(col.key)}
                  disabled={
                    col.hideable === false ||
                    (!canHide(col.key) && visible[col.key])
                  }
                  className="capitalize"
                >
                  {col.label}
                  {col.hideable === false && (
                    <span className="ml-1 text-xs text-gray-400">(locked)</span>
                  )}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-sm border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
        <div
          ref={scrollContainerRef}
          className={[
            "overflow-x-auto overflow-y-auto custom-x-scroll custom-y-scroll",
            maxBodyHeight ? "" : "",
          ].join(" ")}
          style={maxBodyHeight ? { maxHeight: maxBodyHeight } : undefined}
        >
          {activeCols.length > 0 ? (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800/60">
                <tr>
                  {activeCols.map((col) => (
                    <th
                      key={col.key}
                      className={[
                        "px-3 py-2 min-w-[10rem] text-left font-semibold text-gray-700 dark:text-gray-200 capitalize",
                        col.thClass || "",
                      ].join(" ")}
                    >
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.length > 0 ? (
                  data.map((row, i) => (
                    <RenderRow key={rowKey(row, i)} row={row} i={i} />
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={activeCols.length}
                      className="px-4 py-8 text-center text-gray-500 dark:text-gray-400 max-w-[200px] truncate overflow-hidden whitespace-nowrap"
                    >
                      {emptyMessage}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          ) : (
            <div className="p-6 text-center text-sm text-gray-500 dark:text-gray-400">
              No columns selected. Use <b>View</b> to show some.
            </div>
          )}

          {/* Infinite scroll sentinel */}
          {hasNextPage && (
            <div
              ref={loadMoreRef}
              className="flex justify-center py-4 text-gray-500 dark:text-gray-400"
            >
              {isFetchingNextPage ? "Loading more..." : "Scroll to load more"}
            </div>
          )}
        </div>
      </div>

      {/* Delete confirmation */}
      <ConfirmationDialog
        open={open}
        onOpenChange={setOpen}
        title="Are you sure you want to delete?"
        description="This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={() => onDelete(deleteItem)}
      />
    </div>
  );
}

/* ------------------------------- Utilities ------------------------------- */
function safeParse(s) {
  try {
    return s ? JSON.parse(s) : null;
  } catch {
    return null;
  }
}

function countVisible(visible, columns) {
  return columns.reduce(
    (n, c) => n + (c.hideable === false || visible[c.key] ? 1 : 0),
    0
  );
}
