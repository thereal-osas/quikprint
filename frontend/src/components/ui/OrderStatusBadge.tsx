import { cn } from '@/lib/utils';

interface OrderStatusBadgeProps {
  status: string;
}

const statusConfig: Record<string, { label: string; className: string }> = {
  pending: {
    label: 'Pending',
    className: 'bg-warning/10 text-warning border-warning/20',
  },
  processing: {
    label: 'Processing',
    className: 'bg-primary/10 text-primary border-primary/20',
  },
  printing: {
    label: 'Printing',
    className: 'bg-accent/10 text-accent border-accent/20',
  },
  shipped: {
    label: 'Shipped',
    className: 'bg-success/10 text-success border-success/20',
  },
  delivered: {
    label: 'Delivered',
    className: 'bg-success/10 text-success border-success/20',
  },
  completed: {
    label: 'Completed',
    className: 'bg-success/10 text-success border-success/20',
  },
  cancelled: {
    label: 'Cancelled',
    className: 'bg-destructive/10 text-destructive border-destructive/20',
  },
};

const defaultConfig = {
  label: 'Unknown',
  className: 'bg-muted text-muted-foreground border-border',
};

export function OrderStatusBadge({ status }: OrderStatusBadgeProps) {
  const config = statusConfig[status] || defaultConfig;

  return (
    <span
      className={cn(
        'badge-status border',
        config.className
      )}
    >
      {config.label}
    </span>
  );
}
