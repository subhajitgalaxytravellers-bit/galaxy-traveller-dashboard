// src/lib/getIconComponent.js
import * as TablerIcons from "@tabler/icons-react";

/**
 * Returns a Tabler icon component by its short name.
 * @param {string} name - e.g. "Folder" or "FileText"
 * @param {string} fallback - fallback icon short name
 */
export function getIconComponent(name, fallback = "Folder") {
  if (!name) name = fallback;

  // Tabler icons are exported as IconFolder, IconFileText, etc.
  const iconName = name.startsWith("Icon") ? name : `Icon${name}`;

  return TablerIcons[iconName] || TablerIcons[`Icon${fallback}`];
}
