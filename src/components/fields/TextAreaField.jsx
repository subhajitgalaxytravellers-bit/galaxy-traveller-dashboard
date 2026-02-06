import React, { useState, useEffect } from "react";

export default function TextAreaField({
  label,
  value,
  onChange,
  placeholder,
  field,
}) {
  const [error, setError] = useState("");
  const [isValid, setIsValid] = useState(true);
  const [hasFocus, setHasFocus] = useState(false); // Track if the textarea is focused

  // Validate based on minLength and maxLength
  useEffect(() => {
    if (!hasFocus) return; // Only validate after focus or interaction

    if (field?.minLength && value?.length < field?.minLength) {
      setError(`Minimum length is ${field?.minLength} characters.`);
      setIsValid(false);
    } else if (field?.maxLength && value?.length > field?.maxLength) {
      setError(`Maximum length is ${field?.maxLength} characters.`);
      setIsValid(false);
    } else {
      setError("");
      setIsValid(true);
    }
  }, [value, field?.minLength, field?.maxLength, hasFocus]);

  const handleFocus = () => {
    setHasFocus(true); // When the textarea is focused
  };

  const handleBlur = () => {
    setHasFocus(false); // When the textarea loses focus
  };

  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
        </label>
      )}
      <textarea
        className={`w-full px-3 py-2 rounded-lg border transition-colors
          ${
            isValid
              ? "border-gray-300 dark:border-gray-700"
              : "border-red-500 dark:border-red-500"
          }
          bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 focus:outline-none`}
        rows={4}
        value={value || ""}
        placeholder={`Enter ${placeholder || label}`}
        onChange={(e) => onChange(e.target.value)}
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
