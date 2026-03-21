import type { LucideIcon } from 'lucide-react';
import { ArrowUpRight } from 'lucide-react';
import { Panel } from '@/components/common/Panel';

interface StatCardProps {
  title: string;
  value: string;
  delta?: string;
  icon: LucideIcon;
}

export const StatCard = ({ title, value, delta, icon: Icon }: StatCardProps) => (
  <Panel className="overflow-hidden">
    <div className="flex items-start justify-between gap-3">
      <div>
        <p className="text-sm font-medium text-muted">{title}</p>
        <p className="mt-3 text-3xl font-semibold text-text">{value}</p>
        {delta ? (
          <div className="mt-3 inline-flex items-center gap-1 rounded-full bg-accent-muted px-2.5 py-1 text-xs font-semibold text-accent">
            <ArrowUpRight className="h-3.5 w-3.5" />
            {delta}
          </div>
        ) : null}
      </div>
      <div className="rounded-2xl bg-accent-muted p-3 text-accent">
        <Icon className="h-5 w-5" />
      </div>
    </div>
  </Panel>
);
