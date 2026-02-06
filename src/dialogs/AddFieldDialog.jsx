import * as React from "react";
import { v4 as uuid } from "uuid";
import { useForm } from "react-hook-form";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "../ui/dialog";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "../ui/select";

/**
 * Props:
 * - open, onOpenChange
 * - initialField: Field | null
 * - existingNames: Set<string> to avoid duplicates
 * - onCreate(field), onUpdate(field)
 */
export default function AddFieldDialog({
  open,
  onOpenChange,
  initialField = null,
  existingNames = new Set(),
  onCreate,
  onUpdate,
}) {
  const isEdit = !!initialField;

  const { register, handleSubmit, reset, setValue, watch } = useForm({
    defaultValues: toFormDefaults(initialField),
  });

  React.useEffect(() => {
    reset(toFormDefaults(initialField));
  }, [initialField, reset]);

  const title = watch("label");
  React.useEffect(() => {
    // auto name from label if not manually changed
    const auto = slugify(title || "");
    if (!isEdit) setValue("name", auto);
  }, [title, isEdit, setValue]);

  const submit = handleSubmit((vals) => {
    const field = {
      id: initialField?.id ?? uuid(),
      type: vals.type,
      name: vals.name.trim(),
      label: vals.label.trim(),
      placeholder: vals.placeholder || "",
      size: vals.size,
      relationType:
        vals.type === "relation" ? vals.relationType || "default" : undefined,
    };

    // name collision guard
    if (!isEdit && existingNames.has(field.name)) {
      alert("Field name already exists. Please choose another.");
      return;
    }

    if (isEdit) onUpdate?.(field);
    else onCreate?.(field);

    onOpenChange(false);
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) reset(toFormDefaults(initialField));
        onOpenChange(o);
      }}
    >
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit field" : "Add field"}</DialogTitle>
        </DialogHeader>

        <form className="grid gap-4">
          {/* Type */}
          <div className="grid gap-2">
            <Label>Type</Label>
            <Select
              defaultValue={watch("type")}
              onValueChange={(v) => setValue("type", v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="input">Input</SelectItem>
                <SelectItem value="textarea">Textarea</SelectItem>
                <SelectItem value="relation">Relation</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Label */}
          <div className="grid gap-2">
            <Label htmlFor="label">Title</Label>
            <Input
              id="label"
              placeholder="Field title"
              {...register("label", { required: true })}
            />
          </div>

          {/* Name (form key) */}
          <div className="grid gap-2">
            <Label htmlFor="name">Key</Label>
            <Input
              id="name"
              placeholder="field_key"
              {...register("name", { required: true })}
            />
            <p className="text-xs text-gray-500">Used in form values object.</p>
          </div>

          {/* Placeholder (not for relation necessarily) */}
          <div className="grid gap-2">
            <Label htmlFor="placeholder">Placeholder</Label>
            <Input
              id="placeholder"
              placeholder="Enter placeholder…"
              {...register("placeholder")}
            />
          </div>

          {/* Relation type (only when relation) */}
          {watch("type") === "relation" && (
            <div className="grid gap-2">
              <Label>Relation type</Label>
              <Input
                placeholder="e.g. destinations"
                {...register("relationType", { required: true })}
              />
              <p className="text-xs text-gray-500">
                Must match a key in relationOptionsMap.
              </p>
            </div>
          )}

          {/* Size */}
          <div className="grid gap-2">
            <Label>Size</Label>
            <Select
              defaultValue={watch("size")}
              onValueChange={(v) => setValue("size", v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select width" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="50">50% (half width)</SelectItem>
                <SelectItem value="100">100% (full width)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </form>

        <DialogFooter className="gap-2">
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button onClick={submit}>{isEdit ? "Update" : "Add field"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function toFormDefaults(field) {
  return {
    type: field?.type ?? "input",
    label: field?.label ?? "",
    name: field?.name ?? "",
    placeholder: field?.placeholder ?? "",
    size: field?.size ?? "50",
    relationType: field?.relationType ?? "",
  };
}

function slugify(s) {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-_]/g, "")
    .replace(/\s+/g, "_")
    .slice(0, 60);
}
