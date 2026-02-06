import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../ui/tabs';
import { IconDeviceFloppy, IconArrowLeft } from '@tabler/icons-react';
import api from '@/lib/api';
import { useModelDefs } from '@/hooks/use-model-defs';
import EditTopBar from '../EditTopBar';
import { toast } from 'react-toastify';

// ---- admin section is fixed on backend
const ADMIN_MODELS = [
  { key: 'roles', name: 'Roles' },
  { key: 'users', name: 'Users' },
  { key: 'images', name: 'Images' },
  { key: 'flyers', name: 'Flyers' },
  { key: 'coupon', name: 'Coupons' },
  { key: 'policy', name: 'Policy' },
  { key: 'settings', name: 'Settings' },
];

// robust type checks
const isCollection = (m) =>
  (m.collectionType &&
    String(m.collectionType).toLowerCase() === 'collection') ||
  m.singleton === false;

const isSingle = (m) =>
  (m.collectionType && String(m.collectionType).toLowerCase() === 'single') ||
  m.singleton === true;

// normalize incoming permission shapes to booleans
function toBool(x) {
  if (x === true) return true;
  if (x === false) return false;
  if (typeof x === 'string') return x !== 'false' && x !== '';
  if (x == null) return false;
  return !!x;
}
function normalizePerms(perms = {}) {
  const out = {};
  Object.keys(perms || {}).forEach((modelKey) => {
    const v = perms[modelKey] || {};
    out[modelKey] = {
      create: toBool(v.create),
      read: toBool(v.read),
      update: toBool(v.update),
      delete: toBool(v.delete),
      publish: toBool(v.publish),
    };
  });
  return out;
}

export default function RoleEditPanel() {
  const { id } = useParams(); // "new" or role id
  // console.log(id);

  const isNew = !id || id === 'new';
  const navigate = useNavigate();

  const { data: modelDefs = [], isLoading: loadingModels } = useModelDefs();

  const [loading, setLoading] = React.useState(!isNew);
  const [saving, setSaving] = React.useState(false);
  const [form, setForm] = React.useState({
    name: '',
    description: '',
    permissions: {}, // { [modelKey]: { create, read, update, delete } }
    isSystem: false,
  });

  // load role on edit
  React.useEffect(() => {
    let mounted = true;
    if (isNew) return;
    (async () => {
      setLoading(true);
      try {
        const { data } = await api().get(`/api/roles/${id}`);
        if (!mounted) return;
        // console.log(`data:${data?.permissions}`);

        setForm({
          name: data?.name || '',
          description: data?.description || '',
          permissions: normalizePerms(data?.permissions || {}),
          isSystem: data?.isSystem || false,
        });
      } catch (e) {
        console.error(e);
        toast.error('Failed to load role');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [id, isNew]);

  // Ensure every model (collections, singles, admin) has a perm entry (default false)
  const mergedPermissions = React.useMemo(() => {
    const base = { ...(form.permissions || {}) };

    const ensure = (key) => {
      base[key] = {
        create: !!base[key]?.create,
        read: !!base[key]?.read,
        update: !!base[key]?.update,
        delete: !!base[key]?.delete,
        publish: !!base[key]?.publish,
      };
    };

    (modelDefs || []).forEach((m) => ensure(m.key));
    ADMIN_MODELS.forEach((m) => ensure(m.key));

    return base;
  }, [form.permissions, modelDefs]);

  const updateField = (k, v) => setForm((s) => ({ ...s, [k]: v }));

  const togglePerm = (modelKey, action) => {
    setForm((s) => {
      const current = { ...(s.permissions || {}) };
      const entry = {
        create: false,
        read: false,
        update: false,
        delete: false,
        publish: false,
        ...(current[modelKey] || {}),
      };
      entry[action] = !entry[action];
      current[modelKey] = entry;
      return { ...s, permissions: current };
    });
  };

  const save = async (e) => {
    e?.preventDefault?.();
    if (!form.name.trim()) {
      alert('Role name is required');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description || '',
        permissions: mergedPermissions,
      };

      // console.log(payload);

      if (isNew) {
        await api().post('/api/roles', payload);
      } else {
        // console.log(payload);
        await api().put(`/api/roles/${id}`, payload);
      }
      navigate('/roles');
    } catch (err) {
      console.error(err);
      toast.error('Failed to save role');
    } finally {
      setSaving(false);
    }
  };

  // split models into tabs
  const collections = React.useMemo(
    () =>
      (modelDefs || [])
        .filter(isCollection)
        .sort((a, b) => (a.name || a.key).localeCompare(b.name || b.key)),
    [modelDefs],
  );
  const singles = React.useMemo(
    () =>
      (modelDefs || [])
        .filter(isSingle)
        .sort((a, b) => (a.name || a.key).localeCompare(b.name || b.key)),
    [modelDefs],
  );

  return (
    <div className='w-full h-full flex flex-col overflow-hidden'>
      {/* Top bar */}
      <EditTopBar
        isNew={isNew}
        saving={saving}
        save={save}
        navigate={navigate}
        id={id}
      />

      {/* Single scroll area for everything below the top bar */}
      <div className='flex-1 min-h-0 overflow-y-auto ui-scrollbar-hidden p-4 md:p-6 pt-4'>
        {loading ? (
          <div className='text-sm text-muted-foreground'>Loading…</div>
        ) : (
          <form onSubmit={save} className='flex flex-col gap-6'>
            {/* Basic fields */}
            <div className='grid grid-cols-1 lg:grid-cols-12 gap-6'>
              {/* LEFT: Role name */}
              <div className='lg:col-span-6 h-fit group rounded-2xl ring-1 ring-black/5 dark:ring-white/10 bg-white/70 dark:bg-gray-900/60 p-4 md:p-5 transition hover:ring-black/10 dark:hover:ring-white/20 focus-within:ring-indigo-500/25'>
                <Label
                  htmlFor='name'
                  className='text-xs font-medium text-gray-600 dark:text-gray-400'>
                  Role name
                </Label>
                <Input
                  id='name'
                  disabled={form.isSystem}
                  value={form.name}
                  onChange={(e) => updateField('name', e.target.value)}
                  placeholder='admin, editor, client…'
                  className='mt-1.5 px-3 border-0 bg-transparent shadow-none  focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0'
                />
              </div>

              {/* RIGHT: Description */}
              <div className='lg:col-span-6 group rounded-2xl ring-1 ring-black/5 dark:ring-white/10 bg-white/70 dark:bg-gray-900/60 p-4 md:p-5 transition hover:ring-black/10 dark:hover:ring-white/20 focus-within:ring-indigo-500/25'>
                <Label
                  htmlFor='desc'
                  className='text-xs font-medium text-gray-600 dark:text-gray-400'>
                  Description
                </Label>
                <Textarea
                  id='desc'
                  value={form.description}
                  onChange={(e) => updateField('description', e.target.value)}
                  placeholder='Short summary of this role'
                  className='mt-1.5 min-h-[96px] max-h-[40vh] resize-y border-0 bg-transparent shadow-none px-3 focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0'
                />
              </div>
            </div>

            {/* Tabs: Collections / Singles / Administration */}
            <div>
              <Tabs defaultValue='collections'>
                <TabsList className='w-fit'>
                  <TabsTrigger value='collections'>Collection Type</TabsTrigger>
                  <TabsTrigger value='singles'>Single Type</TabsTrigger>
                  <TabsTrigger value='admin'>Administration</TabsTrigger>
                </TabsList>

                <div className='mt-3'>
                  <TabsContent value='collections' className='m-0'>
                    <PermissionsGrid
                      loading={loadingModels}
                      models={collections}
                      permissions={mergedPermissions}
                      onToggle={togglePerm}
                    />
                  </TabsContent>

                  <TabsContent value='singles' className='m-0'>
                    <PermissionsGrid
                      loading={loadingModels}
                      models={singles}
                      permissions={mergedPermissions}
                      onToggle={togglePerm}
                    />
                  </TabsContent>

                  <TabsContent value='admin' className='m-0'>
                    <PermissionsGrid
                      loading={false}
                      models={ADMIN_MODELS}
                      permissions={mergedPermissions}
                      onToggle={togglePerm}
                    />
                  </TabsContent>
                </div>
              </Tabs>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

/* ---------- Small reusable grid ---------- */
function PermissionsGrid({ loading, models, permissions, onToggle }) {
  return (
    <div className='rounded-xl bg-white/60 dark:bg-gray-900/50 ring-1 ring-black/5 dark:ring-white/10 p-3'>
      <div className='min-w-[680px]'>
        <div className='grid grid-cols-6 items-center px-3 py-2 text-xs font-semibold uppercase tracking-wide text-gray-500'>
          <div className='text-left'>Model</div>
          <div className='text-center'>Create</div>
          <div className='text-center'>Read</div>
          <div className='text-center'>Update</div>
          <div className='text-center'>Delete</div>
          <div className='text-center'>Publish</div>
        </div>

        {loading ? (
          <div className='px-3 py-2 text-sm text-muted-foreground'>
            Loading models…
          </div>
        ) : models.length === 0 ? (
          <div className='px-3 py-2 text-sm text-muted-foreground'>
            No items.
          </div>
        ) : (
          models.map((m) => {
            const p = permissions[m.key] || {};
            return (
              <div
                key={m.key}
                className='grid grid-cols-6 items-center px-3 py-2 text-sm border-t border-black/5 dark:border-white/10'>
                <div className='truncate font-medium' title={m.name || m.key}>
                  {m.name || m.key}
                </div>
                {['create', 'read', 'update', 'delete', 'publish'].map(
                  (action) => (
                    <div key={action} className='text-center'>
                      <input
                        type='checkbox'
                        className='h-4 w-4 accent-indigo-600'
                        checked={!!p[action]}
                        onChange={() => onToggle(m.key, action)}
                      />
                    </div>
                  ),
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
