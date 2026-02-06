// src/pages/SingleFormPage.jsx
import React, { useEffect, useState, useMemo } from "react";
import { useParams } from "react-router-dom";
import api from "@/lib/api";
import DynamicForm from "./DynamicForm";
import { toast } from "react-toastify";
import RequirePerm from "@/components/guard/RequirePerm";
import uiSchemas from "@/data/uischema";

export default function SingleFormPage() {
  const { modelKey } = useParams();
  const [schema, setSchema] = useState(null);
  const [initialValues, setInitialValues] = useState(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState(null);

  // fields we never render/edit
  const HIDE_FIELDS = useMemo(
    () =>
      new Set([
        "createdBy",
        "updatedBy",
        "createdAt",
        "updatedAt",
        "status",
        "__v",
        "_id", // no id for singleton edit
        "extras", // if you store junk here
        "extra",
      ]),
    []
  );

  const normalizeSchema = (raw) => {
    if (Array.isArray(raw)) {
      return raw.map((f) => ({ key: f.key ?? f.name ?? f.id, ...f }));
    }
    return Object.entries(raw || {}).map(([k, f]) => ({ key: k, ...f }));
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

  function formatSiteString(str) {
    if (!str) return "";

    // Remove 'site_' prefix
    let result = str.replace(/^site_/, "");

    // If it ends with 'list', remove it and add ' List'
    if (result.toLowerCase().endsWith("list")) {
      result = result.slice(0, -4) + " List";
    }

    // Split by underscores or camelCase and capitalize each word
    result = result
      .replace(/_/g, " ") // replace underscores with space
      .replace(/([a-z])([A-Z])/g, "$1 $2") // split camelCase
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");

    return result;
  }
  async function load() {
    let mounted = true;

    try {
      setLoading(true);

      // 1) Load schema from uischema.js (instead of API)
      const uiSchemaData = uiSchemas.find(
        (schema) => schema.modelKey === modelKey
      );
      if (!mounted || !uiSchemaData) return;

      const normalized = normalizeSchema(uiSchemaData?.fields);
      const filteredSchema = filterFields(normalized);

      setSchema(filteredSchema);

      const allowedKeys = new Set(filteredSchema.map((f) => f.key));

      // 2) Load singleton (create-if-missing handled on backend GET /moderation)
      const { data: rec } = await api().get(`/api/${modelKey}/moderation`);
      if (!mounted) return;

      const body = rec?.data ?? rec;
      setStatus(body?.status);

      const init = pickByKeys(body, allowedKeys);
      setInitialValues(init);
    } catch (err) {
      console.error("[SingleForm] load failed", err);
      toast.error("Failed to load form");
    } finally {
      if (mounted) setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [modelKey]);

  const onSubmitSuccess = (result) => {
    // optionally update initialValues with latest data to avoid dirty state
    const data = result?.data ?? result;
    if (data && schema) {
      const allowedKeys = new Set(schema.map((f) => f.key));
      setInitialValues(pickByKeys(data, allowedKeys));
    }
  };

  if (loading) return <div>Loading…</div>;
  if (!schema) return <div>No schema found</div>;

  return (
    <div className="p-0 h-screen overflow-y-auto">
      <RequirePerm
        model={modelKey}
        action="read"
        fallback={<div>You don't have access</div>}
      >
        <DynamicForm
          schema={schema}
          title={`Edit ${formatSiteString(modelKey) || modelKey}`}
          type={"single"}
          load={load}
          status={status}
          initialValues={initialValues}
          endpoint={`/api/${modelKey}/moderation`}
          propMethod="PATCH"
          modelKey={modelKey}
          onSubmit={onSubmitSuccess}
        />
      </RequirePerm>
    </div>
  );
}
