import {
  IconFile,
  IconCheck,
  IconX,
  IconClock,
  IconBan,
  IconRefresh,
  IconAlertTriangle,
} from '@tabler/icons-react';

const STATUS_CONFIG = {
  // Record status
  draft: {
    label: 'Draft',
    className:
      'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
    icon: <IconFile className='h-3.5 w-3.5' />,
  },
  published: {
    label: 'Published',
    className:
      'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    icon: <IconCheck className='h-3.5 w-3.5' />,
  },
  cancelled: {
    label: 'Cancelled',
    className:
      'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
    icon: <IconBan className='h-3.5 w-3.5' />,
  },

  // Booking status
  pending: {
    label: 'Pending',
    className:
      'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300',
    icon: <IconClock className='h-3.5 w-3.5' />,
  },
  confirmed: {
    label: 'Confirmed',
    className:
      'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    icon: <IconCheck className='h-3.5 w-3.5' />,
  },
  partial: {
    label: 'Partial',
    className:
      'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    icon: <IconClock className='h-3.5 w-3.5' />,
  },

  // Payment status
  paid: {
    label: 'Paid',
    className:
      'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    icon: <IconCheck className='h-3.5 w-3.5' />,
  },
  failed: {
    label: 'Failed',
    className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
    icon: <IconX className='h-3.5 w-3.5' />,
  },
  refunded: {
    label: 'Refunded',
    className:
      'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
    icon: <IconRefresh className='h-3.5 w-3.5' />,
  },
};

const FALLBACK_STATUS = {
  label: 'Unknown',
  className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  icon: <IconAlertTriangle className='h-3.5 w-3.5' />,
};

const StatusPill = ({ status }) => {
  const config = STATUS_CONFIG[status] || FALLBACK_STATUS;

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium transition-colors duration-300 ${config.className}`}>
      {config.icon}
      {config.label}
    </span>
  );
};

export default StatusPill;
