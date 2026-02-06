// components/fields/BooleanField.jsx
import React from "react";

export default function BooleanField({ value, onChange, field, label }) {
  return (
    <div className="flex items-center gap-2 py-1 w-full overflow-hidden">
      {/* Checkbox must NEVER shrink */}
      <input
        type="checkbox"
        onChange={() => onChange(!value)}
        value={value ? "true" : "false"}
      />

      {/* Label should wrap, not overflow */}
      <label className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer break-words">
        {label || field.label || field.key}
      </label>
    </div>
  );
}
