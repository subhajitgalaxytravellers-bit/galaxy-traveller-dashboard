import { useEffect, useMemo, useState } from 'react';
import api from '@/lib/api';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { IconLoader2, IconRefresh } from '@tabler/icons-react';
import { toast } from 'react-toastify';

// Minimal role selector with select-all and fixed scroll height.
export default function RoleMultiSelect({
  value = [],
  onChange,
  className = '',
}) {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(false);

  const selected = useMemo(
    () => new Set(Array.isArray(value) ? value : []),
    [value],
  );

  const fetchRoles = async () => {
    setLoading(true);
    try {
      const res = await api().get('/api/roles');
      const list = res?.data || [];
      setRoles(list);
      // Default: all roles selected if none chosen yet
      if (list.length && (!value || value.length === 0)) {
        onChange?.(list.map((r) => r.name).filter(Boolean));
      }
    } catch (err) {
      console.error('Failed to load roles', err);
      toast.error(err?.response?.data?.message || 'Could not load roles');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleAll = (checked) => {
    if (!onChange) return;
    if (checked) onChange(roles.map((r) => r.name).filter(Boolean));
    else onChange([]);
  };

  const allSelected =
    roles.length > 0 && roles.every((r) => selected.has(r.name));

  const toggleRole = (roleName, checked) => {
    if (!onChange) return;
    const next = new Set(selected);
    if (checked) next.add(roleName);
    else next.delete(roleName);
    onChange(Array.from(next));
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <div className='flex items-center gap-2 my-2 px-3 text-sm'>
        <label className='inline-flex items-center gap-2'>
          <Checkbox
            checked={allSelected}
            onCheckedChange={(v) => toggleAll(v === true)}
            disabled={!roles.length}
          />
          Select all roles
        </label>
        <Button
          variant='ghost'
          size='sm'
          onClick={fetchRoles}
          disabled={loading}
          className='gap-1 ml-auto border border-accent'>
          <IconRefresh size={16} />
          Refresh
        </Button>
      </div>

      <div className='rounded-lg border border-border bg-card'>
        <ScrollArea className='h-48'>
          <div className='divide-y divide-border'>
            {loading ? (
              <div className='flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground'>
                <IconLoader2 className='h-4 w-4 animate-spin' />
                Loading roles...
              </div>
            ) : roles.length === 0 ? (
              <div className='py-6 text-center text-sm text-muted-foreground'>
                No roles found
              </div>
            ) : (
              roles.map((r) => (
                <label
                  key={r._id || r.name}
                  className='flex items-center gap-3 px-3 py-2 text-sm hover:bg-muted/50'>
                  <Checkbox
                    checked={selected.has(r.name)}
                    onCheckedChange={(v) => toggleRole(r.name, v === true)}
                  />
                  <div>
                    <div className='font-medium'>{r.name}</div>
                    {r.description && (
                      <div className='text-xs text-muted-foreground'>
                        {r.description}
                      </div>
                    )}
                  </div>
                </label>
              ))
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
