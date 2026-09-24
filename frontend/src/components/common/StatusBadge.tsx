import React from 'react';
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  PauseCircle,
  FileEdit,
  Send,
  HelpCircle
} from 'lucide-react';

export type StatusType =
  | 'ACTIVE'
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED'
  | 'CORRECTION_REQUIRED'
  | 'CORRECTION REQUIRED'
  | 'SUSPENDED'
  | 'DRAFT'
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'OPEN'
  | 'CLOSED'
  | 'PUBLISHED';

interface StatusBadgeProps {
  status: string;
  className?: string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className = '', size = 'md' }) => {
  const normalized = status ? status.toUpperCase().replace(/\s+/g, '_') : 'UNKNOWN';

  const config: Record<
    string,
    { label: string; bg: string; text: string; border: string; icon: React.ComponentType<{ className?: string }> }
  > = {
    ACTIVE: {
      label: 'Active',
      bg: 'bg-emerald-50',
      text: 'text-emerald-700',
      border: 'border-emerald-200',
      icon: CheckCircle2,
    },
    APPROVED: {
      label: 'Approved',
      bg: 'bg-emerald-50',
      text: 'text-emerald-700',
      border: 'border-emerald-200',
      icon: CheckCircle2,
    },
    PUBLISHED: {
      label: 'Published',
      bg: 'bg-teal-50',
      text: 'text-teal-700',
      border: 'border-teal-200',
      icon: CheckCircle2,
    },
    PENDING: {
      label: 'Pending Approval',
      bg: 'bg-amber-50',
      text: 'text-amber-700',
      border: 'border-amber-200',
      icon: Clock,
    },
    UNDER_REVIEW: {
      label: 'Under Review',
      bg: 'bg-amber-50',
      text: 'text-amber-700',
      border: 'border-amber-200',
      icon: Clock,
    },
    CORRECTION_REQUIRED: {
      label: 'Correction Required',
      bg: 'bg-rose-50',
      text: 'text-rose-700',
      border: 'border-rose-200',
      icon: AlertTriangle,
    },
    REJECTED: {
      label: 'Rejected',
      bg: 'bg-red-50',
      text: 'text-red-700',
      border: 'border-red-200',
      icon: XCircle,
    },
    SUSPENDED: {
      label: 'Suspended',
      bg: 'bg-slate-100',
      text: 'text-slate-700',
      border: 'border-slate-300',
      icon: PauseCircle,
    },
    DRAFT: {
      label: 'Draft',
      bg: 'bg-slate-100',
      text: 'text-slate-600',
      border: 'border-slate-200',
      icon: FileEdit,
    },
    SUBMITTED: {
      label: 'Submitted',
      bg: 'bg-blue-50',
      text: 'text-blue-700',
      border: 'border-blue-200',
      icon: Send,
    },
    OPEN: {
      label: 'Open',
      bg: 'bg-indigo-50',
      text: 'text-indigo-700',
      border: 'border-indigo-200',
      icon: CheckCircle2,
    },
    CLOSED: {
      label: 'Closed',
      bg: 'bg-slate-100',
      text: 'text-slate-600',
      border: 'border-slate-300',
      icon: Clock,
    },
  };

  const item = config[normalized] || {
    label: status || 'Unknown',
    bg: 'bg-slate-50',
    text: 'text-slate-600',
    border: 'border-slate-200',
    icon: HelpCircle,
  };

  const Icon = item.icon;
  const sizeClasses = size === 'sm' ? 'text-[10px] px-2 py-0.5' : 'text-xs px-2.5 py-1';
  const iconSize = size === 'sm' ? 'w-3 h-3 mr-1' : 'w-3.5 h-3.5 mr-1.5';

  return (
    <span
      className={`inline-flex items-center font-semibold rounded-full border ${item.bg} ${item.text} ${item.border} ${sizeClasses} ${className}`}
    >
      <Icon className={iconSize} />
      {item.label}
    </span>
  );
};
