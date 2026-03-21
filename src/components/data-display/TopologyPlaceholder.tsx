import { Network, Server, Wifi } from 'lucide-react';
import { Panel } from '@/components/common/Panel';

export const TopologyPlaceholder = () => (
  <Panel title="Topology Overview" subtitle="Placeholder canvas for future live topology and path health rendering." className="overflow-hidden">
    <div className="relative rounded-[28px] border border-dashed border-border bg-grid bg-[size:28px_28px] p-8">
      <div className="mx-auto flex max-w-2xl items-center justify-between gap-6">
        <Node label="Core Site" icon={Network} />
        <div className="h-px flex-1 bg-gradient-to-r from-accent via-sky-400 to-accent" />
        <Node label="Edge Switches" icon={Server} />
        <div className="h-px flex-1 bg-gradient-to-r from-accent via-sky-400 to-accent" />
        <Node label="Wireless Mesh" icon={Wifi} />
      </div>
    </div>
  </Panel>
);

const Node = ({ label, icon: Icon }: { label: string; icon: typeof Network }) => (
  <div className="flex flex-col items-center gap-3">
    <div className="rounded-3xl border border-border bg-surface p-4 text-accent shadow-panel">
      <Icon className="h-6 w-6" />
    </div>
    <p className="text-sm font-medium text-text">{label}</p>
  </div>
);
