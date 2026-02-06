import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import RelationInput from '@/components/fields/RelationInput';
import api from '@/lib/api';
import { useEffect, useState } from 'react';

export default function CouponFormDialog({ open, onClose, coupon, onSaved }) {
  const isEdit = !!coupon?._id;
  const blankForm = {
    code: '',
    type: 'percent',
    value: 10,
    maxOff: 0,
    minOrder: 0,
    maxUses: 0,
    maxUsesPerUser: 0,
    status: 'active',
    hidden: false,
    startsAt: '',
    expiresAt: '',
    appliesToMode: 'all',
    appliesToTours: [],
    notes: '',
  };
  const [form, setForm] = useState(blankForm);
  const [saving, setSaving] = useState(false);
  const [tourOptions, setTourOptions] = useState([]);
  const [tourPages, setTourPages] = useState(1);

  useEffect(() => {
    if (coupon) {
      setForm({
        code: coupon.code || '',
        type: coupon.type || 'percent',
        value: coupon.value || 0,
        maxOff: coupon.maxOff || 0,
        minOrder: coupon.minOrder || 0,
        maxUses: coupon.maxUses || 0,
        maxUsesPerUser: coupon.maxUsesPerUser || 0,
        status: coupon.status || 'active',
        hidden: !!coupon.hidden,
        startsAt: coupon.startsAt ? coupon.startsAt.slice(0, 10) : '',
        expiresAt: coupon.expiresAt ? coupon.expiresAt.slice(0, 10) : '',
        appliesToMode: coupon.appliesTo?.mode || 'all',
        appliesToTours: coupon.appliesTo?.tours || [],
        notes: coupon.notes || '',
      });
    } else {
      setForm(blankForm);
    }
  }, [coupon, open]);

  useEffect(() => {
    if (open) loadTours();
  }, [open]);

  const loadTours = async (query = '', page = 1) => {
    const limit = 20;
    try {
      const res = await api().get('/api/tour/moderation', {
        params: { limit, page, q: query },
      });
      const payload = res.data?.data || res.data || {};
      const items = payload.items || payload.data || payload || [];
      const total = payload.total || items.total || 0;
      const totalPages = total && limit ? Math.ceil(total / limit) : 1;
      setTourPages(totalPages || 1);
      if (page === 1) {
        setTourOptions(items);
      } else {
        setTourOptions((prev) => [...prev, ...items]);
      }
      return { totalPages: totalPages || 1 };
    } catch (err) {
      console.error('Failed to load tours', err);
      return { totalPages: 1 };
    }
  };

  const handleChange = (key, val, numeric = false) => {
    if (numeric) {
      const sanitized = String(val ?? '')
        .replace(/[^0-9.]/g, '')
        .replace(/^(0+)(\d)/, '$2');
      setForm((prev) => ({
        ...prev,
        [key]: sanitized === '' ? 0 : Number(sanitized),
      }));
      return;
    }
    setForm((prev) => ({ ...prev, [key]: val }));
  };

  const handleSubmit = async (e) => {
    e?.preventDefault?.();
    setSaving(true);
    try {
      const payload = { ...form };
      payload.startsAt = form.startsAt ? new Date(form.startsAt) : null;
      payload.expiresAt = form.expiresAt ? new Date(form.expiresAt) : null;
      const tours =
        form.appliesToMode === 'all' ? [] : form.appliesToTours || [];
      payload.appliesTo = {
        mode: form.appliesToMode || 'all',
        tours,
      };
      payload.notes = form.notes || '';
      payload.hidden = !!form.hidden;
      delete payload.appliesToMode;
      delete payload.appliesToTours;

      if (isEdit) {
        await api().patch(`/api/coupons/${coupon._id}`, payload);
      } else {
        await api().post('/api/coupons', payload);
        setForm(blankForm);
      }
      onSaved?.();
    } catch (err) {
      console.error('Save coupon failed', err);
      alert('Failed to save coupon');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose?.()}>
      <DialogContent className='max-w-xl border border-accent'>
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Coupon' : 'Add Coupon'}</DialogTitle>
        </DialogHeader>

        <form className='space-y-4' onSubmit={handleSubmit}>
          <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
            <div className='space-y-2'>
              <Label>Code</Label>
              <Input
                value={form.code}
                onChange={(e) =>
                  handleChange('code', e.target.value.toUpperCase())
                }
                required
              />
            </div>
            <div className='space-y-2'>
              <Label>Type</Label>
              <Select
                value={form.type}
                onValueChange={(v) => handleChange('type', v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='percent'>Percent</SelectItem>
                  <SelectItem value='fixed'>Fixed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className='space-y-2'>
              <Label>Value</Label>
              <Input
                inputMode='decimal'
                min='0'
                step='0.01'
                value={form.value}
                onChange={(e) => handleChange('value', e.target.value, true)}
                required
              />
            </div>
            <div className='space-y-2'>
              <Label>
                Max Off (cap) {form.type === 'percent' ? '(0 = unlimited)' : ''}
              </Label>
              <Input
                inputMode='decimal'
                min='0'
                step='0.01'
                value={form.maxOff}
                onChange={(e) => handleChange('maxOff', e.target.value, true)}
              />
            </div>
            <div className='space-y-2'>
              <Label>Min Order (₹)</Label>
              <Input
                inputMode='decimal'
                min='0'
                step='0.01'
                value={form.minOrder}
                onChange={(e) => handleChange('minOrder', e.target.value, true)}
              />
            </div>
            <div className='space-y-2'>
              <Label>Max Uses (0 = unlimited)</Label>
              <Input
                inputMode='numeric'
                min='0'
                value={form.maxUses}
                onChange={(e) => handleChange('maxUses', e.target.value, true)}
              />
            </div>
            <div className='space-y-2'>
              <Label>Max Uses per User (0 = unlimited)</Label>
              <Input
                inputMode='numeric'
                min='0'
                value={form.maxUsesPerUser}
                onChange={(e) =>
                  handleChange('maxUsesPerUser', e.target.value, true)
                }
              />
            </div>
            <div className='space-y-2'>
              <Label>Start Date (optional)</Label>
              <Input
                type='date'
                value={form.startsAt}
                onChange={(e) => handleChange('startsAt', e.target.value)}
              />
            </div>
            <div className='space-y-2'>
              <Label>Expiry Date</Label>
              <Input
                type='date'
                value={form.expiresAt}
                onChange={(e) => handleChange('expiresAt', e.target.value)}
              />
            </div>
            <div className='space-y-2'>
              <Label>Scope</Label>
              <Select
                value={form.appliesToMode}
                onValueChange={(v) => handleChange('appliesToMode', v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>All tours</SelectItem>
                  <SelectItem value='include'>Only selected tours</SelectItem>
                  <SelectItem value='exclude'>
                    All except selected tours
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className='space-y-2 sm:col-span-2'>
              <Label>
                Tours (select when scope is include/exclude — leave empty for
                all)
              </Label>
              <RelationInput
                multiple
                disabled={form.appliesToMode === 'all'}
                label='Tours'
                value={form.appliesToTours}
                nameKey='title'
                options={tourOptions}
                pages={tourPages}
                onChange={(_, ids) => handleChange('appliesToTours', ids)}
                getOptions={() => loadTours()}
                searchOptions={(q, { page = 1 } = {}) => loadTours(q, page)}
                listMaxHeight='14rem'
              />
            </div>
            <div className='space-y-2 sm:col-span-2'>
              <Label>Notes (internal)</Label>
              <Input
                value={form.notes}
                onChange={(e) => handleChange('notes', e.target.value)}
                placeholder='Visible to admins only'
              />
            </div>
            <div className='space-y-2'>
              <Label>Status</Label>
              <Select
                value={form.status}
                onValueChange={(v) => handleChange('status', v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='active'>Active</SelectItem>
                  <SelectItem value='paused'>Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className='flex items-center gap-3'>
              <Checkbox
                id='hidden'
                checked={!!form.hidden}
                onCheckedChange={(v) => handleChange('hidden', !!v)}
              />
              <div className='space-y-1 leading-tight'>
                <Label htmlFor='hidden'>Hide from dropdowns</Label>
                <p className='text-xs text-muted-foreground'>
                  Still usable via code entry; excluded from public coupon lists.
                </p>
              </div>
            </div>
          </div>

          <DialogFooter className='gap-4 pt-2 mt-4'>
            <Button
              type='button'
              className='border border-muted-foreground/80'
              variant='ghost'
              onClick={onClose}
              disabled={saving}>
              Cancel
            </Button>
            <Button type='submit' disabled={saving}>
              {saving ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
