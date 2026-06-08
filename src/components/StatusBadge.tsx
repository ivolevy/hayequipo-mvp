import { ConvocationStatus } from '@/context/MatchContext';

const statusConfig: Record<ConvocationStatus, { label: string; textClass: string }> = {
  confirmado: { label: 'Confirmados', textClass: 'text-emerald-600' },
  pendiente: { label: 'Pendientes', textClass: 'text-slate-400' },
  rechazado: { label: 'Rechazados', textClass: 'text-rose-500' },
};

interface StatusBadgeProps {
  status: ConvocationStatus;
  count: number;
}

const StatusBadge = ({ status, count }: StatusBadgeProps) => {
  const config = statusConfig[status];
  return (
    <span className="flex items-center">
      <span className={`text-[9px] font-black uppercase tracking-widest ${config.textClass}`}>
        {count} {config.label.toLowerCase()}
      </span>
    </span>
  );
};

export default StatusBadge;
