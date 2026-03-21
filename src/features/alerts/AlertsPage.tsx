import { useEffect, useMemo, useState } from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { Panel } from '@/components/common/Panel';
import { LoadingState } from '@/components/common/States';
import { StatusBadge } from '@/components/common/StatusBadge';
import { SideDrawer } from '@/components/drawers/SideDrawer';
import { api } from '@/services/api';
import type { Alert } from '@/types/models';
import { formatRelativeTime } from '@/lib/utils';

export const AlertsPage = () => {
  const [alerts, setAlerts] = useState<Alert[] | null>(null);
  const [severity, setSeverity] = useState<'all' | 'critical' | 'warning' | 'info'>('all');
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);

  useEffect(() => {
    api.getAlerts().then(setAlerts);
  }, []);

  const filtered = useMemo(() => {
    if (!alerts) return [];
    return alerts.filter((alert) => (severity === 'all' ? true : alert.severity === severity));
  }, [alerts, severity]);

  if (!alerts) return <LoadingState label="Loading alerts..." />;

  return (
    <>
      <div className="space-y-6">
        <PageHeader eyebrow="Health" title="Alert Center" description="Filter by severity and inspect operational events with room for future site, device, and time-scope refinement." />
        <Panel title="Alerts" subtitle={`${filtered.length} alerts shown`} action={<select value={severity} onChange={(event) => setSeverity(event.target.value as typeof severity)} className="focus-ring rounded-2xl border border-border bg-soft px-4 py-2 text-sm text-text"><option value="all">All severities</option><option value="critical">Critical</option><option value="warning">Warning</option><option value="info">Info</option></select>}>
          <div className="space-y-3">
            {filtered.map((alert) => (
              <button key={alert.id} onClick={() => setSelectedAlert(alert)} className="w-full rounded-3xl border border-border bg-soft p-4 text-left transition hover:border-accent/30">
                <div className="flex items-center justify-between gap-3"><StatusBadge value={alert.severity} type="severity" /><span className="text-xs text-muted">{formatRelativeTime(alert.timestamp)}</span></div>
                <p className="mt-3 text-base font-semibold text-text">{alert.title}</p>
                <p className="mt-2 text-sm text-muted">{alert.description}</p>
                <div className="mt-3 flex items-center gap-3 text-xs text-muted"><span>{alert.type}</span><span>{alert.siteId}</span><span>{alert.acknowledged ? 'Acknowledged' : 'Unacknowledged'}</span></div>
              </button>
            ))}
          </div>
        </Panel>
      </div>
      <SideDrawer open={Boolean(selectedAlert)} title={selectedAlert?.title ?? ''} subtitle={selectedAlert?.type} onClose={() => setSelectedAlert(null)}>
        {selectedAlert ? (
          <div className="space-y-3">
            <DrawerItem label="Severity" value={selectedAlert.severity} />
            <DrawerItem label="Site" value={selectedAlert.siteId} />
            <DrawerItem label="Device" value={selectedAlert.deviceId ?? 'N/A'} />
            <DrawerItem label="Timestamp" value={formatRelativeTime(selectedAlert.timestamp)} />
            <DrawerItem label="Description" value={selectedAlert.description} />
          </div>
        ) : null}
      </SideDrawer>
    </>
  );
};

const DrawerItem = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-2xl bg-soft px-4 py-3">
    <p className="text-xs uppercase tracking-wide text-muted">{label}</p>
    <p className="mt-2 text-sm font-medium capitalize text-text">{value}</p>
  </div>
);
