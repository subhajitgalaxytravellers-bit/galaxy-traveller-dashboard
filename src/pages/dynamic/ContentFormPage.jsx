// src/pages/ContentFormPage.jsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "@/lib/api"; // axios factory
import DynamicForm from "./DynamicForm";
import { toast } from "react-toastify";
import uiSchemas from "@/data/uischema";
import { useCurrentUser } from "@/hooks/use-currentuser";

export default function ContentFormPage() {
  const { modelKey, id } = useParams();
  const navigate = useNavigate();

  const [schema, setSchema] = useState(null);
  const [initialValues, setInitialValues] = useState(null);
  const [loading, setLoading] = useState(true);

  const { data: currentUser, isLoading: meLoading } = useCurrentUser();

  // compute once per role change
  const HIDE_FIELDS = React.useMemo(() => {
    const s = new Set([
      "updatedBy",
      "createdAt",
      "updatedAt",
      // ""  // ← remove this accidental empty key
      "__v",
      "_id",
      "extra",
      "extras",
      "status",
    ]);

    let checkModel;
    if (modelKey === "tour") {
      checkModel = false;
    } else if (modelKey === "blog") {
      checkModel = false;
    } else {
      checkModel = true;
    }
    console.log(`modelKey: ${modelKey}, ${checkModel}`);
    if (
      (currentUser?.roleName || "").toLowerCase() === "creator" ||
      checkModel
    ) {
      s.add("createdByRole");
      s.add("createdBy");
      s.add("tourCreatedBy");
    }

    return s;
  }, [currentUser?.roleName]);

  const ALWAYS_INCLUDE = React.useMemo(
    () =>
      new Set([
        "status",
        "rejectionReason",
        "published",
        "createdAt",
        "updatedAt",
      ]),
    []
  );

  useEffect(() => {
    let mounted = true;

    // Wait for user (so HIDE_FIELDS is correct) before shaping schema/values
    if (meLoading) return;

    const normalizeSchema = (schema) => {
      if (Array.isArray(schema)) {
        return schema.map((f) => ({
          key: f.key ?? f.name ?? f.id,
          ...f,
        }));
      }
      return Object.entries(schema || {}).map(([k, f]) => ({ key: k, ...f }));
    };

    const filterFields = (fieldsArr) =>
      (fieldsArr || [])
        .filter((f) => f?.key && !HIDE_FIELDS.has(f.key) && !f?.ui?.hidden)
        .map((f) => {
          const isObjectish =
            f.type === "object" || f.type === "object[]" || f.type === "group";
          if (isObjectish && Array.isArray(f.fields)) {
            return { ...f, fields: filterFields(f.fields) };
          }
          return f;
        });

    const pickByKeys = (obj, allowedKeys) =>
      Object.fromEntries(
        Object.entries(obj || {}).filter(([k]) => allowedKeys.has(k))
      );

    const pickForFormValues = (obj, visibleKeys) => {
      const keys = new Set([...visibleKeys, ...ALWAYS_INCLUDE]);
      return pickByKeys(obj, keys);
    };

    const fetchSchemaAndRecord = async () => {
      try {
        const def = uiSchemas.find((schema) => schema.modelKey === modelKey);
        if (!mounted || !def) return;

        const normalized = normalizeSchema(def?.fields);
        const filtered = filterFields(normalized);

        setSchema(filtered);

        const allowedKeys = new Set(filtered.map((f) => f.key));

        if (id) {
          const { data: rec } = await api().get(
            `/api/${modelKey}/moderation/${id}`
          );
          if (!mounted) return;

          const filteredValues = pickForFormValues(rec?.data, allowedKeys);
          setInitialValues(filteredValues);
        }
      } catch (err) {
        toast.error("Failed to load model or record");
        console.log("load failed", err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchSchemaAndRecord();
    return () => {
      mounted = false;
    };
    // IMPORTANT: include currentUser role + meLoading so hide set re-evaluates
  }, [modelKey, id, HIDE_FIELDS, ALWAYS_INCLUDE, meLoading]);

  // ---- after save success ----
  const onSubmitSuccess = (payload) => {
    const doc = payload?.data || payload?.doc || payload; // normalize

    const newId = doc?._id || id;
    if (!id && newId) {
      navigate(`/${modelKey}`, { replace: true });
    }
  };

  if (loading) return <div>Loading...</div>;
  if (!schema) return <div>No schema found</div>;
  const endpoint = id
    ? `/api/${modelKey}/moderation/${id}`
    : `/api/${modelKey}/moderation`;
  const method = id ? "PATCH" : "POST";

  return (
    <div className="p-0  h-screen overflow-y-auto">
      <DynamicForm
        schema={schema}
        title={`${id ? "Edit" : "New"} ${modelKey}`}
        initialValues={initialValues}
        endpoint={endpoint}
        propMethod={method}
        modelKey={modelKey}
        onSubmit={onSubmitSuccess}
      />
    </div>
  );
}
