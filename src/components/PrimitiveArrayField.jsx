import TextField from "./fields/TextField";
import { Button } from "./ui/button";

export const PrimitiveArrayField = ({
  value = [],
  onChange,
  placeholder = "Add item",
  elementType = "string", // 'string' | 'number' | 'date' | 'image' (basic support)
}) => {
  const arr = Array.isArray(value) ? value : [];

  const setAt = (i, v) => {
    const next = [...arr];
    // type coercion for numbers
    if (elementType === "number") {
      const n = v === "" ? "" : Number(v);
      next[i] = Number.isNaN(n) ? "" : n;
    } else {
      next[i] = v;
    }
    onChange(next);
  };

  const add = () =>
    onChange([...(arr || []), elementType === "number" ? "" : ""]);
  const remove = (i) => onChange(arr.filter((_, idx) => idx !== i));

  const renderItemInput = (val, i) => {
    switch (elementType) {
      case "number":
        return (
          <NumberField
            value={val ?? ""}
            onChange={(v) => setAt(i, v)}
            placeholder={placeholder}
          />
        );
      case "date":
        return (
          <DateField
            value={val ?? ""}
            onChange={(v) => setAt(i, v)}
            placeholder={placeholder}
          />
        );
      case "image":
        return <ImageInput value={val ?? ""} onChange={(v) => setAt(i, v)} />;
      case "string":
      case "text":
      default:
        return (
          <TextField
            value={val ?? ""}
            onChange={(v) => setAt(i, v)}
            placeholder={placeholder}
          />
        );
    }
  };

  return (
    <div className="flex flex-col gap-2">
      {arr.map((v, i) => (
        <div key={i} className="flex items-center gap-2">
          <div className="flex-1">{renderItemInput(v, i)}</div>
          <Button
            type="button"
            className="rounded- border border-gray-200 dark:border-gray-900   
            font-medium
             px-2 py-1 text-xs"
            onClick={() => remove(i)}
          >
            Remove
          </Button>
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        className="w-full rounded-md border font-normal border-dashed border-gray-200 dark:border-gray-900 px-3 py-2 text-sm"
        onClick={add}
      >
        + Add item
      </Button>
    </div>
  );
};
