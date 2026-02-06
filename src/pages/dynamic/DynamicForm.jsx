// DynamicForm.jsx
import React, { useState, useEffect } from 'react';
import { IconSettings } from '@tabler/icons-react';
import EditorHeader from '@/components/EditorHeader';
import SavePublishActions from '@/components/SavePublishActions';
import { Button } from '@/components/ui/button';
import renderField from '@/components/RenderFields';
import api from '@/lib/api';
import { toast } from 'react-toastify';
import { getByPath, setByPath } from '@/hooks/use-path';
import RelationInput from '@/components/fields/RelationInput';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import ConfigForm from '@/components/dynamic/ConfigForm';
import { usePermissions } from '@/hooks/use-permissions';
import { useCurrentUser } from '@/hooks/use-currentuser';
import UniDirectionalRelation from '@/components/fields/UniDirectionalRelation';
export default function DynamicForm({
  schema,
  title,
  load,
  type,
  status,
  modelKey,
  endpoint,
  propMethod = 'POST',
  onSubmit,
  initialValues,
}) {
  console.log('initialValues', initialValues);

  const lsKey = `form-layout-${endpoint}`;
  const location = useLocation();
  const path = location.pathname;
  const [values, setValues] = useState(initialValues || {});
  const [layout, setLayout] = useState(schema.map((f) => f.key));
  const [mode, setMode] = useState('form');
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();
  const { can } = usePermissions();
  const [pagesByKey, setPagesByKey] = useState({}); // { [fieldKey]: totalPages }
  const { data: currentUser } = useCurrentUser();
  const [pendingRelations, setPendingRelations] = useState({});

  // Fetch the whole path
  const fullPath = location.pathname;

  // console.log("schema", schema);
  // console.log("initialValues", initialValues);

  // NEW: options state for relation fields
  const [optionsByKey, setOptionsByKey] = useState({}); // { [fieldKey]: [{id,name}, ...] }

  const [loadedOnce, setLoadedOnce] = useState({}); // prevent double-fetch

  const params = useParams();
  // --- Fetcher uses field.ref when optionsEndpoint is missing ---
  const fetchOptionsForField = async (field, opts = {}) => {
    const key = field.key;
    const limit = opts.limit || 20;
    const search = opts.search || '';
    const endpoint =
      field.optionsEndpoint ??
      ROUTE_BY_FIELD[key] ??
      (field.ref ? ROUTE_BY_REF[field.ref] : null) ??
      (field.ref ? toRestPathFromRef(field.ref) : null);

    if (!endpoint) return;

    const nameKey =
      field.nameKey ??
      NAME_KEY_BY_FIELD[key] ??
      (field.ref ? NAME_KEY_BY_REF[field.ref] : undefined);

    let page = 1;
    let totalPages = 1; // default until first response
    let allRows = [];

    try {
      do {
        const params = {
          q: search || undefined,
          page,
          limit,
          ...(field.filter || {}),
        };

        const { data } = await api().get(endpoint, { params, timeout: 30000 }); // 30s timeout per call

        const rows = Array.isArray(data)
          ? data
          : Array.isArray(data?.items)
          ? data.items
          : Array.isArray(data?.data?.items)
          ? data.data.items
          : Array.isArray(data?.results)
          ? data.results
          : Array.isArray(data?.docs)
          ? data.docs
          : [];

        // append new rows
        allRows.push(...rows);

        // set totalPages safely after first response
        totalPages = Number(data?.data?.totalPages ?? data?.totalPages ?? 1);

        // console.log(
        //   `✅ [${key}] Fetched page ${page}/${totalPages} (${rows.length} items)`
        // );

        // stop if we’ve reached the last page or no new data
        if (page >= totalPages || rows.length === 0) break;

        page++;
      } while (page <= totalPages);

      // map to options
      const mapper =
        field.mapOptions || ((rs) => mapRowsToOptions(rs, nameKey));
      const mapped = mapper(allRows);

      setOptionsByKey((s) => ({
        ...s,
        [key]: mapped,
      }));

      setPagesByKey((s) => ({
        ...s,
        [key]: totalPages,
      }));

      setLoadedOnce((s) => ({
        ...s,
        [key]: true,
      }));

      // console.log(`🎯 [${key}] Finished: ${allRows.length} total items`);
      return { totalPages, page };
    } catch (e) {
      console.error(`❌ Failed to load options for ${key}`, e);
      toast.error(`Failed to load options for ${key}: ${e?.message}`);
      setOptionsByKey((s) => ({
        ...s,
        [key]: page > 1 ? s[key] || [] : [],
      }));
    } finally {
      setLoadedOnce((s) => ({ ...s, [key]: true }));
    }
  };

  const saveLayout = () => {
    localStorage.setItem(lsKey, JSON.stringify(layout));
    setMode('form');
  };

  // --- Kick off fetches for all relation fields with ref/optionsEndpoint ---
  useEffect(() => {
    const toFetch = schema
      .filter((f) =>
        [
          'relation',
          'relation[]',
          'unidirectionalrelation',
          'unidirectionalrelation[]',
        ].includes(String(f.type).toLowerCase()),
      )
      .filter(
        (f) =>
          (f.optionsEndpoint || f.ref || ROUTE_BY_FIELD[f.key]) &&
          !loadedOnce[f.key],
      );
    toFetch.forEach(fetchOptionsForField);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [schema]);

  // keep values in sync when initialValues changes
  useEffect(() => {
    if (initialValues == null) return;
    setValues((prev) => {
      try {
        if (JSON.stringify(prev) === JSON.stringify(initialValues)) return prev;
      } catch {
        return initialValues;
      }
      return initialValues;
    });
    setErrors({});
  }, [initialValues]);

  // restore layout
  useEffect(() => {
    const raw = localStorage.getItem(lsKey);
    if (raw) setLayout(JSON.parse(raw));
  }, [lsKey]);

  const updateValue = (key, val) => {
    if (key === '') {
      // If key is empty, just set the whole value
      setValues(val);
      return;
    }

    // console.log("updateValue", key, val);

    setValues((prev) => {
      // Create a copy of the previous values
      const next = structuredClone(prev || {});

      // If we're dealing with a relation field (e.g., blogs), we need to merge it properly
      if (key === 'blogs' && Array.isArray(val)) {
        // If it's the 'blogs' field, we merge the array of selected blog IDs
        next[key] = val;
      } else {
        // Otherwise, just set the value at the specified path
        next[key] = val;
      }

      // Use setByPath to update the specific path in the state
      return setByPath(next, key, val);
    });
  };

  // 1) One function that actually submits via axios
  const doSubmit = async (meta = {}, reason) => {
    // permission guard
    if (!can(modelKey, 'update') && path.startsWith('/single/')) {
      toast.error('You do not have permission to update this item');
      return;
    }
    const isBooking = modelKey === 'booking';

    let payload = { ...values };

    // ----- Status handling -----

    let status = 'draft';

    if (isBooking) {
      // ---- BOOKING LOGIC ----

      console.log('Booking Payload:', payload, meta);
      switch (meta) {
        case 'confirm': // Confirm
          status = 'confirmed';
          payload.status = 'confirmed';
          break;

        case 'cancel': // Cancel
          payload.status = 'cancelled';
          status = 'cancelled';
          payload.rejectionReason = reason;
          break;

        case 'save':
        default:
          status = 'pending';
          payload.status = 'pending';
          break;
      }

      // booking does NOT care about published/draft
      delete payload.published;
    } else {
      // ---- CMS / NORMAL MODELS ----
      switch (meta) {
        case 'publish':
          status = 'published';
          payload.published = true;
          break;

        case 'reject':
          status = 'rejected';
          payload.published = false;
          payload.rejectionReason = reason;
          break;

        case 'draft':
        case 'save':
        default:
          status = 'draft';
          payload.published = false;
          break;
      }

      payload.status = status;
    }

    if (status === 'rejected' && !payload.rejectionReason?.trim()) {
      toast.error('Rejection reason is required.');
      return;
    }

    // ----- VALIDATION -----
    const errors = [];
    schema.forEach((field) => {
      const value = payload[field.key];

      if (field.required && !value) {
        errors.push(`${field.label || field.key} is required.`);
      }

      if (
        field.key === 'email' &&
        value &&
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
      ) {
        errors.push('Email is invalid.');
      }

      if (field.key === 'contact' && value && value.length < 10) {
        errors.push('Contact number must be at least 10 digits.');
      }
    });

    console.log(
      'Validation errors',
      payload,
      payload['paymentConfig.partial.enabled'],
      errors,
    );

    // ---- CONDITIONAL VALIDATION (correct position) ----
    const partialEnabled = getByPath(payload, 'paymentConfig.partial.enabled');
    const partialPrice = getByPath(payload, 'paymentConfig.partial.price');

    if (partialEnabled) {
      if (
        partialPrice === undefined ||
        partialPrice === null ||
        partialPrice === '' ||
        Number(partialPrice) <= 0
      ) {
        errors.push(
          'Partial Payment Price must be greater than 0 when Partial Payment is enabled.',
        );
      }
    }

    if (errors.length > 0) {
      errors.forEach((e) => toast.error(e));
      return;
    }

    payload.status = status;

    // ----- UNFLATTEN DOT KEYS -----
    function unflattenDotKeys(input) {
      if (Array.isArray(input)) return input.map(unflattenDotKeys);
      if (input && typeof input === 'object') {
        const out = {};
        for (const [k, v] of Object.entries(input)) {
          if (k.includes('.')) {
            setByPath(out, k, unflattenDotKeys(v));
          } else {
            out[k] = unflattenDotKeys(v);
          }
        }
        return out;
      }
      return input;
    }

    try {
      let payloadToSend = structuredClone(payload);
      payloadToSend = unflattenDotKeys(payloadToSend);

      console.log('Submitting payload', payloadToSend, schema);

      // ----- MAIN SAVE -----
      const method = (propMethod || 'POST').toUpperCase();
      // console.log("method", method, endpoint, payloadToSend);
      const res = await api().request({
        url: endpoint,
        method,
        data: payloadToSend,
      });

      const saved = res.data?.data ?? res.data;

      // important: get saved ID for relation actions
      const savedId = saved?._id || initialValues?._id;

      // console.log("saved", saved);

      // ----- APPLY UNIDIRECTIONAL RELATIONS -----
      if (pendingRelations && savedId) {
        for (const key in pendingRelations) {
          const r = pendingRelations[key];

          const { add = [], remove = [], kind, fromType, toType } = r;

          // ADD
          for (const toId of add) {
            await api().post('/api/relations/add', {
              kind,
              fromId: savedId,
              fromType,
              toId,
              toType,
            });
          }

          // REMOVE
          for (const toId of remove) {
            await api().post('/api/relations/remove', {
              kind,
              fromId: savedId,
              toId,
            });
          }
        }
      }

      // ----- SUCCESS HANDLING -----
      if (isBooking) {
        if (payload.status === 'pending')
          toast.success('Booking saved as pending');
        else if (payload.status === 'confirmed')
          toast.success('Booking confirmed');
        else if (payload.status === 'cancelled')
          toast.success('Booking cancelled');
      } else {
        if (status === 'draft') toast.success('Saved successfully');
        else if (status === 'published')
          toast.success('Published successfully');
        else if (status === 'rejected') toast.success('Rejected successfully');
      }

      onSubmit && onSubmit(saved);

      type === 'single'
        ? load
          ? load()
          : navigate(`/single/${modelKey}`, { replace: true })
        : navigate(`/content/${modelKey}`, { replace: true });
    } catch (err) {
      toast.error(`Failed to submit: ${err?.message}`);
      console.error('submit failed', err?.message || err);
    }
  };

  // 2) Wrapper that accepts either an event (form submit) OR a meta payload (SavePublishActions)
  const handleSubmit = (eOrMeta, maybeReason) => {
    if (eOrMeta && typeof eOrMeta.preventDefault === 'function') {
      eOrMeta.preventDefault();
      return doSubmit(); // normal form submit
    }
    // called from SavePublishActions with a meta payload

    return doSubmit(eOrMeta || {}, maybeReason);
  };

  // ---- helper: map rows to {id, name} with robust fallbacks ----
  const mapRowsToOptions = (rows, nameKey) => {
    if (!Array.isArray(rows)) return [];
    return rows.map((r) => ({
      id: r?.id ?? r?._id ?? r?.value ?? String(r),
      name:
        (nameKey ? r?.[nameKey] : undefined) ??
        r?.name ??
        r?.title ??
        r?.label ??
        r?.tag ??
        r?.monthTag ??
        (typeof r === 'string' ? r : r?.id ?? r?._id ?? ''),
      _raw: r,
    }));
  };

  // (keep your existing helpers if you use them elsewhere)
  const toRestPathFromRef = (ref) => {
    if (!ref) return null;
    const slug = String(ref)
      .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
      .replace(/\s+/g, '-')
      .toLowerCase();
    const plural = slug.endsWith('s')
      ? slug
      : slug.endsWith('y')
      ? slug.slice(0, -1) + 'ies'
      : slug + 's';
    return `/api/${plural}`;
  };

  // default label key per ref (tweak per your collections)
  const labelKeyByRef = {
    Destination: 'name',
    Experience: 'title',
    Tour: 'title',
    Blog: 'title',
    Category: 'name',
    Tag: 'name',
  };

  const resolvedStatus = status || values?.status || initialValues?.status;

  return (
    <div className='p-0'>
      <EditorHeader
        status={resolvedStatus}
        title={title}
        onBack={() => history.back()}
        editButton={
          <div className='flex gap-2'>
            {mode === 'form' && (
              <Button
                type='button'
                variant='outline'
                size='sm'
                onClick={() => setMode('config')}
                className='flex items-center gap-1'>
                <IconSettings className='h-4 w-4' />
                Config
              </Button>
            )}
          </div>
        }
      />

      <div className='flex w-full p-4'>
        {mode === 'form' ? (
          <>
            <form className='w-full flex max-w-screen' onSubmit={handleSubmit}>
              <div className='grid w-full grid-cols-2 gap-4 px-6'>
                {layout.map((id) => {
                  const field = schema.find((f) => f.key === id);
                  if (!field) return null;
                  const hasError = !!errors[field.key];
                  const isRelation = ['relation', 'relation[]'].includes(
                    String(field.type).toLowerCase(),
                  );
                  const isUnidirectionalRelation = [
                    'unidirectionalrelation',
                    'unidirectionalrelation[]',
                  ].includes(String(field.type).toLowerCase());

                  {
                    /* console.log("field", field.type, isUnidirectionalRelation); */
                  }

                  const resolvedNameKey =
                    field.nameKey ??
                    (field.ref ? labelKeyByRef[field.ref] : undefined);

                  const mergedField =
                    isRelation || isUnidirectionalRelation
                      ? {
                          ...field,
                          options:
                            field.options ?? optionsByKey[field.key] ?? [],
                          nameKey: resolvedNameKey,
                        }
                      : field;

                  {
                    /* console.log("mergedField", mergedField); */
                  }

                  // Add a conditional class for full-width fields
                  const fieldClass =
                    field.width === '100%' ||
                    field.key === 'heroSlide' ||
                    field.key === 'group' ||
                    field.key === 'review'
                      ? 'col-span-2'
                      : ''; // span 2 columns if width is 100%
                  return (
                    <div
                      key={id}
                      className={`flex flex-col gap-1 ${fieldClass}`} // Apply the full-width class here
                      data-field={field.key}>
                      <label className='font-medium text-gray-700 dark:text-gray-300 text-sm'>
                        {field.label || field.key}
                        {field.required && (
                          <span className='ml-1 text-red-600'>*</span>
                        )}
                      </label>

                      <div
                        className={
                          hasError ? 'ring-2 ring-red-500 rounded-md p-1' : ''
                        }>
                        {isRelation ? (
                          <>
                            <RelationInput
                              nameKey={resolvedNameKey}
                              label={field.label || field.key}
                              onChange={updateValue}
                              options={optionsByKey[field.key]} // dynamically fetched options
                              value={values[field.key]}
                              multiple={field.type === 'relation[]'}
                              pages={pagesByKey[field.key]} // ✅ Pass total pages for this field
                              searchQuery={field.searchQuery} // optional: if searching is allowed
                              getOptions={() =>
                                fetchOptionsForField(field, { page: 1 })
                              }
                              searchOptions={(query, extra) =>
                                fetchOptionsForField(field, {
                                  search: query,
                                  page: extra?.page || 1,
                                })
                              }
                            />
                          </>
                        ) : isUnidirectionalRelation ? (
                          <UniDirectionalRelation
                            field={field}
                            nodeId={params.id}
                            onTrackChanges={(data) => {
                              setPendingRelations((prev) => ({
                                ...prev,
                                [field.key]: data,
                              }));
                            }}
                            options={optionsByKey[field.key]}
                            pages={pagesByKey[field.key]}
                            nameKey={resolvedNameKey}
                            getOptions={() =>
                              fetchOptionsForField(field, { page: 1 })
                            }
                            searchOptions={(q, extra) =>
                              fetchOptionsForField(field, {
                                page: extra?.page || 1,
                                search: q,
                              })
                            }
                          />
                        ) : (
                          renderField(
                            mergedField,
                            values,
                            updateValue,
                            resolvedNameKey,
                            field,
                            fetchOptionsForField,
                            optionsByKey,
                          )
                        )}
                      </div>

                      {hasError && (
                        <p className='text-xs text-red-600'>
                          {errors[field.key]}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
              <div className='w-full max-w-xs pt-6'>
                <SavePublishActions
                  orientation='row'
                  fullWidth={false}
                  param={fullPath}
                  onAction={(meta, reason) => handleSubmit(meta, reason)}
                  /* ---------- COMMON ---------- */
                  showSave={true}
                  saveLabel={modelKey === 'booking' ? 'Save (Pending)' : 'Save'}
                  /* ---------- BOOKING ---------- */
                  showConfirm={modelKey === 'booking'}
                  confirmLabel='Confirm Booking'
                  showCancel={modelKey === 'booking' && !!initialValues}
                  cancelLabel='Cancel Booking'
                  /* ---------- NON-BOOKING MODELS ---------- */
                  showPublish={
                    modelKey !== 'booking' && can(modelKey, 'publish')
                  }
                  publishLabel='Publish'
                  showReject={
                    modelKey !== 'booking' &&
                    !['blog', 'tour'].includes(modelKey) &&
                    can(modelKey, 'reject')
                  }
                />
              </div>
            </form>

            {/* config mode panel omitted for brevity (unchanged) */}
          </>
        ) : (
          <ConfigForm
            layout={layout}
            schema={schema}
            setLayout={setLayout}
            saveLayout={saveLayout}
            resetLayout={() => setLayout(schema.map((f) => f.key))}
            mode={mode}
          />
        )}
      </div>
    </div>
  );
}

// ---- Hardcoded endpoints by FIELD KEY (highest priority) ----
const ROUTE_BY_FIELD = {
  // use your actual form field keys here
  blog: '/api/blog',
  blogs: '/api/blog',
  categories: '/api/categories',
  category: '/api/categories',
  destinations: '/api/destinations',
  destination: '/api/destinations',
  experiences: '/api/experiences',
  experience: '/api/experiences',
  campaigns: '/api/campaigns',
  campaign: '/api/campaigns',
  campaignforms: '/api/campaignforms',
  campaignForm: '/api/campaignforms',
  lead: '/api/lead',
  months: '/api/months',
  month: '/api/months',
  testimonials: '/api/testimonial',
  testimonial: '/api/testimonial',
  // use moderation endpoint so admin sees all tours (draft/published)
  tour: '/api/tour/moderation',
  tours: '/api/tour/moderation',
  layouts: '/api/layouts',
  layout: '/api/layouts',
};

// ---- Hardcoded endpoints by REF (secondary) ----
const ROUTE_BY_REF = {
  Blog: '/api/blog',
  Campaign: '/api/campaigns',
  CampaignForm: '/api/campaignforms',
  Category: '/api/categories',
  Destination: '/api/destinations',
  Experience: '/api/experiences',
  Lead: '/api/lead',
  Month: '/api/months',
  Testimonial: '/api/testimonial',
  // moderation endpoint exposes full list for admin relations
  Tour: '/api/tour/moderation',
  Layout: '/api/layouts',
};

// ---- Label (name) keys for options -> { id, name } mapping ----
const NAME_KEY_BY_FIELD = {
  blog: 'title',
  blogs: 'title',
  categories: 'name',
  category: 'name',
  destinations: 'name',
  destination: 'name',
  experiences: 'title',
  experience: 'title',
  campaigns: 'title',
  campaign: 'title',
  campaignforms: 'title',
  campaignForm: 'title',
  lead: 'name',
  months: 'name',
  month: 'name',
  testimonials: 'name',
  testimonial: 'name',
  tour: 'title',
  tours: 'title',
  layouts: 'name',
  layout: 'name',
};

const NAME_KEY_BY_REF = {
  Blog: 'title',
  Campaign: 'title',
  CampaignForm: 'title',
  Category: 'name',
  Destination: 'name',
  Experience: 'title',
  Lead: 'name',
  Month: 'name',
  Testimonial: 'name',
  Tour: 'title',
  Layout: 'name',
};
