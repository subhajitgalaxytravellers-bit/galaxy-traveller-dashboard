import React from "react";
import { format } from "date-fns";

export default function DateField({ label, value, onChange }) {
  // Format the date value to yyyy-MM-dd
  const formattedValue = value ? format(new Date(value), "yyyy-MM-dd") : "";

  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
        </label>
      )}
      <input
        type="date"
        className="w-full px-3 py-2 rounded-lg border 
                   bg-white dark:bg-gray-900
                   border-gray-300 dark:border-gray-700
                   text-gray-800 dark:text-gray-200
                   focus:outline-none "
        value={formattedValue} // Set the formatted date here
        onChange={(e) => onChange(e.target.value)} // Handle onChange event
      />
    </div>
  );
}
