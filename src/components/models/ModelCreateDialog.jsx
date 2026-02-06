import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { X, CheckCircle2 } from "lucide-react";
import ApiPreview from "./ApiPreview";
import { slugify } from "@/lib/utils";
import { collectionNameFromKey } from "@/lib/naming";

const schema = z.object({
  title: z.string().min(2, "Title required"),
  type: z.enum(["collection", "single"], { required_error: "Type required" }),
});

export default function ModelCreateDialog({
  open,
  onClose,
  onSubmit, // (payload) => Promise<any>
  existingKeys = [], // array of keys to prevent duplicates
  defaultType = "collection",
  isSubmitting = false,
  serverError = null,
  serverSuccess = false,
}) {
  if (!open) return null;

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: { title: "", type: defaultType },
    mode: "onChange",
  });

  const watchTitle = form.watch("title");
  const watchType = form.watch("type");
  const keyFromTitle = useMemo(() => slugify(watchTitle || ""), [watchTitle]);
  const colName = useMemo(
    () => collectionNameFromKey(keyFromTitle, watchType),
    [keyFromTitle, watchType]
  );
  const handleSubmit = async (values) => {
    const key = slugify(values.title);

    if (!key) {
      form.setError("title", {
        type: "manual",
        message: "Title results in empty key.",
      });
      return;
    }
    if (existingKeys?.includes(key)) {
      form.setError("title", {
        type: "manual",
        message: `Model with key "${key}" already exists.`,
      });
      return;
    }
    await onSubmit({
      key,
      name: values.title.trim(),
      type: values.type,
      collectionName: colName,
      fields: [],
    });
  };

  const FieldError = ({ name }) => {
    const err = form.formState.errors?.[name];
    if (!err) return null;
    return <p className="text-sm text-red-600 mt-1">{err.message}</p>;
  };

  return (
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 bg-black/30"
        onClick={isSubmitting ? undefined : onClose}
      />
      <div className="absolute inset-x-0 top-20 mx-auto w-[95%] max-w-lg">
        <div className="rounded-lg border bg-white dark:bg-zinc-900 shadow-xl">
          <div className="flex items-center justify-between p-3 border-b">
            <div className="font-semibold">Create Model</div>
            <button
              className="p-2 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800"
              onClick={onClose}
              disabled={isSubmitting}
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <form onSubmit={form.handleSubmit(handleSubmit)}>
            <div className="p-4 space-y-3">
              {/* Title */}
              <div>
                <label className="block text-sm mb-1">Title</label>
                <input
                  className="w-full rounded-md border px-3 py-2 bg-transparent"
                  placeholder="Blog, Destination, SEO, etc."
                  {...form.register("title")}
                />
                <FieldError name="title" />
                {watchTitle && (
                  <p className="text-[11px] mt-1 opacity-70">
                    Key will be:{" "}
                    <code className="font-mono">{keyFromTitle}</code>
                  </p>
                )}
              </div>

              {/* Type */}
              <div>
                <label className="block text-sm mb-1">Type</label>
                <select
                  className="w-full rounded-md border px-3 py-2 bg-transparent"
                  {...form.register("type")}
                >
                  <option value="collection">collection</option>
                  <option value="single">single</option>
                </select>
                <FieldError name="type" />
              </div>
              {/* Read-only Collection Name */}
              <div>
                <label className="block text-sm mb-1">
                  Collection Name (auto)
                </label>
                <div className="text-xs font-mono bg-zinc-50 dark:bg-zinc-900 border rounded px-2 py-1">
                  {colName || "—"}
                </div>
                <p className="text-[11px] opacity-60 mt-1">
                  This is auto-generated from title. For single types, it equals
                  the key.
                </p>
              </div>

              {/* Read-only API preview */}
              <div>
                <label className="block text-sm mb-1">Backend API</label>
                <ApiPreview keyStr={keyFromTitle} type={watchType} />
              </div>

              {/* Server error/success from parent */}
              {serverError && (
                <div className="text-sm text-red-600">{serverError}</div>
              )}
              {serverSuccess && (
                <div className="flex items-center gap-2 text-sm text-green-700">
                  <CheckCircle2 className="h-4 w-4" />
                  Model created.
                </div>
              )}
            </div>

            <div className="p-3 border-t flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-md border px-4 py-2 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!form.formState.isValid || isSubmitting}
                className="rounded-md border px-4 py-2 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800"
              >
                {isSubmitting ? "Saving…" : "Save"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
