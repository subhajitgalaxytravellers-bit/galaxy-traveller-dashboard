export default function SwitchField({ checked, onChange, field, label }) {
  return (
    <div className="flex items-center object-center gap-2 py-1 w-full min-w-0 overflow-hidden">
      {/* Checkbox: fixed size, never stretches */}
      <div className="flex-shrink-0">
        <input
          type="checkbox"
          checked={!!checked}
          onChange={(e) => onChange(e.target.checked)}
          className="h-4 w-4 cursor-pointer accent-primary"
        />
      </div>

      {/* Label wraps if needed, preventing overflow */}
      <label
        className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer break-words min-w-0"
        onClick={() => onChange(!checked)}
      >
        {label || field?.label || field?.key}
      </label>
    </div>
  );
}
