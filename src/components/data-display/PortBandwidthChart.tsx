import { cn, formatBytes } from '@/lib/utils';
import type { SwitchPort } from '@/types/models';

export const PortBandwidthChart = ({ ports }: { ports: SwitchPort[] }) => {
  const activePorts = ports.filter((port) => port.stats);
  const maxValue = Math.max(
    1,
    ...activePorts.flatMap((port) => [port.stats?.rxBytes ?? 0, port.stats?.txBytes ?? 0]),
  );

  return (
    <div className="overflow-x-auto">
      <div className="flex min-w-max items-end gap-2 rounded-3xl bg-soft p-4">
        {ports.map((port) => {
          const rxValue = port.stats?.rxBytes ?? 0;
          const txValue = port.stats?.txBytes ?? 0;
          const totalValue = rxValue + txValue;
          const rxHeight = Math.max(6, (rxValue / maxValue) * 112);
          const txHeight = Math.max(6, (txValue / maxValue) * 112);
          const inactive = totalValue === 0;

          return (
            <div key={port.id} className="group flex w-10 shrink-0 flex-col items-center gap-2">
              <div className="relative flex h-36 items-end gap-1">
                <div
                  className={cn(
                    'w-3 rounded-t-full transition-all',
                    inactive ? 'bg-slate-500/35' : 'bg-sky-400/80',
                  )}
                  style={{ height: `${rxHeight}px` }}
                  title={`RX ${formatBytes(rxValue)}`}
                />
                <div
                  className={cn(
                    'w-3 rounded-t-full transition-all',
                    inactive ? 'bg-slate-500/25' : 'bg-accent/80',
                  )}
                  style={{ height: `${txHeight}px` }}
                  title={`TX ${formatBytes(txValue)}`}
                />

                <div className="pointer-events-none absolute bottom-full left-1/2 z-30 hidden w-48 -translate-x-1/2 pb-3 group-hover:block">
                  <div className="rounded-2xl border border-border bg-canvas px-3 py-2 text-xs text-muted shadow-xl">
                    <p className="font-semibold text-text">{formatPortLabel(port.portNumber)}</p>
                    <p className="mt-1">RX: {formatBytes(rxValue)}</p>
                    <p>TX: {formatBytes(txValue)}</p>
                    <p>Total: {formatBytes(totalValue)}</p>
                  </div>
                </div>
              </div>
              <div className="text-center">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-text">{compactPortLabel(port.portNumber)}</p>
                <p className="mt-1 text-[10px] text-muted">{formatBytes(totalValue)}</p>
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-3 flex items-center gap-4 text-xs text-muted">
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-sky-400/80" />
          RX bytes
        </div>
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-accent/80" />
          TX bytes
        </div>
        <span>All bars use the same switch-wide scale.</span>
      </div>
    </div>
  );
};

const formatPortLabel = (value: string) => (value.toLowerCase().startsWith('port') ? value : `Port ${value}`);
const compactPortLabel = (value: string) => value.replace(/^port/i, 'p');
