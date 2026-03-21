import { ArrowRight } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '@/components/common/PageHeader';
import { Panel } from '@/components/common/Panel';
import { LoadingState } from '@/components/common/States';
import { StatusBadge } from '@/components/common/StatusBadge';
import { api } from '@/services/api';
import type { Site } from '@/types/models';

export const SitesPage = () => {
  const [data, setData] = useState<Site[] | null>(null);

  useEffect(() => {
    api.getSites().then(setData);
  }, []);

  if (!data) return <LoadingState label="Loading site inventory..." />;

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Sites" title="Site Management" description="Group the network by location, compare health at a glance, and drill into local switching and wireless posture." />
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {data.map((site) => (
          <Panel key={site.id} className="flex flex-col">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-xl font-semibold text-text">{site.name}</h3>
                <p className="mt-2 text-sm text-muted">{site.address}</p>
              </div>
              <StatusBadge value={site.status} />
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <MiniStat label="Switches" value={site.switchCount} />
              <MiniStat label="APs" value={site.apCount} />
              <MiniStat label="Clients" value={site.clientCount} />
            </div>
            <div className="mt-4 rounded-2xl bg-soft px-4 py-3 text-sm text-muted">WAN status: <span className="font-semibold capitalize text-text">{site.wanStatus}</span></div>
            <Link className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-accent hover:underline" to={`/sites/${site.id}`}>Open site<ArrowRight className="h-4 w-4" /></Link>
          </Panel>
        ))}
      </div>
    </div>
  );
};

const MiniStat = ({ label, value }: { label: string; value: number }) => (
  <div className="rounded-2xl bg-soft px-4 py-3">
    <p className="text-xs uppercase tracking-wide text-muted">{label}</p>
    <p className="mt-2 text-xl font-semibold text-text">{value}</p>
  </div>
);
