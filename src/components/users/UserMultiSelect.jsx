import { useEffect, useMemo, useRef, useState } from 'react';
import api from '@/lib/api';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  IconLoader2,
  IconMail,
  IconRefresh,
  IconSearch,
  IconUser,
} from '@tabler/icons-react';
import { toast } from 'react-toastify';

const PAGE_SIZE = 20;

// A lightweight user picker that mirrors the relation multi-select experience.
// Features: server-side search, paging, select-all-on-page, and bulk select for the current filter.
export default function UserMultiSelect({
  value = [],
  onChange,
  enabled = true,
  className = '',
}) {
  const [query, setQuery] = useState('');
  const [debounced, setDebounced] = useState('');
  const [users, setUsers] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [selectingAll, setSelectingAll] = useState(false);
  const abortRef = useRef(null);

  // Normalize selected ids
  const selectedIds = useMemo(
    () => (Array.isArray(value) ? value.filter(Boolean) : []),
    [value],
  );
  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);

  // Debounce query so we don't spam the API
  useEffect(() => {
    const t = setTimeout(() => setDebounced(query.trim()), 320);
    return () => clearTimeout(t);
  }, [query]);

  // Reset when dialog closes
  useEffect(() => {
    if (!enabled) {
      setUsers([]);
      setPage(1);
      setTotal(0);
      setQuery('');
      setDebounced('');
    }
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;
    fetchUsers({ reset: true, page: 1, search: debounced });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced, enabled]);

  const fetchUsers = async ({
    reset = false,
    page: pageNumber = 1,
    search,
  }) => {
    if (!enabled) return;
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    const params = { limit: PAGE_SIZE, page: pageNumber };
    if (search) params.q = search;

    reset ? setLoading(true) : setLoadingMore(true);
    try {
      const res = await api().get('/api/users', {
        params,
        signal: controller.signal,
      });
      const payload = res?.data?.data || res?.data || {};
      const items = payload.items || payload.results || payload || [];
      const totalCount =
        payload.total ??
        payload.count ??
        (Array.isArray(items) ? items.length : 0);

      setPage(payload.page || pageNumber);
      setTotal(totalCount);
      setUsers((prev) => (reset ? items : [...prev, ...items]));
    } catch (err) {
      const canceled =
        err?.name === 'CanceledError' ||
        err?.name === 'AbortError' ||
        err?.raw?.code === 'ERR_CANCELED' ||
        err?.status === 0;
      if (canceled) return;
      console.error('Failed to load users', err);
      toast.error(err?.response?.data?.message || err?.message || 'Could not load users');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const hasMore = page * PAGE_SIZE < total;

  const toggleUser = (id, checked) => {
    if (!id || !onChange) return;
    const next = new Set(selectedSet);
    if (checked) next.add(id);
    else next.delete(id);
    onChange(Array.from(next));
  };

  const toggleSelectPage = (checked) => {
    if (!onChange) return;
    const next = new Set(selectedSet);
    if (checked) {
      users.forEach((u) => u?._id && next.add(u._id));
    } else {
      users.forEach((u) => u?._id && next.delete(u._id));
    }
    onChange(Array.from(next));
  };

  const allPageSelected =
    users.length > 0 && users.every((u) => selectedSet.has(u._id));

  const selectAllFiltered = async () => {
    if (!enabled || !total) return;
    const cap = Math.min(total, 500); // avoid massive payloads
    setSelectingAll(true);
    try {
      const res = await api().get('/api/users', {
        params: { q: debounced || undefined, page: 1, limit: cap },
      });
      const payload = res?.data?.data || res?.data || {};
      const items = payload.items || payload.results || payload || [];
      const next = new Set(selectedSet);
      items.forEach((u) => u?._id && next.add(u._id));
      onChange?.(Array.from(next));
      if (total > cap) {
        toast.info(`Selected first ${cap} users from ${total} results.`);
      }
    } catch (err) {
      const canceled =
        err?.name === 'CanceledError' ||
        err?.name === 'AbortError' ||
        err?.raw?.code === 'ERR_CANCELED' ||
        err?.status === 0;
      if (!canceled) {
        console.error(err);
        toast.error(err?.response?.data?.message || err?.message || 'Select all failed');
      }
    } finally {
      setSelectingAll(false);
    }
  };

  return (
    <div className={`my-2 ${className}`}>
      <div className='flex items-center gap-2'>
        <div className='relative flex-1'>
          <IconSearch className='absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 opacity-60' />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder='Search users by name or email'
            className='pl-8'
            disabled={!enabled}
          />
        </div>
        <Button
          variant='outline'
          size='sm'
          onClick={() =>
            fetchUsers({ reset: true, page: 1, search: debounced })
          }
          disabled={!enabled || loading}
          className='gap-1'>
          <IconRefresh size={16} />
          Refresh
        </Button>
      </div>

      <div className='flex flex-wrap my-2 px-3 items-center gap-3 text-xs text-muted-foreground'>
        <label className='inline-flex items-center gap-2 text-sm'>
          <Checkbox
            checked={allPageSelected}
            onCheckedChange={(v) => toggleSelectPage(v === true)}
            disabled={!users.length}
          />
          Select all on this page ({users.length})
        </label>
        <Button
          variant='ghost'
          size='sm'
          className='gap-1'
          onClick={selectAllFiltered}
          disabled={!total || selectingAll}>
          <IconMail size={16} />
          Select all filtered{total ? ` (${Math.min(total, 500)} max)` : ''}
        </Button>
        <span className='ml-auto text-sm font-medium'>
          {selectedIds.length} selected
        </span>
      </div>

      <div className='rounded-lg border border-border bg-card'>
        <ScrollArea className='h-64'>
          <div className='divide-y divide-border'>
            {loading ? (
              <div className='flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground'>
                <IconLoader2 className='h-4 w-4 animate-spin' />
                Loading users...
              </div>
            ) : users.length === 0 ? (
              <div className='py-6 text-center text-sm text-muted-foreground'>
                No users found
              </div>
            ) : (
              users.map((u) => {
                const id = u?._id;
                const checked = selectedSet.has(id);
                return (
                  <label
                    key={id || u.email}
                    className='flex items-center gap-3 px-3 py-2 text-sm hover:bg-muted/50'>
                    <Checkbox
                      checked={checked}
                      onCheckedChange={(v) => toggleUser(id, v === true)}
                    />
                    <div className='flex items-center gap-2 min-w-0'>
                      <IconUser className='h-4 w-4 text-primary' />
                      <div className='min-w-0'>
                        <div className='font-medium truncate'>
                          {u.name || 'User'}
                        </div>
                        <div className='text-xs text-muted-foreground truncate'>
                          {u.email}
                        </div>
                      </div>
                    </div>
                  </label>
                );
              })
            )}
          </div>
        </ScrollArea>
      </div>

      <div className='flex items-center my-2 gap-2'>
        <div className='text-xs text-muted-foreground'>
          Showing {Math.min(users.length, total)} of {total || 0}
        </div>
        <div className='ml-auto flex items-center gap-2'>
          {hasMore && (
            <Button
              variant='secondary'
              size='sm'
              onClick={() =>
                fetchUsers({
                  reset: false,
                  page: page + 1,
                  search: debounced,
                })
              }
              disabled={loadingMore}
              className='gap-1'>
              <IconLoader2
                className={loadingMore ? 'h-4 w-4 animate-spin' : 'h-4 w-4'}
              />
              Load more
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
