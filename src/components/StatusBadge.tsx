import { ConvocationStatus } from '@/context/MatchContext';

const statusConfig: Record<ConvocationStatus, { label: string; dotClass: string }> = {
  confirmado: { label: 'Confirmados', dotClass: 'bg-status-green' },
  pendiente: { label: 'Pendientes', dotClass: 'bg-status-yellow' },
  rechazado: { label: 'Rechazados', dotClass: 'bg-status-red' },
};

interface StatusBadgeProps {
  status: ConvocationStatus;
  count: number;
}

const StatusBadge = ({ status, count }: StatusBadgeProps) => {
  const config = statusConfig[status];
  return (
    <span className="flex items-center gap-1.5">
      <span className={`w-2 h-2 rounded-full ${config.dotClass}`} />
      <span className="text-muted-foreground">
        {count} {config.label.toLowerCase()}
      </span>
    </span>
  );
};

export default StatusBadge;
