import { useEffect, useMemo, useState } from "react";
import FieldCard from "@/components/models/FieldCard";
import FieldEditorDialog from "@/components/models/FieldEditorDialog";
import { CheckCircle2 } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "../ui/card";
import { Separator } from "../ui/separator";
import { ScrollArea } from "../ui/scroll-area";
import { cx } from "class-variance-authority";

// --- helpers for stable ids
const uid = () =>
  crypto?.randomUUID?.() ??
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
const toEditor = (arr = []) =>
  arr.map((f) => ({ _uid: f._uid ?? uid(), ...f }));
const fromEditor = (arr = []) => arr.map(({ _uid, ...rest }) => rest);

// Vite-only environment helper
const isDevEnv = () => {
  if (typeof import.meta !== "undefined" && import.meta.env) {
    // Prefer explicit app env if you set it
    if (typeof import.meta.env.VITE_APP_ENV !== "undefined") {
      return import.meta.env.VITE_APP_ENV === "development";
    }
    // Fallbacks provided by Vite
    if (typeof import.meta.env.DEV !== "undefined") {
      return !!import.meta.env.DEV; // true in dev server
    }
    if (typeof import.meta.env.MODE !== "undefined") {
      return import.meta.env.MODE === "development";
    }
  }
  return false;
};

export default function TemplateBuilder({
  model,
  allModels = [],
  componentDefs = [],
  selected,
  onSave,
  saving,
  serverError,
  serverSuccess,
}) {
  const [fields, setFields] = useState(() => toEditor(model?.fields || []));
  const [editingUid, setEditingUid] = useState(null);
  // ✨ NEW: gate all mutations behind dev + editMode
  const [editMode, setEditMode] = useState(false);
  const dev = isDevEnv();
  useEffect(() => {
    setFields(toEditor(model?.fields || []));
    setEditingUid(null);

    // lock edit mode on model change (safer)
    setEditMode(false);
  }, [model?.key]);

  const addField = () => {
    if (!dev || !editMode) return; // guard
    const f = {
      _uid: uid(),
      key: "",
      label: "",
      type: "text",
      required: false,
    };
    setFields((a) => [...a, f]);
    setEditingUid(f._uid);
  };

  // helper: remove by uid (used on cancel)
  const removeField = (rowUid) => {
    if (!dev || !editMode) return; // guard

    setFields((a) => a.filter((f) => f._uid !== rowUid));
  };
  const moveUp = (idx) =>
    dev &&
    editMode &&
    idx > 0 &&
    setFields((a) => {
      const c = [...a];
      [c[idx - 1], c[idx]] = [c[idx], c[idx - 1]];
      return c;
    });

  const moveDown = (idx) =>
    dev &&
    editMode &&
    setFields((a) => {
      if (idx >= a.length - 1) return a;
      const c = [...a];
      [c[idx + 1], c[idx]] = [c[idx], c[idx + 1]];
      return c;
    });
  const editing = fields.find((f) => f._uid === editingUid) || null;

  const handleSaveClick = async () => {
    if (!model?.key || !dev || !editMode) return;
    await onSave({
      key: model.key,
      name: model.name,
      type: model.type,
      collectionName: model.collectionName,
      fields: fromEditor(fields),
    });
    setEditMode(false); // optional: exit edit mode after publish
  };
  const preview = useMemo(
    () => JSON.stringify(fromEditor(fields), null, 2),
    [fields]
  );
  const handleDialogClose = () => {
    // console.log(editing);

    if (editing && dev && editMode && !editing.label && !editing.key) {
      removeField(editing._uid);
    }
    setEditingUid(null);
  };

  const readOnly = !dev || !editMode;

  return (
    <Card
      className={cx(
        // match RoleCard look/feel
        "rounded-xl border border-transparent ring-1 ring-black/5 dark:ring-white/10",
        "bg-white/70 dark:bg-gray-900/60 hover:shadow-sm transition",
        "flex min-w-0 flex-1 md:w-2/3 max-h-[calc(100vh-7rem)] flex-col",
        // padding to match RoleCard
        "p-3"
      )}
    >
      <CardHeader className="space-y-1">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl">{selected && selected.name}</CardTitle>
          {/* Optional: show quick type badge */}
          <div>
            {selected && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {dev && !editMode && (
                    <button
                      type="button"
                      onClick={() => setEditMode(true)}
                      className="rounded-md border px-3 py-2 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800"
                    >
                      Config
                    </button>
                  )}
                  {dev && editMode && (
                    <>
                      <button
                        type="button"
                        onClick={addField}
                        className="rounded-md border px-3 py-2 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800"
                      >
                        Add field
                      </button>
                      <button
                        type="button"
                        onClick={handleSaveClick}
                        disabled={saving}
                        className="rounded-md border px-3 py-2 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800 disabled:opacity-50"
                      >
                        {saving ? "Publishing…" : "Publish"}
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="text-sm text-muted-foreground">
          {selected
            ? `Key: ${selected.key}${
                selected.collectionName
                  ? ` • Collection: ${selected.collectionName}`
                  : ""
              }${readOnly ? " • Read-only" : " • Editing"}`
            : "Select a model from the left, or create a new one."}
        </div>
      </CardHeader>
      <Separator />

      <CardContent className="min-h-0 p-0 flex">
        {selected && (
          <ScrollArea className="h-full w-full">
            <div className="p-4">
              {/* TEMPLATE BUILDER */}{" "}
              <div className="flex space-x-4">
                <div className="space-y-4 w-full">
                  {/* cards grid */}
                  <div className="grid gap-3 grid-cols-1">
                    {fields.map((f, i) => (
                      <FieldCard
                        key={f._uid}
                        field={f}
                        index={i}
                        canMoveUp={i > 0}
                        canMoveDown={i < fields.length - 1}
                        onEdit={() => setEditingUid(f._uid)}
                        onRemove={() => removeField(f._uid)}
                        onMoveUp={() => moveUp(i)}
                        onMoveDown={() => moveDown(i)}
                        editable={!readOnly}
                      />
                    ))}
                    {fields.length === 0 && (
                      <div className="rounded-md border p-4 text-sm opacity-70">
                        No fields yet.{" "}
                        {readOnly ? "Enable Config to edit." : "Click "}
                        {!readOnly && <b>Add field</b>}
                      </div>
                    )}
                  </div>

                  {/* server messages */}
                  {serverError && (
                    <div className="text-sm text-red-600">{serverError}</div>
                  )}
                  {serverSuccess && (
                    <div className="text-sm text-green-600">Model updated.</div>
                  )}
                </div>
              </div>
            </div>
          </ScrollArea>
        )}

        <div>
          <div className="rounded-md border h-full ">
            <ScrollArea className="h-full">
              <div className="flex items-center gap-2 text-sm font-medium mb-2">
                <CheckCircle2 className="h-4 w-4" />
                Generated fields JSON (what we will send)
              </div>
              <pre className="text-xs bg-zinc-50 dark:bg-zinc-900 rounded p-2 overflow-auto">
                {preview}
              </pre>
            </ScrollArea>
          </div>
        </div>
      </CardContent>

      {/* dialog */}
      <FieldEditorDialog
        open={!!editing}
        value={editing}
        onClose={handleDialogClose}
        onSave={(next) => {
          if (!editing || readOnly) return;
          // persist edits to row
          setFields((a) =>
            a.map((f) => (f._uid === editing._uid ? { ...f, ...next } : f))
          );
          setEditingUid(null);
        }}
        allModels={allModels}
        componentDefs={componentDefs}
        readOnly={readOnly}
      />
    </Card>
  );
}
