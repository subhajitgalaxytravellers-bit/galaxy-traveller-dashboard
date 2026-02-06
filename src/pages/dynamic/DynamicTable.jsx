import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import DataTable from '@/components/DataTable';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import {
  IconPhoto,
  IconCheck,
  IconX,
  IconFile,
  IconSearch,
} from '@tabler/icons-react';
import { debounce } from 'lodash';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectItem,
  SelectContent,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { RejectConfirmationDialog } from '@/components/dialogs/RejectionDialog';
import RequirePerm from '@/components/guard/RequirePerm';
import { usePermissions } from '@/hooks/use-permissions';
import { toast } from 'react-toastify';
import useContentListInfinite from '@/hooks/useContentListInfinite';
import StatusPill from '@/components/StatusField';
/* ----------------------------- small utils ----------------------------- */
const fmtDate = (v) => {
  if (!v) return '-';
  const d = new Date(v);
  return isNaN(d) ? String(v) : d.toLocaleDateString();
};
const countWords = (text = '') =>
  text.trim() ? text.trim().split(/\s+/).filter(Boolean).length : 0;
const getNestedValue = (obj, path) =>
  path?.split('.').reduce((acc, key) => (acc ? acc[key] : undefined), obj);

const titleize = (s) =>
  s
    .replace(/\./g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (m) => m.toUpperCase());

const displayLabel = (v) =>
  v?.name || v?.title || v?.label || v?.slug || v?.id || v || '—';

const readOnlyField = (field, row) => {
  const val = getNestedValue(row, field.key);
  const display =
    val === null || val === undefined
      ? '—'
      : Array.isArray(val)
      ? val.map(displayLabel).join(', ')
      : typeof val === 'object'
      ? displayLabel(val)
      : val;

  switch (field.type) {
    case 'switch':
    case 'boolean':
      return (
        <div className='flex items-center gap-2'>
          <Switch checked={!!val} disabled />
          <span className='text-sm text-gray-700 dark:text-gray-200'>
            {val ? 'Yes' : 'No'}
          </span>
        </div>
      );
    case 'textarea':
    case 'richtext':
      return (
        <Textarea
          value={display}
          readOnly
          className='min-h-[80px] bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700'
          onChange={() => {}}
        />
      );
    case 'date':
      return (
        <Input
          value={fmtDate(val)}
          readOnly
          className='bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700'
        />
      );
    case 'image':
      return val ? (
        <img
          src={val}
          alt={field.label || field.key}
          className='h-16 w-24 object-cover rounded border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800'
        />
      ) : (
        <Input
          value='—'
          readOnly
          className='bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700'
        />
      );
    case 'image[]':
      return Array.isArray(val) && val.length > 0 ? (
        <div className='flex flex-wrap gap-2'>
          {val.map((src, i) => (
            <img
              key={i}
              src={src}
              alt={`${field.label || field.key}-${i}`}
              className='h-12 w-16 object-cover rounded border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800'
            />
          ))}
        </div>
      ) : (
        <Input
          value='—'
          readOnly
          className='bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700'
        />
      );
    case 'relation':
      return (
        <Input
          value={displayLabel(val)}
          readOnly
          className='bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700'
        />
      );
    case 'relation[]':
      return Array.isArray(val) && val.length ? (
        <div className='flex flex-col gap-1'>
          {val.map((item, i) => (
            <div
              key={i}
              className='px-2 py-1 rounded border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm'>
              {displayLabel(item)}
            </div>
          ))}
        </div>
      ) : (
        <Input
          value='—'
          readOnly
          className='bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700'
        />
      );
    case 'object':
      return Array.isArray(field.fields) && field.fields.length ? (
        <div className='grid gap-2'>
          {field.fields.map((child) => (
            <div key={child.key} className='space-y-1'>
              <Label className='text-[11px] uppercase tracking-wide text-muted-foreground'>
                {child.label || titleize(child.key)}
              </Label>
              {readOnlyField(child, row)}
            </div>
          ))}
        </div>
      ) : (
        <Input
          value={display}
          readOnly
          className='bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700'
        />
      );
    case 'object[]':
      return Array.isArray(val) && val.length ? (
        <div className='flex flex-col gap-2'>
          {val.map((item, idx) => (
            <div
              key={idx}
              className='border border-gray-200 dark:border-gray-700 rounded p-2 bg-gray-50 dark:bg-gray-800 space-y-2'>
              {(field.fields || []).map((child) => {
                const parts = String(child.key || '').split('.');
                const relativeKey = parts[parts.length - 1];
                const childRow = {
                  ...item,
                  [child.key]: item[relativeKey],
                  [relativeKey]: item[relativeKey],
                };
                return (
                  <div key={child.key} className='space-y-1'>
                    <Label className='text-[11px] uppercase tracking-wide text-muted-foreground'>
                      {child.label || titleize(child.key)}
                    </Label>
                    {readOnlyField(child, childRow)}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      ) : (
        <Input
          value='—'
          readOnly
          className='bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700'
        />
      );
    default:
      return (
        <Input
          value={display}
          readOnly
          className='bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700'
        />
      );
  }
};

/* ------------------------------ API hooks ------------------------------ */
function useModelDef(modelKey) {
  return useQuery({
    queryKey: ['model-def', modelKey],
    queryFn: async () => (await api().get(`/api/schema/${modelKey}`)).data,
  });
}

const PathImgThumb = ({ pathOrUrl: src, alt }) => {
  return <ImgThumb src={src} alt={alt} />;
};

const PathImgPile = ({
  paths = [],
  limit = 4, // show up to this many tiles; last becomes +N if overflow
  alt,
  tilePx = 40, // matches h-10 w-10 (2.5rem)
  offsetPx = 10, // horizontal overlap offset between tiles
}) => {
  const arr = Array.isArray(paths) ? paths : [];
  const cap = Math.max(1, limit);

  const needsMore = arr.length > cap;
  const visible = needsMore ? arr.slice(0, cap - 1) : arr.slice(0, cap);
  const extra = arr.length - visible.length; // if needsMore, this is the +N
  const totalTiles = visible.length + (needsMore ? 1 : 0);

  const containerWidth = tilePx + Math.max(0, totalTiles - 1) * offsetPx;

  return (
    <div className='flex items-center' style={{ height: tilePx }}>
      <div
        className='relative'
        style={{ height: tilePx, width: containerWidth }}>
        {visible.map((p, i) => (
          <div
            key={i}
            className='absolute'
            style={{
              left: i * offsetPx,
              zIndex: i + 1,
              width: tilePx,
              height: tilePx,
            }}
            title={`${alt || 'image'} ${i + 1}`}>
            {/* Uses your PathImgThumb -> ImgThumb (h-10 w-10 ring...) */}
            <PathImgThumb
              pathOrUrl={typeof p === 'string' ? p : p?.path || p?.url || ''}
              alt={`${alt || 'image'} ${i + 1}`}
            />
          </div>
        ))}

        {needsMore && (
          <div
            className='absolute flex items-center justify-center rounded-md ring-1 ring-gray-200 dark:ring-gray-700 bg-white dark:bg-gray-900 text-[11px] font-medium text-gray-700 dark:text-gray-200'
            style={{
              left: visible.length * offsetPx,
              zIndex: visible.length + 1,
              width: tilePx,
              height: tilePx,
            }}
            title={`+${extra} more`}>
            +{extra}
          </div>
        )}
      </div>
    </div>
  );
};

/* -------------------------- tiny cell components ----------------------- */
const BoolPill = ({ value }) => (
  <span
    className={[
      'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
      value
        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
        : 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300',
    ].join(' ')}>
    {value ? (
      <IconCheck className='h-3.5 w-3.5' />
    ) : (
      <IconX className='h-3.5 w-3.5' />
    )}
    {value ? 'Yes' : 'No'}
  </span>
);

// const StatusPill = ({ status }) => {
//   const statusClasses = {
//     draft:
//       'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
//     published:
//       'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
//     rejected: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
//     cancelled:
//       'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300',
//     confirmed:
//       'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
//     pending: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300',
//   };

//   const iconClasses = {
//     draft: <IconFile className='h-3.5 w-3.5' />,
//     published: <IconCheck className='h-3.5 w-3.5' />,
//     rejected: <IconX className='h-3.5 w-3.5' />,
//   };

//   return (
//     <span
//       className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium transition-colors duration-300 ${
//         statusClasses[status] || statusClasses.draft
//       }`}>
//       {iconClasses[status] || iconClasses.draft}
//       {status.charAt(0).toUpperCase() + status.slice(1)}
//     </span>
//   );
// };
const PaymentStatusPill = ({ status }) => {
  const palette = {
    pending:
      'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200',
    partial:
      'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200',
    paid: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200',
    failed: 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-200',
    refund_pending:
      'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-200',
    refunded:
      'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200',
    cancelled:
      'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300',
  };
  const cls =
    palette[status] ||
    'bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-200';
  const label = status ? titleize(String(status)) : '—';
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${cls}`}>
      {label}
    </span>
  );
};

const ImgThumb = ({ src, alt }) =>
  src ? (
    <img
      src={src}
      alt={alt || 'image'}
      loading='lazy' // ✅ native lazy load
      decoding='async' // ✅ speeds up rendering
      width={40} // ✅ avoids reflow (matches h-10)
      height={40}
      className='h-10 w-10 rounded-md object-cover ring-1 ring-gray-200 dark:ring-gray-700'
    />
  ) : (
    <span className='inline-flex h-10 w-10 items-center justify-center rounded-md ring-1 ring-gray-200 dark:ring-gray-700'>
      <IconPhoto className='h-5 w-5 opacity-60' />
    </span>
  );

/* ---------------------- columns from schema + data --------------------- */
function buildColumns(modelDef, can) {
  if (!modelDef) return [];
  // console.log("buildColumns", modelDef);

  const schema = Array.isArray(modelDef.schema) ? modelDef.schema : [];
  const SKIP_TYPES = new Set(['relation', 'relation[]', 'object', 'object[]']);
  const isBooking =
    (modelDef?.key || modelDef?.modelKey || '').toLowerCase() === 'booking';

  const cols = [];

  // ID first
  cols.push({
    key: '_id',
    label: 'ID',
    thClass: 'w-40',
    accessor: (r) => r._id || r.id || '—',
  });

  // Status column (custom)
  cols.push({
    key: 'status',
    label: 'Status',
    thClass: 'w-32',
    cell: (r) => <StatusPill status={r.status || 'draft'} />,
  });
  // Payment status column (for bookings)
  if (isBooking) {
    cols.push({
      key: 'payment.paymentStatus',
      label: 'Payment',
      thClass: 'w-36',
      cell: (r) => (
        <PaymentStatusPill status={getNestedValue(r, 'payment.paymentStatus')} />
      ),
    });
  }

  // Main fields
  schema.forEach((f) => {
    const { key, type, label } = f || {};
    if (!key) return;

    // Skip explicit status (we already inserted custom)
    if (key === 'status') return;

    // Skip unwanted types entirely
    if (SKIP_TYPES.has(type)) return;
    // Skip the 'body' field
    if (key === 'body') return;

    const nice = label || titleize(key);

    switch (type) {
      case 'image':
        cols.push({
          key,
          label: nice,
          thClass: 'w-24',
          cell: (r) => (
            <PathImgThumb
              pathOrUrl={getNestedValue(r, key)}
              alt={r.title || r.name}
            />
          ),
        });
        break;

      case 'image[]':
      case 'images':
        cols.push({
          key,
          label: nice,
          thClass: 'w-32',
          cell: (r) => (
            <PathImgPile
              paths={getNestedValue(r, key)}
              limit={5}
              alt={r.title || r.name}
            />
          ),
        });
        break;

      case 'switch':
      case 'boolean':
        cols.push({
          key,
          label: nice,
          thClass: 'w-28',
          cell: (r) => <BoolPill value={!!r[key]} />,
        });
        break;

      case 'date':
        cols.push({
          key,
          label: nice,
          thClass: 'w-36',
          accessor: (r) => fmtDate(getNestedValue(r, key)),
        });
        break;

      case 'number':
        cols.push({
          key,
          label: nice,
          thClass: 'w-28',
          accessor: (r) => getNestedValue(r, key) ?? '—',
        });
        break;

      case 'textarea':
        cols.push({
          key,
          label: nice,
          thClass: 'min-w-[220px]',
          accessor: (r) => getNestedValue(r, key) || '—',
        });
        break;

      default:
        // Any other primitive-ish value
        cols.push({
          key,
          label: nice,
          thClass: 'min-w-[140px]',
          accessor: (r) => getNestedValue(r, key) ?? '—',
        });
        break;
    }
  });

  if (isBooking) {
    const addBookingCol = (key, label, thClass) => {
      if (cols.some((c) => c.key === key)) return;
      cols.push({
        key,
        label,
        thClass: thClass || 'min-w-[140px]',
        accessor: (r) => getNestedValue(r, key) ?? '—',
      });
    };
    addBookingCol('contactInfo.name', 'Guest Name');
    addBookingCol('contactInfo.email', 'Guest Email');
    addBookingCol('contactInfo.phone', 'Guest Phone', 'w-36');
    addBookingCol('payment.paymentStatus', 'Payment Status', 'w-36');
    addBookingCol(
      'payment.razorpay.paymentId',
      'Transaction ID',
      'min-w-[12rem]',
    );
  }

  // Created/Updated
  cols.push({
    key: 'createdAt',
    label: 'Created',
    thClass: 'w-36',
    accessor: (r) => fmtDate(r.createdAt),
  });
  cols.push({
    key: 'updatedAt',
    label: 'Updated',
    thClass: 'w-36',
    accessor: (r) => fmtDate(r.updatedAt),
  });

  // Actions

  if (can(modelDef.key, 'update') || can(modelDef.key, 'delete')) {
    cols.push({
      key: '__actions',
      label: 'Actions',
      thClass: 'w-28',
    });
  }

  return cols;
}

/* --------------------------------- Page -------------------------------- */
export default function DynamicTable() {
  const { modelKey } = useParams();
  const { can } = usePermissions();

  const navigate = useNavigate();
  const queryClient = useQueryClient(); // ⬅️
  const [searchQuery, setSearchQuery] = useState('');
  const [tempSearch, setTempSearch] = useState('');

  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedPaymentStatus, setSelectedPaymentStatus] = useState('all');
  const [selectedRow, setSelectedRow] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [reasonOpen, setReasonOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [refundAmount, setRefundAmount] = useState('');
  const [refundNote, setRefundNote] = useState('');
  const [refundPaid, setRefundPaid] = useState(false);
  const HIDE_FIELDS = useMemo(
    () =>
      new Set([
        'createdBy',
        'updatedBy',
        'createdAt',
        'updatedAt',
        '__v',
        '_id',
        'extras',
        'extra',
        'createdByRole',
        'rejectionReason',
      ]),
    [],
  );

  // Debounce the search input to prevent frequent re-renders
  const debouncedSearch = debounce((value) => {
    setSearchQuery(value);
  }, 200); // Lower debounce delay to 200ms for faster response
  // Handle changes to search query and status
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setTempSearch(value); // Update the immediate input value (for user feedback)
    debouncedSearch(value); // Apply debounced search
  };
  const {
    data: modelDef,
    isLoading: loadingDef,
    isError: errDef,
  } = useModelDef(modelKey);

  const {
    data: pages,
    isLoading,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useContentListInfinite(
    modelKey,
    searchQuery,
    selectedStatus,
    selectedPaymentStatus,
  );

  const items = pages?.pages.flatMap((p) => p.items || []) || [];
  const isBookingModel = modelKey === 'booking';
  const statusField =
    modelDef?.schema?.find((f) => f.key === 'status') || undefined;
  const statusOptions =
    (statusField?.enumValues && statusField.enumValues.length > 0
      ? statusField.enumValues
      : ['draft', 'published', 'rejected']);
  const paymentStatusOptions = isBookingModel
    ? [
        'pending',
        'partial',
        'paid',
        'failed',
        'refund_pending',
        'refunded',
        'cancelled',
      ]
    : [];
  const detailStatus = selectedRow?.status || undefined;
  const detailTitle =
    selectedRow?.title ||
    selectedRow?.tourName ||
    selectedRow?.name ||
    selectedRow?._id ||
    'Details';
  const transactionId =
    getNestedValue(selectedRow, 'payment.razorpay.paymentId') ||
    getNestedValue(selectedRow, 'payment.razorpay.orderId');
  const reasonWords = countWords(cancelReason);
  const reasonOverLimit = reasonWords > 500;
  const statusDraft =
    statusOptions.find((s) => s === 'draft') || statusOptions[0];
  const statusPublished =
    statusOptions.find((s) => s === 'published') ||
    statusOptions.find((s) => s !== statusDraft) ||
    statusOptions[0];
  const statusRejected =
    statusOptions.find((s) => s === 'rejected') ||
    statusOptions.find(
      (s) => s !== statusDraft && s !== statusPublished,
    ) ||
    statusOptions[0];
  const filterFields = React.useCallback(
    (fieldsArr) =>
      (fieldsArr || [])
        .filter((f) => f?.key && !HIDE_FIELDS.has(f.key) && !f?.ui?.hidden)
        .map((f) => {
          const isObjectish =
            f.type === 'object' || f.type === 'object[]' || f.type === 'group';
          if (isObjectish && Array.isArray(f.fields)) {
            return { ...f, fields: filterFields(f.fields) };
          }
          return f;
        }),
    [HIDE_FIELDS],
  );
  const visibleFields = React.useMemo(
    () => filterFields(modelDef?.schema || []),
    [modelDef, filterFields],
  );

  // console.log("items", items);
  const columns = React.useMemo(
    () => buildColumns(modelDef, can),
    [modelDef, items, can],
  );

  const loading = loadingDef || isLoading;
  const title = modelDef?.meta?.title || modelDef?.key || modelKey;

  useEffect(() => {
    if (
      selectedStatus !== 'all' &&
      statusOptions &&
      !statusOptions.includes(selectedStatus)
    ) {
      setSelectedStatus('all');
    }
  }, [statusOptions, selectedStatus]);

  useEffect(() => {
    if (!isBookingModel && selectedPaymentStatus !== 'all') {
      setSelectedPaymentStatus('all');
    }
  }, [isBookingModel, selectedPaymentStatus]);

  useEffect(() => {
    // Whenever selectedStatus changes, fetch data with the selected status
    if (selectedStatus === 'all') {
      // Fetch all data if filter is 'all'
      setSearchQuery(''); // Reset search query when switching to 'all' filter
    }
  }, [selectedStatus]);

  const handleRowClick = (row) => {
    setSelectedRow(row);
    setDetailOpen(true);
    setCancelReason(row?.cancellationReason || '');
    setRefundAmount(
      row?.refundInfo?.amount !== undefined && row?.refundInfo?.amount !== null
        ? row.refundInfo.amount
        : '',
    );
    setRefundNote(row?.refundInfo?.note || '');
    setRefundPaid(!!row?.refundInfo?.isRefunded);
  };

  const invalidateList = React.useCallback(
    () =>
      queryClient.invalidateQueries({
        predicate: ({ queryKey }) =>
          Array.isArray(queryKey) &&
          queryKey[0] === 'content-list' &&
          queryKey[1] === modelKey,
      }),
    [queryClient, modelKey],
  );

  const applyStatus = async (status, extra = {}) => {
    if (!selectedRow) return;
    const id = selectedRow._id || selectedRow.id;
    try {
      const url = `/api/${modelKey}/moderation/${id}/status`;
      const payload = isBookingModel ? { status, ...extra } : { status };
      const { data } = await api().patch(url, payload);
      const updated = data?.data || data;
      if (updated) {
        setSelectedRow((prev) => ({ ...prev, ...updated }));
        if (updated.cancellationReason !== undefined) {
          setCancelReason(updated.cancellationReason || '');
        }
      }
      toast.success(`Status updated to ${status}`);
      await invalidateList();
      if (status === 'cancelled') {
        setDetailOpen(false);
        setCancelOpen(false);
      }
    } catch (e) {
      console.error(e);
      toast.error('Failed to update status.');
    }
  };

  const handleCancelSubmit = async () => {
    if (!cancelReason.trim()) {
      toast.error('Cancellation reason is required.');
      return;
    }
    if (reasonOverLimit) {
      toast.error('Cancellation reason must be 500 words or fewer.');
      return;
    }
    await applyStatus('cancelled', {
      cancellationReason: cancelReason.trim(),
      refundAmount:
        refundAmount === '' || refundAmount === null
          ? undefined
          : Number(refundAmount),
      refundNote,
      isRefunded: refundPaid,
    });
  };
  // ⬇️ optimistic delete handler
  const handleDelete = async (row) => {
    const id = row._id || row.id;

    // 1) optimistic update: drop from cache immediately
    const key = ['content-list', modelKey];
    // const prev = queryClient.getQueryData(key);

    queryClient.setQueryData(key, (old) => {
      if (!old) return old;
      const nextItems = (old.items || []).filter(
        (it) => (it._id || it.id) !== id,
      );
      return {
        ...old,
        items: nextItems,
        total: Math.max(0, (old.total || nextItems.length) - 1),
      };
    });

    try {
      // 2) server delete
      await api().delete(`/api/${modelKey}/moderation/${id}`);
      // (optional) ensure cache is fresh for other tabs/filters:
      await queryClient.invalidateQueries({ queryKey: key });
    } catch (e) {
      console.error(e);
      // 3) rollback on error: refetch the list
      queryClient.invalidateQueries({ queryKey: key });
      toast.error('Failed to delete.');
    }
  };

  // ⬇️ duplicate handler
  const handleDuplicate = async (row) => {
    const id = row._id || row.id;
    try {
      await api().post(`/api/${modelKey}/moderation/${id}/duplicate`);
      toast.success('Item duplicated successfully.');
      // refresh the table data
      await queryClient.invalidateQueries({
        queryKey: ['content-list', modelKey],
      });
    } catch (e) {
      console.error(e);
      toast.error('Failed to duplicate item.');
    }
  };

  return (
    <div className='w-full min-h-screen flex flex-col'>
      <RequirePerm
        model={modelKey}
        action='read'
        fallback={<div>You don't have access</div>}>
        <Header
          modelKey={modelKey}
          title={title}
          onCreate={() => navigate(`/content/${modelKey}/create`)}
        />
        <div className='p-4 md:p-6'>
          {errDef ? (
            <div className='rounded-md border border-red-300 bg-red-50 p-4 text-red-700 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-200'>
              Failed to load model definition for <b>{modelKey}</b>.
            </div>
          ) : isError ? (
            <div className='rounded-md border border-red-300 bg-red-50 p-4 text-red-700 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-200'>
              Failed to load data for <b>{modelKey}</b>.
            </div>
          ) : (
            <DataTable
              model={modelKey}
              title={title}
              data={items}
              columns={columns}
              storageKey={`table:${modelKey}`}
              maxBodyHeight='75dvh'
              onRowClick={handleRowClick}
              onEdit={(row) =>
                navigate(`/content/${modelKey}/${row._id || row.id}`)
              }
              loading={loading && !isFetchingNextPage}
              onDelete={handleDelete} // ⬅️ use the optimistic handler
              onDuplicate={handleDuplicate}
              rightActions={
                <div className='flex flex-wrap md:flex-nowrap justify-between w-full max-w-[22rem] gap-4'>
                  <div className='w-full min-w-[5rem] '>
                    <Select
                      value={selectedStatus}
                      onValueChange={setSelectedStatus} // Directly set the selected value
                      className='w-full px-4 py-1.5 border border-gray-300 rounded-md:border-gray-700 dark:border-gray-600'>
                      <SelectTrigger className='w-full px-4 py-2 border border-gray-300 rounded-md  outline-none ring-0 dark:border-gray-700'>
                        <SelectValue placeholder='All Status' />
                      </SelectTrigger>
                      <SelectContent
                        className={
                          '  border border-gray-300 rounded-md  outline-none ring-0 dark:border-gray-700'
                        }>
                        <SelectItem value='all'>All Status</SelectItem>
                        {statusOptions.map((opt) => (
                          <SelectItem key={opt} value={opt}>
                            {titleize(opt)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {isBookingModel && (
                    <div className='w-full min-w-[8rem] '>
                      <Select
                        value={selectedPaymentStatus}
                        onValueChange={setSelectedPaymentStatus}
                        className='w-full px-4 py-1.5 border border-gray-300 rounded-md:border-gray-700 dark:border-gray-600'>
                        <SelectTrigger className='w-full px-4 py-2 border border-gray-300 rounded-md  outline-none ring-0 dark:border-gray-700'>
                          <SelectValue placeholder='Payment Status' />
                        </SelectTrigger>
                        <SelectContent
                          className={
                            '  border border-gray-300 rounded-md  outline-none ring-0 dark:border-gray-700'
                          }>
                          <SelectItem value='all'>All Payments</SelectItem>
                          {paymentStatusOptions.map((opt) => (
                            <SelectItem key={opt} value={opt}>
                              {titleize(opt)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              }
              leftActions={
                <div className='flex flex-wrap md:flex-nowrap justify-between w-[20rem] gap-4'>
                  <div className='relative w-full min-w-[20rem]'>
                    <IconSearch className='absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 opacity-60' />
                    <Input
                      value={tempSearch}
                      onChange={handleSearchChange}
                      placeholder='Search...'
                      className='pl-8 w-full outline-none ring-0'
                    />
                  </div>
                </div>
              }
              onLoadMore={fetchNextPage} // ⬅️ new
              hasNextPage={hasNextPage} // ⬅️ new
              isFetchingNextPage={isFetchingNextPage} // ⬅️ new
            />
          )}
        </div>
      </RequirePerm>

      <Dialog
        open={detailOpen}
        onOpenChange={(open) => {
          setDetailOpen(open);
          if (!open) {
            setSelectedRow(null);
            setCancelOpen(false);
            setReasonOpen(false);
            setCancelReason('');
          }
        }}>
        <DialogContent className='max-w-4xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-xl'>
          <DialogHeader>
            <DialogTitle className='pr-10'>
              <div className='flex items-start gap-3 min-w-0'>
                <span className='font-semibold text-base md:text-lg break-words leading-tight min-w-0'>
                  {detailTitle}
                </span>
                {detailStatus && (
                  <div className='shrink-0'>
                    <StatusPill status={detailStatus} />
                  </div>
                )}
              </div>
            </DialogTitle>
            {transactionId && (
              <DialogDescription className='text-xs'>
                Transaction ID: {transactionId}
              </DialogDescription>
            )}
          </DialogHeader>

          <div
            className='grid md:grid-cols-2 gap-4 max-h-[60vh] overflow-auto [&::-webkit-scrollbar]:hidden'
            style={{ scrollbarWidth: 'none' }}>
            {visibleFields.map((field) => (
              <div
                key={field.key}
                className='flex flex-col gap-1 border border-gray-200 dark:border-gray-700 rounded-md p-3'>
                <Label className='text-xs uppercase tracking-wide text-muted-foreground'>
                  {field.label || titleize(field.key)}
                </Label>
                {readOnlyField(field, selectedRow)}
              </div>
            ))}
          </div>

          <DialogFooter className='flex flex-col gap-2 sm:flex-row sm:justify-end'>
            {isBookingModel ? (
              <>
                <Button
                  type='button'
                  variant='secondary'
                  onClick={() => applyStatus('pending')}>
                  Mark Pending
                </Button>
                <Button type='button' onClick={() => applyStatus('confirmed')}>
                  Confirm Booking
                </Button>
                <Button
                  type='button'
                  variant='destructive'
                  onClick={() => {
                    setCancelReason(selectedRow?.cancellationReason || '');
                    setReasonOpen(true);
                  }}>
                  Cancel Booking
                </Button>
              </>
            ) : (
              <>
                <Button
                  type='button'
                  variant='outline'
                  onClick={() => applyStatus(statusDraft)}>
                  Save Draft
                </Button>
                <Button
                  type='button'
                  onClick={() => applyStatus(statusPublished)}>
                  Publish
                </Button>
                <Button
                  type='button'
                  variant='destructive'
                  onClick={() => applyStatus(statusRejected)}>
                  Reject
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <DialogContent className='sm:max-w-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-xl'>
          <DialogHeader>
            <DialogTitle>Cancel Booking</DialogTitle>
            <DialogDescription>
              Add a cancellation reason (max 500 words) and refund details.
            </DialogDescription>
          </DialogHeader>

          <div className='space-y-4'>
            <div className='grid gap-2'>
              <Label htmlFor='cancelReason'>Cancellation Reason</Label>
              <Textarea
                id='cancelReason'
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder='Share why this booking is being cancelled'
                rows={4}
              />
              <div className='flex items-center justify-between text-xs text-muted-foreground'>
                <span>Required</span>
                <span
                  className={reasonOverLimit ? 'text-destructive' : undefined}>
                  {reasonWords}/500 words
                </span>
              </div>
            </div>

            <div className='grid gap-2'>
              <Label htmlFor='refundAmount'>Refund Amount</Label>
              <Input
                id='refundAmount'
                type='number'
                value={refundAmount}
                onChange={(e) => setRefundAmount(e.target.value)}
                placeholder='0'
              />
            </div>

            <div className='flex items-center justify-between gap-3'>
              <div className='space-y-1'>
                <Label htmlFor='refundPaid'>Mark as refunded</Label>
                <p className='text-xs text-muted-foreground'>
                  Sets payment status to refunded.
                </p>
              </div>
              <Switch
                id='refundPaid'
                checked={refundPaid}
                onCheckedChange={setRefundPaid}
              />
            </div>

            <div className='grid gap-2'>
              <Label htmlFor='refundNote'>Refund Note</Label>
              <Textarea
                id='refundNote'
                value={refundNote}
                onChange={(e) => setRefundNote(e.target.value)}
                placeholder='Reason or notes'
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant='outline' onClick={() => setCancelOpen(false)}>
              Close
            </Button>
            <Button
              variant='destructive'
              disabled={reasonOverLimit || !cancelReason.trim()}
              onClick={handleCancelSubmit}>
              Confirm Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <RejectConfirmationDialog
        open={reasonOpen}
        onOpenChange={(open) => {
          setReasonOpen(open);
          if (!open && !cancelOpen) {
            setCancelReason(selectedRow?.cancellationReason || '');
          }
        }}
        rejectReason={cancelReason}
        title='Cancellation Reason'
        description='Provide the reason before cancelling this booking.'
        confirmText='Continue'
        onConfirm={(val) => {
          setCancelReason(val);
          setReasonOpen(false);
          setCancelOpen(true);
        }}
      />
    </div>
  );
}
