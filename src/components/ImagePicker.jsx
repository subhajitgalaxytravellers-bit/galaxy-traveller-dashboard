// src/components/ImagePicker.jsx
import React from "react";
import { Button } from "../ui/button";

export default function ImagePicker({ value, onChange }) {
  const [preview, setPreview] = React.useState(null);

  React.useEffect(() => {
    if (value instanceof File) {
      const url = URL.createObjectURL(value);
      setPreview(url);
      return () => URL.revokeObjectURL(url);
    } else if (typeof value === "string" && value) {
      setPreview(value);
    } else {
      setPreview(null);
    }
  }, [value]);

  const pick = (e) => {
    const file = e.target.files?.[0];
    if (file) onChange(file);
  };

  const clear = () => onChange("");

  return (
    <div className="space-y-2">
      {preview && (
        <div className="w-full">
          <img
            src={preview}
            alt="preview"
            className="h-40 w-full object-cover rounded-md border"
          />
        </div>
      )}
      <div className="flex items-center gap-2">
        <label className="inline-block">
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={pick}
          />
          <span className="inline-block">
            <Button type="button" variant="secondary">
              Choose Image
            </Button>
          </span>
        </label>
        {value && (
          <Button type="button" variant="destructive" onClick={clear}>
            Remove
          </Button>
        )}
      </div>
    </div>
  );
}
