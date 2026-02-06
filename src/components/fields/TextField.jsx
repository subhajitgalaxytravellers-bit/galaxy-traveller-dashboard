import { useState, useEffect } from "react";

export default function TextField({
  value,
  onChange,
  label,
  placeholder,
  field,
}) {
  const [error, setError] = useState("");
  const [isValid, setIsValid] = useState(true);
  const [hasFocus, setHasFocus] = useState(false); // Track focus

  // Check if the input value meets min/max length conditions
  useEffect(() => {
    // Only validate after focus or if the value changes
    if (!hasFocus) return;

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
    setHasFocus(true); // Set focus state to true
  };

  const handleBlur = () => {
    setHasFocus(false); // Set focus state to false when the input loses focus
  };

  return (
    <div className="relative w-full">
      <input
        type="text"
        value={value ?? ""}
        minLength={field?.minLength}
        maxLength={field?.maxLength}
        onChange={(e) => onChange(e.target.value)}
        placeholder={`Enter ${placeholder || label}`}
        className={`w-full px-3 py-2 rounded-lg border transition-colors 
          ${
            isValid
              ? "border-gray-300 dark:border-gray-700"
              : "border-red-500 dark:border-red-500"
          }
          bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 focus:outline-none`}
        onFocus={handleFocus} // Set focus state on focus
        onBlur={handleBlur} // Set focus state on blur
      />
      {/* Show error message below the input */}
      {!isValid && hasFocus && (
        <p className="text-red-500 text-xs mt-1">{error}</p>
      )}
    </div>
  );
}
