export function collectionNameFromKey(key = "", type = "collection") {
  const k = (key || "").trim().toLowerCase();
  if (!k) return "";
  if (type === "single") return k;
  // naive pluralization
  if (/[^\Waeiou]y$/.test(k)) return k.replace(/y$/, "ies"); // category -> categories
  if (/(s|x|z|ch|sh)$/.test(k)) return k + "es"; // class -> classes
  return k + "s"; // blog -> blogs
}
