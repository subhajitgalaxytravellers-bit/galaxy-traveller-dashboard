import React from "react";
import RelationInput from "./RelationInput";
import api from "@/lib/api";

export default function UniDirectionalRelation({
  field,
  nodeId,
  onTrackChanges,
  nameKey,
  getOptions,
  searchOptions,
  options,
  pages,
}) {
  const [selected, setSelected] = React.useState([]);
  const initialRef = React.useRef([]);

  // ----------------------------------------
  // Load existing relations ONCE
  // ----------------------------------------
  React.useEffect(() => {
    if (!nodeId) return;

    api()
      .get(`/api/relations/${field.kind}/${nodeId}`)
      .then((res) => {
        const ids = res.data.relations.map((r) => {
          const from = String(r.from.id);
          const to = String(r.to.id);
          const node = String(nodeId);

          return from === node ? to : from;
        });

        console.log("ids", ids, "res", res.data);

        initialRef.current = ids;
        setSelected(ids);

        onTrackChanges({
          key: field.key,
          kind: field.kind,
          fromType: field.fromType,
          toType: field.toType,
          initial: ids,
          add: [],
          remove: [],
        });
      })
      .catch((e) => console.error("Failed loading relations", e));
  }, [nodeId]);

  // ----------------------------------------
  // Handle selection changes
  // ----------------------------------------
  const handleChange = (_, newList) => {
    const safeList = Array.isArray(newList) ? newList : []; // FIX

    const initial = initialRef.current;

    const add = safeList.filter((id) => !initial.includes(id));
    const remove = initial.filter((id) => !safeList.includes(id));

    setSelected(safeList);

    onTrackChanges({
      key: field.key,
      kind: field.kind,
      fromType: field.fromType,
      toType: field.toType,
      initial,
      add,
      remove,
    });
  };

  // console.log(
  //   "field",
  //   field,
  //   "nodeId",
  //   nodeId,
  //   "selected",
  //   selected,
  //   "initialRef",
  //   initialRef.current,
  //   "onTrackChanges",
  //   onTrackChanges,
  //   "options",
  //   options,
  //   "pages",
  //   pages,
  //   "getOptions",
  //   getOptions,
  //   "searchOptions",
  //   searchOptions,
  //   "nameKey",
  //   nameKey
  // );

  console.log("selected", selected);

  return (
    <RelationInput
      multiple
      value={selected}
      onChange={handleChange}
      placeholder={`Select ${field.label || field.key}`}
      options={options}
      nameKey={nameKey}
      pages={pages}
      getOptions={getOptions}
      searchOptions={searchOptions}
    />
  );
}
