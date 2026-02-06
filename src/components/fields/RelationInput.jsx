import * as React from "react";
import { Button } from "../ui/button";
import { Popover, PopoverTrigger, PopoverContent } from "../ui/popover";
import {
  IconChevronDown,
  IconSearch,
  IconArrowUp,
  IconArrowDown,
  IconX,
  IconPlus,
  IconLoader2,
} from "@tabler/icons-react";

function getOptionLabel(opt, nameKey) {
  if (!opt) return "";
  if (nameKey && opt[nameKey] != null) return String(opt[nameKey]);

  return String(
    opt.name ??
      opt.title ??
      opt.label ??
      opt.tag ??
      opt.monthTag ??
      opt.id ??
      opt._id ??
      ""
  );
}

// ✅ Normalize ID ONCE
function getOptionId(opt) {
  return opt?.id ?? opt?._id ?? null;
}

export default function RelationInput({
  multiple = false,
  value,
  onChange,
  label,
  placeholder = "Add relation for ",
  listMaxHeight = "12rem",
  disabled = false,
  pages,
  nameKey,
  getOptions,
  searchOptions,
  options,
  searchQuery,
  ...props
}) {
  const [open, setOpen] = React.useState(false);
  const [page, setPage] = React.useState(1);
  const [totalPages, setTotalPages] = React.useState(pages);
  const listRef = React.useRef(null);

  const [loading, setLoading] = React.useState(false);
  const [query, setQuery] = React.useState(searchQuery || "");

  // ✅ Normalize incoming value -> array of selected IDs
  const selectedIds = React.useMemo(() => {
    if (multiple) return Array.isArray(value) ? value.filter(Boolean) : [];
    return value ? [value] : [];
  }, [value, multiple]);

  React.useEffect(() => {
    if (pages) setTotalPages(pages);
  }, [pages]);

  // ✅ Fast lookup: id -> option  (FIXED: using getOptionId)
  const optionById = React.useMemo(() => {
    const m = new Map();
    for (const o of options || []) {
      const id = getOptionId(o);
      if (id) m.set(id, o);
    }
    return m;
  }, [options]);

  const isSelectedId = React.useCallback(
    (id) => selectedIds.includes(id),
    [selectedIds]
  );

  const handleScroll = (e) => {
    const el = e.currentTarget;
    if (
      el.scrollTop + el.clientHeight >= el.scrollHeight - 30 &&
      page < totalPages &&
      !loading
    ) {
      loadMoreData();
    }
  };

  const addId = (id) => {
    if (!onChange || !id) return;

    if (multiple) {
      if (isSelectedId(id)) return;
      onChange(label, [...selectedIds, id]);
    } else {
      onChange(label, id);
      setOpen(false);
    }
  };

  const removeIndex = (index) => {
    if (!onChange) return;

    if (multiple) {
      const next = selectedIds.slice();
      next.splice(index, 1);
      onChange(label, next.length > 0 ? next : null);
    } else {
      onChange(label, null);
    }
  };

  const move = (index, dir) => {
    if (!onChange || !multiple) return;

    const next = selectedIds.slice();
    const target = index + dir;

    if (target < 0 || target >= next.length) return;

    const [item] = next.splice(index, 1);
    next.splice(target, 0, item);
    onChange(label, next);
  };

  React.useEffect(() => {
    getOptions && getOptions();
  }, []);

  const loadMoreData = () => {
    if (loading || page >= totalPages) return;

    setLoading(true);
    const nextPage = page + 1;

    if (searchOptions) {
      searchOptions(query, { page: nextPage }).then((res) => {
        if (res?.totalPages) setTotalPages(res.totalPages);
        setPage(nextPage);
        setLoading(false);
      });
    }
  };

  const handleSearchChange = (e) => {
    const query = e.target.value;
    setQuery(query);

    if (searchOptions) {
      searchOptions(query, { page: 1 }).then((res) => {
        setPage(1);
        setTotalPages(res?.totalPages || 1);
      });
    }
  };

  return (
    <div className="w-full">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="secondary"
            disabled={disabled}
            className="w-full justify-between"
          >
            <span className="inline-flex items-center gap-2 text-gray-700 dark:text-gray-100">
              <IconSearch className="h-4 w-4" />
              {placeholder}
              {label}
            </span>
            <IconChevronDown className="h-4 w-4 opacity-70" />
          </Button>
        </PopoverTrigger>

        <PopoverContent
          className="p-0 border border-gray-100 dark:border-gray-600 w-[min(28rem,90vw)]"
          align="start"
        >
          <input
            type="text"
            placeholder="Search…"
            value={query}
            onChange={handleSearchChange}
            className="w-full p-2 outline-0 focus:ring-0 ring-0 border-b border-gray-100 dark:border-gray-600"
          />

          <div
            className="max-h-64 overflow-y-auto custom-y-scroll"
            ref={listRef}
            style={{ maxHeight: listMaxHeight }}
            onScroll={handleScroll}
          >
            <ul className="divide-y divide-gray-100 custom-y-scroll dark:divide-gray-800">
              {(Array.isArray(options) ? options : []).map((opt, i) => {
                const id = getOptionId(opt); // ✅ FIXED
                const selected = isSelectedId(id);

                return (
                  <li
                    key={id || i}
                    className="flex items-center justify-between px-3 py-2"
                  >
                    <div className="mr-2 truncate">
                      <div className="font-medium">
                        {getOptionLabel(opt, nameKey)}
                      </div>
                      <div className="text-xs text-gray-500">{id}</div>
                    </div>

                    <Button
                      type="button"
                      size="sm"
                      variant={selected ? "secondary" : "default"}
                      className="gap-1"
                      disabled={selected}
                      onClick={(e) => {
                        e.stopPropagation();
                        !selected && addId(id);
                      }}
                    >
                      <IconPlus className="h-4 w-4" />
                      {selected ? "Added" : "Add"}
                    </Button>
                  </li>
                );
              })}

              {loading && (
                <li className="flex items-center justify-center py-2">
                  <IconLoader2 />
                </li>
              )}
            </ul>
          </div>
        </PopoverContent>
      </Popover>

      {selectedIds.length > 0 && (
        <div
          className="mt-3 rounded-lg border custom-y-scroll border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900"
          style={{ maxHeight: listMaxHeight, overflowY: "auto" }}
        >
          <ul className="divide-y divide-gray-100 dark:divide-gray-800 custom-y-scroll">
            {selectedIds.map((id, i) => {
              const opt = optionById.get(id);
              const label = getOptionLabel(opt, nameKey) || String(id);

              return (
                <li
                  key={`${id}-${i}`}
                  className="flex items-center justify-between gap-2 px-3 py-2"
                >
                  <div className="min-w-0">
                    <div className="truncate font-medium text-gray-900 dark:text-gray-100">
                      {label}
                    </div>
                    <div className="truncate text-xs text-gray-500">{id}</div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {multiple && (
                      <>
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          onClick={() => move(i, -1)}
                          disabled={i === 0}
                        >
                          <IconArrowUp className="h-4 w-4" />
                        </Button>

                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          onClick={() => move(i, 1)}
                          disabled={i === selectedIds.length - 1}
                        >
                          <IconArrowDown className="h-4 w-4" />
                        </Button>
                      </>
                    )}

                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-red-600"
                      onClick={() => removeIndex(i)}
                    >
                      <IconX className="h-4 w-4" />
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
