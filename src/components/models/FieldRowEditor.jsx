import { useEffect, useMemo, useState } from "react";
import { Trash2, MoveUp, MoveDown } from "lucide-react";

// Allowed field types (aligning with your spec)
const FIELD_TYPES = [
  "text",
  "textarea",
  "richtext",
  "image",
  "number",
  "boolean",
  "date",
  "select",
  "relation",
  "object",
  "repeater",
  "component",
];

const cx = (...c) => c.filter(Boolean).join(" ");
const inputBase =
  "block w-full rounded-lg border bg-white dark:bg-zinc-900/60 " +
  "border-zinc-300 dark:border-zinc-700 px-3 py-2 text-sm " +
  "placeholder-zinc-400 dark:placeholder-zinc-500 " +
  "focus:outline-none focus:ring-2 focus:ring-zinc-900/10 dark:focus:ring-zinc-100/10 " +
  "focus:border-zinc-400 dark:focus:border-zinc-600 " +
  "transition";

export default function FieldRowEditor({
  value, // field object
  onChange, // (nextField) => void
  onRemove, // () => void
  canMoveUp,
  canMoveDown,
  onMoveUp,
  onMoveDown,
  allModels = [], // for relation target dropdown
  componentDefs = [], // for component dropdown
}) {
  // Local scratch so typing feels snappy; propagate up on each change
  const [local, setLocal] = useState(() => ({
    key: "",
    label: "",
    type: "text",
    required: false,
    min: "",
    max: "",
    grid: "",
    optionsCsv: "", // for select; we convert to array
    relationKind: "one",
    targetModel: "", // for relation
    componentKey: "", // for component
    ...(value || {}),
  }));

  useEffect(() => {
    const incoming = value || {};
    setLocal((prev) => ({
      key: "",
      label: "",
      type: "text",
      required: false,
      min: "",
      max: "",
      grid: "",
      optionsCsv: Array.isArray(incoming.options)
        ? incoming.options.join(",")
        : incoming.optionsCsv || "",
      relationKind: "one",
      targetModel: "",
      componentKey: "",
      ...incoming,
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value?._uid]); // ✅ only when a different row lands here

  // Derived options array from CSV when type=select
  const options = useMemo(() => {
    if (local.type !== "select") return undefined;
    return (local.optionsCsv || local.options || "")
      .toString()
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }, [local.type, local.optionsCsv, local.options]);

  // Push up merged field to parent on *every* local change
  useEffect(() => {
    const base = {
      key: local.key ?? "",
      label: local.label ?? "",
      type: local.type,
      required: !!local.required,
    };

    if (local.grid !== "") base.grid = Number(local.grid);
    if (local.min !== "") base.min = Number(local.min);
    if (local.max !== "") base.max = Number(local.max);

    if (local.type === "select") {
      base.options = (local.optionsCsv || "")
        .toString()
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    }

    if (local.type === "relation") {
      base.kind = local.relationKind || "one";
      base.target = local.targetModel || undefined;
    }

    if (local.type === "component") {
      base.componentKey = local.componentKey || undefined;
    }

    onChange?.(base);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [local]);

  return (
    <div
      className={cx(
        "group rounded-xl border shadow-sm",
        "bg-white/70 dark:bg-zinc-900/50",
        "border-zinc-200 dark:border-zinc-800",
        "hover:border-zinc-300 dark:hover:border-zinc-700",
        "focus-within:ring-1 focus-within:ring-zinc-900/10 dark:focus-within:ring-zinc-100/10",
        "transition"
      )}
    >
      {/* Row head: type badge + move/remove */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-zinc-100 dark:border-zinc-800/60">
        <div className="flex items-center gap-2">
          <div className="text-sm font-medium">Field</div>
          <span
            className={cx(
              "text-[11px] uppercase tracking-wide",
              "px-2 py-0.5 rounded-full border",
              "border-zinc-300 dark:border-zinc-700",
              "bg-zinc-50 dark:bg-zinc-900/60"
            )}
            title="Field type"
          >
            {local.type}
          </span>
        </div>

        <div className="flex items-center gap-1">
          <IconButton label="Move up" onClick={onMoveUp} disabled={!canMoveUp}>
            <MoveUp className="h-4 w-4" />
          </IconButton>
          <IconButton
            label="Move down"
            onClick={onMoveDown}
            disabled={!canMoveDown}
          >
            <MoveDown className="h-4 w-4" />
          </IconButton>
          <IconButton label="Remove" onClick={onRemove} tone="danger">
            <Trash2 className="h-4 w-4" />
          </IconButton>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Basic */}
        <div className="grid md:grid-cols-3 gap-3">
          <Field label="Key" hint="Unique, machine-readable">
            <input
              className={inputBase}
              placeholder="title, description, seo ..."
              value={local.key || ""}
              onChange={(e) => setLocal((s) => ({ ...s, key: e.target.value }))}
            />
          </Field>

          <Field label="Label" hint="Shown to editors">
            <input
              className={inputBase}
              placeholder="Title"
              value={local.label || ""}
              onChange={(e) =>
                setLocal((s) => ({ ...s, label: e.target.value }))
              }
            />
          </Field>

          <Field label="Type" hint="Choose field kind">
            <select
              className={inputBase}
              value={local.type}
              onChange={(e) =>
                setLocal((s) => ({ ...s, type: e.target.value }))
              }
            >
              {FIELD_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </Field>
        </div>

        {/* Common flags */}
        <div className="grid md:grid-cols-4 gap-3">
          <Field label="Required">
            <label className="inline-flex items-center gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                className="peer sr-only"
                checked={!!local.required}
                onChange={(e) =>
                  setLocal((s) => ({ ...s, required: e.target.checked }))
                }
              />
              <span
                className={cx(
                  "relative inline-flex h-5 w-10 items-center rounded-full transition",
                  "bg-zinc-300 dark:bg-zinc-700",
                  "peer-checked:bg-emerald-500"
                )}
              >
                <span
                  className={cx(
                    "absolute h-4 w-4 rounded-full bg-white shadow transition",
                    "left-0.5 peer-checked:translate-x-5"
                  )}
                />
              </span>
              <span className="text-sm text-zinc-700 dark:text-zinc-300">
                {local.required ? "Yes" : "No"}
              </span>
            </label>
          </Field>

          <Field label="Min">
            <input
              type="number"
              className={inputBase}
              value={local.min ?? ""}
              onChange={(e) => setLocal((s) => ({ ...s, min: e.target.value }))}
            />
          </Field>

          <Field label="Max">
            <input
              type="number"
              className={inputBase}
              value={local.max ?? ""}
              onChange={(e) => setLocal((s) => ({ ...s, max: e.target.value }))}
            />
          </Field>

          <Field label="Grid (1–12)" hint="12-col grid">
            <input
              type="number"
              min={1}
              max={12}
              className={inputBase}
              value={local.grid ?? ""}
              onChange={(e) =>
                setLocal((s) => ({ ...s, grid: e.target.value }))
              }
            />
          </Field>
        </div>

        {/* Conditional: select */}
        {local.type === "select" && (
          <SectionCard title="Select Options">
            <Field label="Options (comma separated)">
              <input
                className={cx(inputBase, "font-mono")}
                placeholder="draft,published,archived"
                value={local.optionsCsv ?? ""}
                onChange={(e) =>
                  setLocal((s) => ({ ...s, optionsCsv: e.target.value }))
                }
              />
            </Field>
          </SectionCard>
        )}

        {/* Conditional: relation */}
        {local.type === "relation" && (
          <SectionCard title="Relation Settings">
            <div className="grid md:grid-cols-2 gap-3">
              <Field label="Kind">
                <select
                  className={inputBase}
                  value={local.relationKind || "one"}
                  onChange={(e) =>
                    setLocal((s) => ({ ...s, relationKind: e.target.value }))
                  }
                >
                  <option value="one">one</option>
                  <option value="many">many</option>
                </select>
              </Field>

              <Field label="Target model" hint="Which model this relates to">
                <select
                  className={inputBase}
                  value={local.targetModel || ""}
                  onChange={(e) =>
                    setLocal((s) => ({ ...s, targetModel: e.target.value }))
                  }
                >
                  <option value="">-- select --</option>
                  {allModels.map((m) => (
                    <option key={m.key} value={m.key}>
                      {m.key} ({m.type})
                    </option>
                  ))}
                </select>
              </Field>
            </div>
          </SectionCard>
        )}

        {/* Conditional: component */}
        {local.type === "component" && (
          <SectionCard title="Component Field">
            <Field label="Component">
              <select
                className={inputBase}
                value={local.componentKey || ""}
                onChange={(e) =>
                  setLocal((s) => ({ ...s, componentKey: e.target.value }))
                }
              >
                <option value="">-- select component --</option>
                {componentDefs.map((c) => (
                  <option key={c.key} value={c.key}>
                    {c.key} — {c.name}
                  </option>
                ))}
              </select>
            </Field>
          </SectionCard>
        )}
      </div>
    </div>
  );
}

/* ---------- tiny presentational helpers ---------- */

function Field({ label, hint, children }) {
  return (
    <div>
      <label className="block text-[11px] font-medium uppercase tracking-wide text-zinc-600 dark:text-zinc-400 mb-1">
        {label}
      </label>
      {children}
      {hint && (
        <p className="mt-1 text-[11px] text-zinc-500 dark:text-zinc-400">
          {hint}
        </p>
      )}
    </div>
  );
}

function SectionCard({ title, children }) {
  return (
    <div
      className={cx(
        "rounded-lg border p-3",
        "bg-zinc-50/70 dark:bg-zinc-900/40",
        "border-zinc-200 dark:border-zinc-800"
      )}
    >
      <div className="text-sm font-medium mb-2">{title}</div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function IconButton({ children, label, onClick, disabled, tone = "default" }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}
      className={cx(
        "p-1.5 rounded-md border transition",
        "bg-white/70 dark:bg-zinc-900/50",
        "border-zinc-200 dark:border-zinc-800",
        "hover:bg-zinc-50 dark:hover:bg-zinc-800",
        "disabled:opacity-40 disabled:cursor-not-allowed",
        tone === "danger" &&
          "hover:border-red-500 hover:text-red-600 dark:hover:border-red-500"
      )}
    >
      {children}
    </button>
  );
}
