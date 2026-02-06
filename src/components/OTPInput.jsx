// src/components/auth/OtpInput.jsx
import * as React from "react";

export default function OtpInput({
  length = 6,
  value = "",
  onChange,
  autoFocus = true,
}) {
  const refs = React.useRef([]);

  const setChar = (i, ch) => {
    const next = (value || "").split("");
    next[i] = ch.replace(/\D/g, "").slice(-1) || "";
    onChange?.(next.join(""));
  };

  const onKeyDown = (i, e) => {
    if (e.key === "Backspace" && !value[i] && i > 0)
      refs.current[i - 1]?.focus();
    if (e.key === "ArrowLeft" && i > 0) refs.current[i - 1]?.focus();
    if (e.key === "ArrowRight" && i < length - 1) refs.current[i + 1]?.focus();
  };

  const onChangeBox = (i, e) => {
    const v = e.target.value;
    if (/\D/.test(v)) return; // digits only
    setChar(i, v);
    if (v && i < length - 1) refs.current[i + 1]?.focus();
  };

  const onPaste = (e) => {
    const text = (e.clipboardData?.getData("text") || "")
      .replace(/\D/g, "")
      .slice(0, length);
    if (!text) return;
    e.preventDefault();
    const next = (value || "").split("");
    for (let i = 0; i < length; i++) next[i] = text[i] || "";
    onChange?.(next.join(""));
    const last = Math.min(text.length - 1, length - 1);
    refs.current[last]?.focus();
  };

  return (
    <div className="flex items-center gap-2" onPaste={onPaste}>
      {Array.from({ length }).map((_, i) => (
        <input
          key={i}
          ref={(el) => (refs.current[i] = el)}
          inputMode="numeric"
          maxLength={1}
          autoFocus={autoFocus && i === 0}
          value={(value || "")[i] || ""}
          onChange={(e) => onChangeBox(i, e)}
          onKeyDown={(e) => onKeyDown(i, e)}
          className="h-10 w-10 text-center rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-base"
        />
      ))}
    </div>
  );
}
