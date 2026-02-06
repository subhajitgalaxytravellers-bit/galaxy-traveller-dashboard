// utils/path.js (or ../hooks/use-path)
export function getByPath(obj, path, fallback) {
  if (typeof path !== "string" || !path) return fallback;
  const parts = path.replace(/\[(\d+)\]/g, ".$1").split(".");
  let cur = obj;
  for (let i = 0; i < parts.length; i++) {
    if (cur == null) return fallback;
    const key = parts[i];
    cur = /^\d+$/.test(key) ? cur?.[Number(key)] : cur?.[key];
  }
  return cur == null ? fallback : cur;
}

export function setByPath(obj, path, value) {
  if (typeof path !== "string" || !path) return obj;
  const parts = path.replace(/\[(\d+)\]/g, ".$1").split(".");

  const root = obj || {};
  let cur = root;

  for (let i = 0; i < parts.length - 1; i++) {
    const key = parts[i];
    const nextKey = parts[i + 1];
    const nextIsIndex = /^\d+$/.test(nextKey);

    if (/^\d+$/.test(key)) {
      const idx = Number(key);
      if (!Array.isArray(cur)) {
        // convert to array if needed
        // (ideally caller keeps containers consistent)
        cur = [];
      }
      if (cur[idx] == null) cur[idx] = nextIsIndex ? [] : {};
      cur = cur[idx];
    } else {
      if (cur[key] == null || typeof cur[key] !== "object") {
        cur[key] = nextIsIndex ? [] : {};
      }
      cur = cur[key];
    }
  }

  const last = parts[parts.length - 1];
  if (/^\d+$/.test(last) && Array.isArray(cur)) {
    cur[Number(last)] = value;
  } else {
    cur[last] = value;
  }
  return root;
}
