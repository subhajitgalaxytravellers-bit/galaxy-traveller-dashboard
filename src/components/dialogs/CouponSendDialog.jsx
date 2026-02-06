import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import UserMultiSelect from '@/components/users/UserMultiSelect';
import RoleMultiSelect from '@/components/roles/RoleMultiSelect';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import api from '@/lib/api';
import { toast } from 'react-toastify';

export default function CouponSendDialog({ open, onClose, coupon, onSent }) {
  const [mode, setMode] = useState('selected');
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [roles, setRoles] = useState([]);
  const [onlyActive, setOnlyActive] = useState(true);
  const [emailVerifiedOnly, setEmailVerifiedOnly] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!open) {
      setSelectedUserIds([]);
      setRoles([]);
      setOnlyActive(true);
      setEmailVerifiedOnly(false);
      setMode('selected');
      setConfirm(false);
    }
  }, [open]);

  const handleSend = async () => {
    if (!coupon?._id) {
      toast.error('Coupon not selected');
      return;
    }
    if (mode === 'selected' && selectedUserIds.length === 0) {
      toast.error('Select at least one user');
      return;
    }

    const payload = {
      couponId: coupon._id,
      mode,
      confirm,
    };

    if (mode === 'selected') {
      payload.userIds = selectedUserIds;
    } else {
      const roleList = Array.isArray(roles) ? roles.filter(Boolean) : [];
      if (roleList.length) payload.roles = roleList;
      if (onlyActive) payload.status = 'active';
      if (emailVerifiedOnly) payload.emailVerified = true;
    }

    setSending(true);
    toast.info('Sending started in background...');
    onClose?.();
    try {
      const res = await api().post('/api/coupons/bulk-send', payload);
      const data = res?.data?.data || res?.data;
      toast.success(
        `Sent: ${data?.sent ?? 0}, Failed: ${data?.failed ?? 0}, Total: ${data?.total ?? 0}`,
      );
      onSent?.();
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.message || 'Failed to send coupon');
    } finally {
      setSending(false);
    }
  };

  if (!coupon) return null;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose?.()}>
      <DialogContent className='max-w-xl my-4 border-accent'>
        <DialogHeader>
          <DialogTitle>Send Coupon - {coupon.code}</DialogTitle>
        </DialogHeader>

        <div className='my-5'>
          <div className='my-2'>
            <Label>Mode</Label>
            <Select value={mode} onValueChange={setMode}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='selected'>Selected Users</SelectItem>
                <SelectItem value='all'>All Users (with filters)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {mode === 'selected' ? (
            <div className='my-3'>
              <Label className='mb-2 block'>Select recipients</Label>
              <UserMultiSelect
                value={selectedUserIds}
                onChange={setSelectedUserIds}
                enabled={open && mode === 'selected'}
              />
              <div className='mt-2 text-xs text-muted-foreground'>
                Selected users will receive this coupon by email.
              </div>
            </div>
          ) : (
            <>
              <div className='my-2 '>
                <Label className='mb-2 block'>Roles (defaults to all)</Label>
                <RoleMultiSelect value={roles} onChange={setRoles} />
              </div>

              <label className='flex items-center gap-2 text-sm'>
                <input
                  type='checkbox'
                  checked={onlyActive}
                  onChange={(e) => setOnlyActive(e.target.checked)}
                />
                Only active users
              </label>

              <div className='flex items-center gap-2 text-sm text-amber-700'>
                If more than 10k recipients, set "confirm" to proceed.
              </div>
              <label className='flex items-center gap-2 text-sm'>
                <input
                  type='checkbox'
                  checked={confirm}
                  onChange={(e) => setConfirm(e.target.checked)}
                />
                Confirm send if recipients exceed cap
              </label>
            </>
          )}

          <div className='text-sm text-muted-foreground'>
            Coupon: <strong>{coupon.code}</strong> —{' '}
            {coupon.type === 'percent'
              ? `${coupon.value}% (max off ₹${coupon.maxOff || '∞'})`
              : `₹${coupon.value}`}
            {coupon.expiresAt
              ? `, expires ${new Date(coupon.expiresAt).toDateString()}`
              : ', no expiry'}
          </div>
        </div>

        <DialogFooter className='gap-2 '>
          <Button
            variant='ghost'
            className='mr-auto border border-accent py-2'
            onClick={onClose}
            disabled={sending}>
            Cancel
          </Button>
          <Button onClick={handleSend} disabled={sending}>
            {sending ? 'Sending...' : 'Send'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
