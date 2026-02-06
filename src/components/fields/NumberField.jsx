import { useState, useEffect } from "react";

export default function NumberField({
  label,
  value,
  onChange,
  placeholder,
  field,
}) {
  const [error, setError] = useState("");
  const [isValid, setIsValid] = useState(true);
  const [hasFocus, setHasFocus] = useState(false); // Track if the input is focused

  const handle = (e) => {
    const raw = e.target.value;
    onChange(raw === "" ? "" : Number(raw)); // Handle the input change as a number
  };

  // Validate minLength and maxLength as string lengths (for number fields)
  useEffect(() => {
    if (!hasFocus) return; // Only validate if the input has been focused

    const valueAsString = String(value); // Convert value to string

    if (field?.minLength && valueAsString.length < field?.minLength) {
      setError(`Minimum length is ${field?.minLength} characters.`);
      setIsValid(false);
    } else if (field?.maxLength && valueAsString.length > field?.maxLength) {
      setError(`Maximum length is ${field?.maxLength} characters.`);
      setIsValid(false);
    } else {
      setError(""); // Clear error if valid
      setIsValid(true);
    }
  }, [value, field?.minLength, field?.maxLength, hasFocus]);

  const handleFocus = () => {
    setHasFocus(true); // Set focus state when the input is focused
  };

  const handleBlur = () => {
    setHasFocus(false); // Set focus state when the input loses focus
  };

  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
        </label>
      )}
      <input
        type="number"
        step="any"
        min={field?.min} // Optional: you can still use min/max if needed for numeric value
        max={field?.max}
        className={`w-full px-3 py-2 rounded-lg border transition-colors
          ${
            isValid
              ? "border-gray-300 dark:border-gray-700"
              : "border-red-500 dark:border-red-500"
          }
          bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 focus:outline-none`}
        value={value === "" ? "" : value ?? ""}
        placeholder={placeholder || `Enter ${label}`}
        onChange={handle}
        onFocus={handleFocus} // Set focus state when the input is focused
        onBlur={handleBlur} // Set focus state when the input loses focus
      />
      {/* Show error message only if the input is invalid and focused */}
      {!isValid && hasFocus && (
        <p className="text-red-500 text-xs mt-1">{error}</p>
      )}
    </div>
  );
}
