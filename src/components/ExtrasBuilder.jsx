// src/components/ExtrasBuilder.jsx
import React, { useEffect, useState } from "react";
import { Button } from "../ui/button";

const ALLOWED = ["text", "number", "switch", "textarea", "date"];

export default function ExtrasBuilder({ storageKey, onChange }) {
  const [defs, setDefs] = useState([]);
  const [name, setName] = useState("");
  const [type, setType] = useState("text");

  useEffect(() => {
    const raw = localStorage.getItem(storageKey);
    if (raw) setDefs(JSON.parse(raw));
  }, [storageKey]);

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(defs));
    if (onChange) onChange(defs);
  }, [defs, storageKey, onChange]);

  const canAdd =
    name.trim().length > 0 &&
    ALLOWED.includes(type) &&
    !defs.some((d) => d.name === name.trim());

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <input
          className="border rounded px-2 py-1 w-full"
          placeholder="extra field name (e.g. readingTime)"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <select
          className="border rounded px-2 py-1"
          value={type}
          onChange={(e) => setType(e.target.value)}
        >
          {ALLOWED.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <Button
          type="button"
          disabled={!canAdd}
          onClick={() => {
            setDefs((d) => [...d, { name: name.trim(), type }]);
            setName("");
            setType("text");
          }}
        >
          Add
        </Button>
      </div>

      <div className="text-xs text-gray-500">
        Extras values are saved under <code>values.extras</code> and submitted
        with the form.
      </div>

      <ul className="space-y-1">
        {defs.map((d, i) => (
          <li
            key={d.name}
            className="flex items-center justify-between rounded border p-2"
          >
            <span className="text-sm">
              {d.name} <span className="text-gray-400">({d.type})</span>
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setDefs(defs.filter((_, idx) => idx !== i))}
            >
              Remove
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}
