import { cn } from '@/lib/utils';
import type { RequestStatus } from '@/types/database';
import { Clock, CheckCircle, XCircle, CheckCheck } from 'lucide-react';

interface StatusBadgeProps {
  status: RequestStatus;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

const statusConfig: Record<RequestStatus, { label: string; className: string; icon: React.ComponentType<{ className?: string }> }> = {
  DIAJUKAN: {
    label: 'Diajukan',
    className: 'status-diajukan',
    icon: Clock,
  },
  DISETUJUI: {
    label: 'Disetujui',
    className: 'status-disetujui',
    icon: CheckCircle,
  },
  DITOLAK: {
    label: 'Ditolak',
    className: 'status-ditolak',
    icon: XCircle,
  },
  SELESAI: {
    label: 'Selesai',
    className: 'status-selesai',
    icon: CheckCheck,
  },
};

const sizeClasses = {
  sm: 'text-[10px] px-2 py-0.5',
  md: 'text-xs px-3 py-1',
  lg: 'text-sm px-4 py-1.5',
};

export const StatusBadge = ({ status, size = 'md', showIcon = true }: StatusBadgeProps) => {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <span
      className={cn(
        'status-badge inline-flex items-center gap-1.5 font-semibold',
        config.className,
        sizeClasses[size]
      )}
    >
      {showIcon && <Icon className="w-3 h-3" />}
      {config.label}
    </span>
  );
};
