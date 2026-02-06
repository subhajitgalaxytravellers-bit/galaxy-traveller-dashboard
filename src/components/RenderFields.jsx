// renderField.js
import TextField from "./fields/TextField";
import NumberField from "./fields/NumberField";
import TextAreaField from "./fields/TextAreaField";
import RichTextField from "./fields/RichTextField";
import SwitchField from "./fields/SwitchField";
import DateField from "./fields/DateField";
import ObjectArrayField from "./fields/ObjectArrayField";
import EnumDropdown from "./fields/EnumDropDown";
import { PrimitiveArrayField } from "./PrimitiveArrayField";
import { ImageField, MultiImageField } from "./images/ImagePickerDialog";
import { getByPath } from "@/hooks/use-path";
import VideoField from "./fields/VideoField";

/* -------------------------------- renderer ------------------------------- */
const renderField = (
  mergeField,
  values,
  updateValue,
  resolvedNameKey,
  field,
  fetchOptionsForField,
  optionsByKey
) => {
  const { key, type, label, fields } = mergeField;
  const pretty = String(label ?? key ?? ""); // never "undefined"

  const initial = type === "object" ? {} : "";
  const val = getByPath(values, key, initial);

  // write only the field path (avoids whole object churn)
  const setVal = (v) => {
    // console.log("setVal", key, v);

    updateValue(key, v);
  };

  switch (type) {
    case "text":
    case "string":
      return (
        <TextField
          value={val ?? ""}
          onChange={setVal}
          placeholder={`${pretty}`}
          field={field}
        />
      );

    case "textarea":
      return (
        <TextAreaField
          value={val ?? ""}
          onChange={setVal}
          field={field}
          placeholder={`${pretty}`}
        />
      );

    case "richtext":
      return (
        <RichTextField
          label={label || key}
          value={val ?? ""}
          field={field}
          onChange={setVal}
          placeholder={`${pretty}`}
        />
      );

    case "enumDropdown":
      return (
        <EnumDropdown
          options={mergeField.enumValues || []}
          field={field}
          value={val ?? ""}
          onChange={setVal}
          label={label}
          className={mergeField.className}
        />
      );

    case "number":
      return (
        <NumberField
          field={field}
          value={val ?? ""}
          onChange={setVal}
          placeholder={`${pretty}`}
        />
      );

    case "boolean":
    case "switch":
      return (
        <SwitchField
          checked={!!val}
          onChange={setVal}
          field={field}
          label={label}
        />
      );

    case "date":
      return (
        <DateField
          value={val ?? ""}
          onChange={setVal}
          field={field}
          placeholder={`Select ${pretty}`}
        />
      );

    case "image":
      return (
        <ImageField
          value={val ?? ""}
          onChange={setVal}
          field={field}
          initialPath={mergeField.folder || ""}
          returnType="path" // or 'signedUrl' | 'publicUrl'
        />
      );

    case "video":
      return (
        <VideoField
          label={label || key}
          multiple={mergeField.multiple || false}
          value={val ?? (mergeField.multiple ? [] : "")}
          onChange={setVal}
        />
      );

    case "video[]":
      return (
        <VideoField
          label={label || key}
          multiple={true}
          value={val ?? []}
          onChange={setVal}
        />
      );

    case "image[]":
      return (
        <MultiImageField
          value={Array.isArray(val) ? val : []}
          onChange={setVal}
          field={field}
          initialPath={mergeField.folder || ""}
          returnType="path"
        />
      );

    case "object":
      return (
        <div className="grid grid-cols-2 gap-4 w-full p-3 rounded-md border border-gray-200 dark:border-gray-800  bg-gray-50 dark:bg-gray-900">
          {(fields || []).map((sub) => (
            <div key={sub.key}>{renderField(sub, values, updateValue)}</div>
          ))}
        </div>
      );

    case "object[]":
      return (
        <ObjectArrayField
          fields={fields || []}
          value={Array.isArray(val) ? val : []}
          onChange={setVal}
          label={label || key}
          resolvedNameKey={resolvedNameKey}
          fetchOptionsForField={fetchOptionsForField}
          optionsByKey={optionsByKey}
        />
      );

    default: {
      // primitive arrays: 'string[]', 'number[]', 'date[]', 'image[]', etc.
      if (/\[\]$/.test(type || "")) {
        const base = String(type).slice(0, -2).toLowerCase(); // remove []
        return (
          <PrimitiveArrayField
            elementType={base || "string"}
            field={field}
            value={Array.isArray(val) ? val : []}
            onChange={setVal}
            placeholder={`Add ${pretty}`}
          />
        );
      }
      // fallback read-only
      return (
        <span className="text-sm text-gray-700 dark:text-gray-300">
          {String(val ?? "")}
        </span>
      );
    }
  }
};

export default renderField;
