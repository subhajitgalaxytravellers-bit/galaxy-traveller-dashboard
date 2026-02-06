import { useEffect, useMemo, useState, useCallback } from 'react';

/**
 * Persisted form layout per model (static backend):
 * - layout = [{ id: fieldKey, size: 'half'|'full' }]
 * - storageKey: localStorage key prefix
 */
export default function useFormLayoutStatic({
  modelKey, // e.g., "user" or "role"
  fields = [], // static fields array [{ key, label, ... }]
  storageKey = 'formLayout',
}) {
  const lsKey = `${storageKey}:${modelKey}`;

  const fieldKeys = useMemo(() => fields.map((f) => f.key), [fields]);

  const computeMerged = useCallback(
    (incoming) => {
      const map = new Map();
      // start with incoming layout
      (incoming || []).forEach((it) => {
        if (it && it.id)
          map.set(it.id, {
            id: it.id,
            size: it.size === 'full' ? 'full' : 'half',
          });
      });
      // ensure all current fields exist
      fieldKeys.forEach((k) => {
        if (!map.has(k)) map.set(k, { id: k, size: 'half' });
      });
      // strip removed fields
      return Array.from(map.values()).filter((it) => fieldKeys.includes(it.id));
    },
    [fieldKeys],
  );

  const readLocal = useCallback(() => {
    try {
      const raw = localStorage.getItem(lsKey);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }, [lsKey]);

  const writeLocal = useCallback(
    (layout) => {
      try {
        localStorage.setItem(lsKey, JSON.stringify(layout));
      } catch {
        // ignore
      }
    },
    [lsKey],
  );

  const [layout, setLayout] = useState(() => computeMerged(readLocal()));

  // merge when fields change
  useEffect(() => {
    setLayout((l) => computeMerged(l));
  }, [computeMerged]);

  // save helper
  const persist = useCallback(
    (next) => {
      writeLocal(next);
    },
    [writeLocal],
  );

  const setSize = useCallback(
    (id, size) => {
      setLayout((prev) => {
        const next = prev.map((it) => (it.id === id ? { ...it, size } : it));
        persist(next);
        return next;
      });
    },
    [persist],
  );

  const reorder = useCallback(
    (from, to) => {
      setLayout((prev) => {
        const next = prev.slice();
        const [moved] = next.splice(from, 1);
        next.splice(to, 0, moved);
        persist(next);
        return next;
      });
    },
    [persist],
  );

  const replaceAll = useCallback(
    (next) => {
      const merged = computeMerged(next);
      setLayout(merged);
      persist(merged);
    },
    [computeMerged, persist],
  );

  const reset = useCallback(() => {
    const base = fieldKeys.map((k) => ({ id: k, size: 'half' }));
    replaceAll(base);
  }, [fieldKeys, replaceAll]);

  return { layout, setSize, reorder, replaceAll, reset };
}
