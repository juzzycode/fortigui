import { cn } from '@/lib/utils';
import type { SwitchPort } from '@/types/models';

const tone: Record<SwitchPort['status'], string> = {
  up: 'bg-success/20 text-success border-success/20',
  down: 'bg-offline/20 text-offline border-offline/20',
  disabled: 'bg-slate-500/20 text-slate-400 border-slate-500/20',
  warning: 'bg-warning/20 text-warning border-warning/20',
};

export const PortMap = ({ ports }: { ports: SwitchPort[] }) => (
  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
    {ports.map((port) => (
      <div key={port.id} className={cn('rounded-2xl border p-3', tone[port.status])}>
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-semibold">Port {port.portNumber}</span>
          <span className="text-[11px] uppercase">{port.speed}</span>
        </div>
        <p className="mt-3 truncate text-xs">{port.description}</p>
        <div className="mt-2 flex items-center justify-between text-[11px]">
          <span>{port.vlan}</span>
          <span>{port.poeWatts}W</span>
        </div>
      </div>
    ))}
  </div>
);
