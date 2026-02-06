import React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

/**
 * EnumDropdown (light/dark ready)
 *
 * Props:
 * - options: string[] | {label:string, value:string}[]
 * - value: string
 * - onChange: (val:string)=>void
 * - label?: string
 * - helperText?: string
 * - placeholder?: string
 * - className?: string
 * - disabled?: boolean
 * - compact?: boolean   // tighter padding
 */
export default function EnumDropdown({
  options = [],
  value = "", // default value set as empty string
  onChange,
  helperText,
  placeholder = "Select...",
  className = "",
  disabled = false,
  field,
  compact = false,
}) {
  // console.log("EnumDropdown", field);

  // allow array of strings or objects
  const normalized = options.map((o) =>
    typeof o === "string" ? { label: o, value: o } : o
  );

  const pad = compact ? "py-1.5 px-2.5 text-sm" : "py-2.5 px-3 text-base";

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <div className="relative">
        <Select
          value={value || ""}
          onValueChange={onChange}
          disabled={disabled}
        >
          <SelectTrigger
            className={`w-full capitalize text-sm outline-none focus:outline-none focus:ring-0 bg-gray-100 dark:bg-gray-800 ${pad} border ${
              disabled
                ? "border-gray-400"
                : "border-gray-100 dark:border-gray-700"
            }`}
          >
            <SelectValue className="capitalize" placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent className="border border-gray-100 dark:border-gray-800">
            {normalized.map(({ label, value }) => (
              <SelectItem
                key={value}
                value={value}
                className="capitalize text-sm"
              >
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {helperText && (
        <p className="text-xs text-gray-500 dark:text-gray-400">{helperText}</p>
      )}
    </div>
  );
}
