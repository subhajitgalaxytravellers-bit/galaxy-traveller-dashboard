import React, { useState } from "react";
import { Button } from "../ui/button";
import {
  IconPlus,
  IconTrash,
  IconChevronDown,
  IconChevronUp,
} from "@tabler/icons-react";
import renderField from "@/components/RenderFields";
import { setByPath } from "@/hooks/use-path";
import RelationInput from "./RelationInput";

// Safely escape a string for use in RegExp
function escapeRegExp(s = "") {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Convert dotted child keys from "arrayKey.child" -> "child" (relative)
 * and recurse into nested field arrays.
 */
function stripBasePrefix(fields = [], baseKey) {
  const rx = new RegExp(`^${escapeRegExp(baseKey)}\\.`);
  return fields.map((f) => ({
    ...f,
    key: f.key?.replace(rx, "") || f.key,
    fields: Array.isArray(f.fields)
      ? stripBasePrefix(f.fields, baseKey)
      : f.fields,
  }));
}

/**
 * Build a minimal empty item based on field types
 * (so clicking "Add" gives sensible empty shapes).
 */
function buildEmptyItem(fields = []) {
  let obj = {};
  for (const f of fields) {
    const t = String(f.type || "").toLowerCase();
    let def;
    if (t === "object") def = {};
    else if (t === "object[]") def = [];
    else if (t === "switch" || t === "boolean") def = false;
    else if (t === "number") def = "";
    else if (t === "relation[]") def = [];
    else def = ""; // text, textarea, date, image, relation, richtext...

    // Use setByPath so "blocks.title" becomes { blocks: { title: "" } }
    obj = setByPath(obj, f.key, def);
  }
  return obj;
}

export default function ObjectArrayField({
  value = [],
  onChange,
  fields = [],
  className = "",
  fetchOptionsForField,
  optionsByKey,
}) {
  const arrayVal = Array.isArray(value) ? value : [];

  // console.log("ObjectArrayField", fields, arrayVal);

  const [expandedItems, setExpandedItems] = useState(arrayVal.map(() => false));

  const firstKey = fields?.[0]?.key || "";
  const baseKey = firstKey.includes(".") ? firstKey.split(".")[0] : firstKey;
  const relativeFields = stripBasePrefix(fields, baseKey);

  const addItem = () => {
    const empty = buildEmptyItem(relativeFields);
    onChange([...arrayVal, empty]);
    setExpandedItems((prev) => [...prev, true]);
  };

  const removeAt = (idx) => {
    onChange(arrayVal.filter((_, i) => i !== idx));
    setExpandedItems(expandedItems.filter((_, i) => i !== idx));
  };

  const toggleExpand = (idx) => {
    setExpandedItems((prev) => prev.map((v, i) => (i === idx ? !v : v)));
  };

  const makeItemUpdater = (idx) => (key, val) => {
    const prevItem = arrayVal[idx] ?? {};
    const nextItem =
      key === "" ? val ?? {} : setByPath(structuredClone(prevItem), key, val);
    const nextArr = [...arrayVal];
    nextArr[idx] = nextItem;
    onChange(nextArr);
  };

  const widthToSpanClass = (w = "") => {
    const map = {
      "100%": "sm:col-span-2",
      "50%": "sm:col-span-1",
    };
    return map[(w || "").trim()] || "sm:col-span-2"; // default full width
  };

  return (
    <div className={["flex flex-col gap-4", className].join(" ")}>
      {arrayVal.length > 0 && (
        <div className="flex flex-col gap-4">
          {arrayVal.map((item, idx) => (
            <div
              key={idx}
              className="relative rounded-xl border bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition"
            >
              {/* Header bar (clickable for expand/collapse) */}
              <div
                onClick={() => toggleExpand(idx)}
                className={`cursor-pointer h-13 flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800   hover:bg-gray-100 dark:hover:bg-gray-700 transition ${
                  expandedItems[idx] ? "rounded-t-xl" : "rounded-xl"
                }`}
              >
                <div className="flex items-center gap-2 text-sm font-medium">
                  {expandedItems[idx] ? (
                    <IconChevronUp className="h-4 w-4" />
                  ) : (
                    <IconChevronDown className="h-4 w-4" />
                  )}
                  <span>Item {idx + 1}</span>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation(); // prevent toggle when clicking remove
                    removeAt(idx);
                  }}
                  className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-600"
                >
                  <IconTrash className="h-4 w-4 text-red-600" />
                </button>
              </div>

              {/* Fields container */}
              {expandedItems[idx] && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 border-t border-gray-200 dark:border-gray-700 auto-rows-auto">
                  {relativeFields.map((sub) => {
                    const isRelation = ["relation", "relation[]"].includes(
                      String(sub.type).toLowerCase()
                    );
                    const updater = makeItemUpdater(idx);
                    const val = item || {};
                    const resolvedNameKey =
                      sub.nameKey ??
                      (sub.ref ? NAME_KEY_BY_REF[sub.ref] : undefined);
                    const spanClass = widthToSpanClass(sub.width);
                    return (
                      <div
                        key={`${idx}-${sub.key}`}
                        className={`w-full ${spanClass}`}
                      >
                        {isRelation ? (
                          <RelationInput
                            nameKey={resolvedNameKey}
                            label={sub.label || sub.key}
                            onChange={(fieldKey, v) => updater(sub.key, v)}
                            options={optionsByKey[sub.key] ?? []}
                            value={val[sub.key]}
                            multiple={sub.type === "relation[]"}
                            getOptions={() =>
                              fetchOptionsForField(sub, { page: 1 })
                            }
                            searchOptions={(query, extra) =>
                              fetchOptionsForField(sub, {
                                search: query,
                                page: extra?.page || 1,
                              })
                            }
                          />
                        ) : (
                          renderField(sub, val, updater)
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add button */}
      <button
        type="button"
        onClick={addItem}
        className="group relative w-full border-dashed border  border-gray-300 dark:border-gray-600 rounded-md py-2 flex items-center justify-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
      >
        <IconPlus className="h-4 w-4" />
        <span>Add</span>
      </button>
    </div>
  );
}

const NAME_KEY_BY_REF = {
  Blog: "title",
  Campaign: "title",
  CampaignForm: "title",
  Category: "name",
  Destination: "name",
  Experience: "title",
  Lead: "name",
  Month: "name",
  Spotlight: "title",
  Testimonial: "name",
  Tour: "title",
  Layout: "name",
};
