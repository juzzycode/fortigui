import type { ReactNode } from 'react';
import { MapPinned } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { ErrorState, LoadingState } from '@/components/common/States';
import { PageHeader } from '@/components/common/PageHeader';
import { Panel } from '@/components/common/Panel';
import { StatusBadge } from '@/components/common/StatusBadge';
import { accessPoints, alerts, switches } from '@/mocks/data';
import { api } from '@/services/api';
import type { Site } from '@/types/models';

export const SiteDetailPage = () => {
  const { id = '' } = useParams();
  const [site, setSite] = useState<Site | null>();

  useEffect(() => {
    api.getSiteById(id).then(setSite);
  }, [id]);

  const localSwitches = useMemo(() => switches.filter((device) => device.siteId === id), [id]);
  const localAps = useMemo(() => accessPoints.filter((device) => device.siteId === id), [id]);
  const localAlerts = useMemo(() => alerts.filter((alert) => alert.siteId === id), [id]);

  if (site === undefined) return <LoadingState label="Loading site detail..." />;
  if (site === null) return <ErrorState title="Site not found" description="The requested site does not exist in mock inventory." />;

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Site Detail" title={site.name} description={`${site.address} • ${site.timezone}. Site pages are structured for future WAN, topology, and policy drilldowns.`} />
      <div className="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
        <Panel title="Site Summary">
          <div className="grid gap-4 md:grid-cols-2">
            <SummaryItem label="Health" value={<StatusBadge value={site.status} />} />
            <SummaryItem label="WAN Status" value={site.wanStatus} />
            <SummaryItem label="Switches" value={site.switchCount} />
            <SummaryItem label="Access Points" value={site.apCount} />
            <SummaryItem label="Clients" value={site.clientCount} />
            <SummaryItem label="Region" value={site.region} />
          </div>
        </Panel>
        <Panel title="Map Placeholder" subtitle="Reserved for geospatial context and WAN edge overlay.">
          <div className="flex min-h-72 items-center justify-center rounded-[28px] border border-dashed border-border bg-soft text-center">
            <div><MapPinned className="mx-auto h-10 w-10 text-accent" /><p className="mt-4 text-lg font-semibold text-text">Location map placeholder</p><p className="mt-2 text-subtle">Embed real site mapping, edge circuits, and latency overlays here later.</p></div>
          </div>
        </Panel>
      </div>
      <div className="grid gap-6 xl:grid-cols-3">
        <Panel title="Switch Summary">
          <div className="space-y-3">
            {localSwitches.map((device) => (
              <div key={device.id} className="rounded-2xl bg-soft p-4">
                <div className="flex items-center justify-between gap-3"><span className="font-semibold text-text">{device.hostname}</span><StatusBadge value={device.status} /></div>
                <p className="mt-2 text-xs text-muted">{device.model} • {device.portsUsed}/{device.totalPorts} ports used</p>
              </div>
            ))}
          </div>
        </Panel>
        <Panel title="Wireless Summary">
          <div className="space-y-3">
            {localAps.map((device) => (
              <div key={device.id} className="rounded-2xl bg-soft p-4">
                <div className="flex items-center justify-between gap-3"><span className="font-semibold text-text">{device.name}</span><StatusBadge value={device.status} /></div>
                <p className="mt-2 text-xs text-muted">{device.clients} clients • {device.radios.length} radios</p>
              </div>
            ))}
          </div>
        </Panel>
        <Panel title="Recent Alerts">
          <div className="space-y-3">
            {localAlerts.map((alert) => (
              <div key={alert.id} className="rounded-2xl border border-border bg-soft p-4">
                <StatusBadge value={alert.severity} type="severity" />
                <p className="mt-3 text-sm font-semibold text-text">{alert.title}</p>
                <p className="mt-2 text-xs text-muted">{alert.type}</p>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
};

const SummaryItem = ({ label, value }: { label: string; value: ReactNode }) => (
  <div className="rounded-2xl bg-soft px-4 py-3">
    <p className="text-xs uppercase tracking-wide text-muted">{label}</p>
    <div className="mt-2 text-sm font-medium capitalize text-text">{value}</div>
  </div>
);
