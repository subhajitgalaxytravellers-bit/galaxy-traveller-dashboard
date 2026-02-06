import * as React from 'react';
import { Button } from '@/components/ui/button';
import {
  IconDeviceFloppy,
  IconUpload,
  IconBan,
  IconCheck,
  IconClock,
} from '@tabler/icons-react';
import { RejectConfirmationDialog } from './dialogs/RejectionDialog';
import { useCurrentUser } from '@/hooks/use-currentuser';

export default function SavePublishActions({
  onAction,

  // generic
  disabled = false,
  param = '',
  rejectReason,
  // visibility
  showSave = true,
  showPublish = true,
  showReject = false,

  // NEW booking actions
  showConfirm = false,
  showCancel = false,
  showPending = false,

  // labels
  saveLabel = 'Save',
  publishLabel = 'Publish',
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  pendingLabel = 'Mark Pending',
  rejectLabel = 'Reject',

  // variants
  saveVariant = 'outline',
  publishVariant = 'default',
  confirmVariant = 'default',
  cancelVariant = 'destructive',
  pendingVariant = 'secondary',
  rejectVariant = 'destructive',
}) {
  const [loading, setLoading] = React.useState(null); // "save" | "publish" | "reject" | null
  const [open, setOpen] = React.useState(false); // To open the reject confirmation dialog
  const { data: currentUser } = useCurrentUser();

  const run = async (action, reasonArg) => {
    if (!onAction || loading) return;

    setLoading(action);
    try {
      const maybe = onAction(action, reasonArg); // <- use the arg, not state
      if (maybe && typeof maybe.then === 'function') {
        await maybe;
      }
    } finally {
      setLoading(null);
    }
  };

  const handleReject = () => {
    setOpen(true);
  };

  const handleRejectConfirm = (reasonFromDialog) => {
    setOpen(false);
    run('reject', reasonFromDialog);
  };

  const shouldHideSaveButton = param.includes('/single/');

  return (
    <div
      className={
        'max-w-full w-full flex flex-col gap-2 bg-white dark:bg-gray-900 p-4  rounded-lg '
      }
      aria-busy={!!loading}>
      {showPublish && (
        <Button
          type='button'
          variant={publishVariant}
          disabled={disabled || !!loading}
          onClick={() => run('publish')}
          className={`w-full gap-1`}>
          <IconUpload className='h-4 w-4' />
          {loading === 'publish' ? 'Publishingƒ?İ' : publishLabel}
        </Button>
      )}

      <div className='flex flex-wrap gap-2 w-full'>
        {showSave && !shouldHideSaveButton && (
          <Button
            type='button'
            variant={saveVariant}
            disabled={disabled || !!loading}
            onClick={() => run('save')}
            className={`flex-1 sm:w-auto gap-1`}>
            <IconDeviceFloppy className='h-4 w-4' />
            {loading === 'save' ? 'Savingƒ?İ' : saveLabel}
          </Button>
        )}

        {currentUser?.roleName !== 'creator' && showReject && (
          <Button
            type='button'
            variant={rejectVariant}
            disabled={disabled || !!loading}
            onClick={handleReject}
            className={`flex-1 sm:w-auto gap-1`}>
            <IconBan className='h-4 w-4' />
            {loading === 'reject' ? 'Rejectingƒ?İ' : rejectLabel}
          </Button>
        )}
      </div>

      {/* Booking-specific actions */}
      {showConfirm && (
        <Button
          type='button'
          variant={confirmVariant}
          disabled={disabled || !!loading}
          onClick={() => run('confirm')}
          className='w-full gap-1'>
          <IconCheck className='h-4 w-4' />
          {loading === 'confirm' ? 'Confirmingƒ?İ' : confirmLabel}
        </Button>
      )}

      {showPending && (
        <Button
          type='button'
          variant={pendingVariant}
          disabled={disabled || !!loading}
          onClick={() => run('pending')}
          className='w-full gap-1'>
          <IconClock className='h-4 w-4' />
          {loading === 'pending' ? 'Updatingƒ?İ' : pendingLabel}
        </Button>
      )}

      {showCancel && (
        <Button
          type='button'
          variant={cancelVariant}
          disabled={disabled || !!loading}
          onClick={() => run('cancel')}
          className='w-full gap-1'>
          <IconBan className='h-4 w-4' />
          {loading === 'cancel' ? 'Cancellingƒ?İ' : cancelLabel}
        </Button>
      )}

      {/* Reject Confirmation Dialog */}
      <RejectConfirmationDialog
        open={open}
        onOpenChange={setOpen}
        rejectReason={rejectReason}
        title='Reject Item'
        description='Please provide a reason for rejection.'
        confirmText='Reject'
        cancelText='Cancel'
        onConfirm={handleRejectConfirm}
      />
    </div>
  );
}
