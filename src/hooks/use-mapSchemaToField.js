// utils/mapSchemaToFields.js
export function mapSchemaToFields(schema) {
  if (!schema) return [];

  return Object.entries(schema)
    .map(([key, val]) => {
      // Skip internal mongoose keys if you want
      if (['_id', '__v'].includes(key)) return null;

      let type = 'text'; // default
      let options = undefined;

      switch (val.instance) {
        case 'String':
          type = val.enumValues?.length ? 'select' : 'text';
          if (val.enumValues?.length)
            options = val.enumValues.map((v) => ({ label: v, value: v }));
          break;
        case 'Number':
          type = 'number';
          break;
        case 'Boolean':
          type = 'boolean';
          break;
        case 'Date':
          type = 'date';
          break;
        case 'Map':
        case 'Mixed':
          // If schema contains $*, consider as nested fields
          if (val['$*']) type = 'component';
          else type = 'component';
          break;
        case 'ObjectId':
          type = 'relation';
          break;
        default:
          type = 'text';
      }

      return {
        key,
        type,
        label: key[0].toUpperCase() + key.slice(1),
        required: !!val.required,
        default: val.defaultValue ?? null,
        options, // for enums
        relation: type === 'relation' ? { multiple: false } : undefined, // default relation
      };
    })
    .filter(Boolean);
}
