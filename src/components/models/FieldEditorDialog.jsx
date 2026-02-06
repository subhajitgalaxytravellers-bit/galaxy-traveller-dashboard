import { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectValue,
  SelectItem,
} from "../ui/select";
import { Switch } from "../ui/switch";

// keep your field types set
const FIELD_TYPES = [
  "text",
  "textarea",
  "image",
  "number",
  "boolean",
  "date",
  "relation",
  "component",
];

// Use your existing helper if you already have one
import { slugify as _slugify } from "@/lib/utils";
const slugify = (s) =>
  _slugify
    ? _slugify(s)
    : (s || "")
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-");

export default function FieldEditorDialog({
  open,
  value, // field object with _uid
  onClose,
  onSave, // (normalizedField) => void
  allModels = [],
  componentDefs = [],
  readOnly = false,
}) {
  const [local, setLocal] = useState(blank());

  // Seed when opening / switching rows
  useEffect(() => {
    if (!open) return;
    const incoming = value || {};
    setLocal({
      // ❌ no key input; we derive from label on save
      label: incoming.label ?? "",
      type: incoming.type ?? "text",
      required: !!incoming.required,
      // ✅ defaults for new fields
      min: safeNum(incoming.min, "0"),
      max: safeNum(incoming.max, "255"),
      grid: safeNum(incoming.grid, "12"), // dropdown; empty = unset
      optionsCsv: Array.isArray(incoming.options)
        ? incoming.options.join(",")
        : "",
      relationKind: incoming.kind || "one",
      targetModel: incoming.target || "",
      componentKey: incoming.componentKey || "",
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, value?._uid]);

  // Normalize before saving
  const normalized = useMemo(() => {
    const key = slugify(local.label || "");
    const base = {
      key, // ✅ derive from label
      label: local.label,
      type: local.type,
      required: !!local.required,
    };

    if (local.grid !== "") base.grid = Number(local.grid);
    if (local.min !== "") base.min = Number(local.min);
    if (local.max !== "") base.max = Number(local.max);

    if (local.type === "select") {
      base.options = (local.optionsCsv || "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    }
    if (local.type === "relation") {
      base.kind = local.relationKind || "one"; // 'one' | 'many'
      base.target = local.targetModel || undefined;
    }
    if (local.type === "component") {
      base.componentKey = local.componentKey || undefined;
    }
    return base;
  }, [local]);

  if (!open) return null;

  const gridValue =
    typeof local.grid === "number" && local.grid > 0
      ? String(local.grid)
      : undefined;

  const targetValue = local.targetModel || undefined;

  return (
    <Dialog open={open} onOpenChange={(o) => (!o ? onClose?.() : null)}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          {readOnly ? "View Field (read-only)" : "Edit Field"}
        </DialogHeader>

        <div className="space-y-4">
          {/* Basic */}
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="fld-label">Title</Label>
              <Input
                id="fld-label"
                placeholder="Title"
                value={local.label}
                onChange={(e) =>
                  setLocal((s) => ({ ...s, label: e.target.value }))
                }
              />
              <p className="text-[11px] text-muted-foreground">
                Key will be{" "}
                <code className="font-mono">
                  {slugify(local.label || "") || "…"}
                </code>
              </p>
            </div>

            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select
                value={local.type}
                onValueChange={(v) => setLocal((s) => ({ ...s, type: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose type" />
                </SelectTrigger>
                <SelectContent>
                  {FIELD_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Required</Label>
              <div className="h-9 px-3 rounded-md border flex items-center">
                <Switch
                  checked={!!local.required}
                  onCheckedChange={(ck) =>
                    setLocal((s) => ({ ...s, required: ck }))
                  }
                />
                <span className="ml-2 text-sm">
                  {local.required ? "Yes" : "No"}
                </span>
              </div>
            </div>
          </div>

          {/* Common */}
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-1.5">
              <Label htmlFor="fld-min">Min</Label>
              <Input
                id="fld-min"
                type="number"
                value={local.min}
                onChange={(e) =>
                  setLocal((s) => ({ ...s, min: e.target.value }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="fld-max">Max</Label>
              <Input
                id="fld-max"
                type="number"
                value={local.max}
                onChange={(e) =>
                  setLocal((s) => ({ ...s, max: e.target.value }))
                }
              />
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <Label>Grid (1–12)</Label>

              <Select
                value={gridValue}
                onValueChange={(v) =>
                  setLocal((s) => ({
                    ...s,
                    grid: v === "__auto" ? "" : Number(v),
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Auto" />
                </SelectTrigger>
                <SelectContent>
                  {/* was: <SelectItem value="">Auto</SelectItem>  ❌ */}
                  <SelectItem value="__auto">Auto</SelectItem>{" "}
                  {/* ✅ sentinel */}
                  {Array.from({ length: 12 }, (_, i) => String(i + 1)).map(
                    (n) => (
                      <SelectItem key={n} value={n}>
                        {n}
                      </SelectItem>
                    )
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Conditional: select */}
          {local.type === "select" && (
            <div className="space-y-1.5">
              <Label>Options (comma separated)</Label>
              <Input
                placeholder="draft,published,archived"
                value={local.optionsCsv}
                onChange={(e) =>
                  setLocal((s) => ({ ...s, optionsCsv: e.target.value }))
                }
              />
            </div>
          )}

          {/* Conditional: relation */}
          {local.type === "relation" && (
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Kind</Label>
                <Select
                  value={local.relationKind}
                  onValueChange={(v) =>
                    setLocal((s) => ({ ...s, relationKind: v }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="one">one</SelectItem>
                    <SelectItem value="many">many</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Target model</Label>

                <Select
                  value={targetValue}
                  onValueChange={(v) =>
                    setLocal((s) => ({
                      ...s,
                      targetModel: v === "__none" ? "" : v,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a model" />
                  </SelectTrigger>
                  <SelectContent>
                    {/* was: <SelectItem value="">—</SelectItem>  ❌ */}
                    <SelectItem value="__none">None</SelectItem>{" "}
                    {/* ✅ sentinel */}
                    {allModels.map((m) => (
                      <SelectItem key={m.key} value={m.key}>
                        {m.key} ({m.type})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Conditional: component */}
          {local.type === "component" && (
            <div className="space-y-1.5">
              <Label>Component</Label>
              <Select
                value={local.componentKey || undefined} // undefined -> placeholder
                onValueChange={(v) =>
                  setLocal((s) => ({
                    ...s,
                    componentKey: v === "__none" ? "" : v,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select component" />
                </SelectTrigger>
                <SelectContent>
                  {/* was: <SelectItem value="">—</SelectItem>  ❌ */}
                  <SelectItem value="__none">None</SelectItem>{" "}
                  {/* ✅ sentinel */}
                  {componentDefs.map((c) => (
                    <SelectItem key={c.key} value={c.key}>
                      {c.key} — {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={onClose}>
            {readOnly ? "Close" : "Cancel"}
          </Button>
          {!readOnly && (
            <Button
              onClick={() => onSave(normalized)}
              disabled={!local.label.trim()}
            >
              Save
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* utils */
function blank() {
  return {
    label: "",
    type: "text",
    required: false,
    // ✅ defaults requested
    min: "0",
    max: "255",
    grid: "",
    optionsCsv: "",
    relationKind: "one",
    targetModel: "",
    componentKey: "",
  };
}
function safeNum(n, fallback = "") {
  if (typeof n === "number") return String(n);
  if (n === undefined || n === null || n === "") return fallback;
  return String(n);
}
