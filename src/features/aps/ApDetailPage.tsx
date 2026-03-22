import type { ReactNode } from 'react';
import { Lightbulb, Radio, RotateCw, Save, Wifi } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { ActionButton } from '@/components/common/ActionButton';
import { ErrorState, LoadingState } from '@/components/common/States';
import { PageHeader } from '@/components/common/PageHeader';
import { Panel } from '@/components/common/Panel';
import { StatusBadge } from '@/components/common/StatusBadge';
import { cn, formatDuration, formatPercent, formatRelativeTime } from '@/lib/utils';
import { api } from '@/services/api';
import { useAppStore } from '@/store/useAppStore';
import type { AccessPoint, AccessPointClient, EventLog, Radio as RadioModel, SSID } from '@/types/models';

interface RadioSummary {
  clientCount: number;
  avgSignal: number | null;
  avgSnr: number | null;
  avgRetry: number | null;
  avgDiscard: number | null;
  weakestClient?: AccessPointClient;
  strongestClient?: AccessPointClient;
}

export const ApDetailPage = () => {
  const { id = '' } = useParams();
  const [device, setDevice] = useState<AccessPoint | null>();
  const [events, setEvents] = useState<EventLog[]>([]);
  const [message, setMessage] = useState('');
  const role = useAppStore((state) => state.role);
  const canOperate = role !== 'read_only';

  useEffect(() => {
    api.getApById(id).then(setDevice);
    api.getEventLogsByTarget(id).then(setEvents);
  }, [id]);

  const radioSummaries = useMemo(() => {
    if (!device) return new Map<string, RadioSummary>();

    return new Map(
      device.radios.map((radio) => {
        const clients = (device.clientDevices ?? []).filter((client) => client.radioId === radio.id);
        const average = (values: Array<number | undefined>) => {
          const present = values.filter((value): value is number => Number.isFinite(value));
          if (!present.length) return null;
          return Math.round(present.reduce((sum, value) => sum + value, 0) / present.length);
        };

        const weakestClient = clients
          .filter((client) => Number.isFinite(client.signal))
          .sort((left, right) => (left.signal ?? 0) - (right.signal ?? 0))[0];
        const strongestClient = clients
          .filter((client) => Number.isFinite(client.signal))
          .sort((left, right) => (right.signal ?? 0) - (left.signal ?? 0))[0];

        return [
          radio.id,
          {
            clientCount: clients.length,
            avgSignal: average(clients.map((client) => client.signal)),
            avgSnr: average(clients.map((client) => client.snr)),
            avgRetry: average(clients.map((client) => client.retryPercent)),
            avgDiscard: average(clients.map((client) => client.discardPercent)),
            weakestClient,
            strongestClient,
          },
        ];
      }),
    );
  }, [device]);

  const ssidClients = useMemo(() => {
    const grouped = new Map<string, AccessPointClient[]>();
    for (const client of device?.clientDevices ?? []) {
      const existing = grouped.get(client.ssid) ?? [];
      existing.push(client);
      grouped.set(client.ssid, existing);
    }
    return grouped;
  }, [device]);

  if (device === undefined) return <LoadingState label="Loading AP detail..." />;
  if (device === null) return <ErrorState title="Access point not found" description="The requested device ID could not be found for any configured site." />;

  const runAction = async (action: string, payload?: Record<string, string | boolean>) => {
    const result = await api.simulateDeviceAction(action, device.id, payload);
    setMessage(result.message);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="AP Detail"
        title={device.name}
        description={`${device.model} at ${device.ip || 'management IP unavailable'}. Inventory, radios, SSIDs, and client counts are live from the FortiGate API.`}
        actions={
          <>
            <ActionButton onClick={() => runAction('reboot-ap')} disabled={!canOperate}><RotateCw className="mr-2 h-4 w-4" />Reboot AP</ActionButton>
            <ActionButton onClick={() => runAction('blink-led')} disabled={!canOperate}><Lightbulb className="mr-2 h-4 w-4" />Blink LED</ActionButton>
            <ActionButton onClick={() => runAction('assign-profile', { profile: 'ap-office-standard' })} disabled={!canOperate}><Save className="mr-2 h-4 w-4" />Assign Profile</ActionButton>
          </>
        }
      />
      {message ? <div className="rounded-2xl border border-accent/25 bg-accent-muted px-4 py-3 text-sm font-medium text-accent">{message}</div> : null}

      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <Panel title="Summary">
          <div className="grid gap-4 md:grid-cols-2">
            <SummaryItem label="Status" value={<StatusBadge value={device.status} />} />
            <SummaryItem label="Firmware" value={`${device.firmware} target ${device.targetFirmware}`} />
            <SummaryItem label="Clients" value={device.clients} />
            <SummaryItem label="Profile" value={device.profileId} />
            <SummaryItem label="Management IP" value={device.ip || 'Unavailable'} />
            <SummaryItem label="Last Seen" value={formatRelativeTime(device.lastSeen)} />
            <SummaryItem label="Neighbor APs" value={device.neighborAps.length || 'None'} />
          </div>
        </Panel>
        <Panel title="Config Summary">
          <div className="space-y-3">
            {device.configSummary.map((item) => (
              <div key={item} className="rounded-2xl bg-soft px-4 py-3 text-sm text-text">{item}</div>
            ))}
          </div>
        </Panel>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Panel title="Radio Status">
          <div className="space-y-3">
            {device.radios.map((radio) => (
              <RadioCard key={radio.id} radio={radio} summary={radioSummaries.get(radio.id)} />
            ))}
          </div>
        </Panel>
        <Panel title="SSIDs Broadcast">
          <div className="space-y-3">
            {device.ssids.map((ssid) => (
              <SsidCard key={ssid.id} ssid={ssid} clients={ssidClients.get(ssid.name) ?? []} />
            ))}
          </div>
        </Panel>
        <Panel title="Neighbors / Events">
          <div className="space-y-3">
            {device.neighborAps.map((neighbor) => (
              <div key={neighbor} className="rounded-2xl bg-soft px-4 py-3 text-sm text-text">Neighbor AP: {neighbor}</div>
            ))}
            {events.map((event) => (
              <div key={event.id} className="rounded-2xl border border-border bg-soft p-4">
                <p className="text-sm font-semibold text-text">{event.message}</p>
                <p className="mt-2 text-xs text-muted">{formatRelativeTime(event.timestamp)}</p>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <Panel title="Connected Clients">
        <div className="grid gap-3 md:grid-cols-2">
          {(device.clientDevices ?? []).length ? (
            device.clientDevices?.map((client) => <ClientCard key={client.id} client={client} />)
          ) : (
            <div className="rounded-2xl bg-soft px-4 py-6 text-sm text-muted">No live wireless clients are currently associated with this access point.</div>
          )}
        </div>
      </Panel>

      <Panel title="Simulated Wireless Actions">
        <div className="flex flex-wrap gap-3">
          <ActionButton onClick={() => runAction('change-ap-name', { name: 'Conference AP East' })} disabled={!canOperate}>Change AP Name</ActionButton>
          <ActionButton onClick={() => runAction('toggle-radio', { radio: '5 GHz', enabled: false })} disabled={!canOperate}>Disable 5 GHz Radio</ActionButton>
          <ActionButton onClick={() => runAction('assign-profile', { profile: 'ap-lab-high-density' })} disabled={!canOperate}>Assign AP Profile</ActionButton>
        </div>
      </Panel>
    </div>
  );
};

const RadioCard = ({ radio, summary }: { radio: RadioModel; summary?: RadioSummary }) => (
  <div className="group relative rounded-2xl bg-soft p-4">
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <div className="rounded-2xl bg-accent-muted p-2 text-accent"><Radio className="h-4 w-4" /></div>
        <div>
          <p className="font-semibold text-text">{radio.band}</p>
          <p className="text-xs text-muted">Channel {radio.channel || 'Auto'} | {radio.txPower}</p>
        </div>
      </div>
      <StatusBadge value={radio.status === 'up' ? 'healthy' : 'offline'} />
    </div>
    <div className="mt-3">
      <div className="mb-1 flex items-center justify-between text-xs text-muted"><span>Load Proxy</span><span>{formatPercent(radio.utilization)}</span></div>
      <div className="h-2 rounded-full bg-slate-200/10"><div className="h-2 rounded-full bg-accent" style={{ width: `${radio.utilization}%` }} /></div>
    </div>
    <div className="mt-3 flex items-center gap-3 text-xs text-muted">
      <span>{summary?.clientCount ?? 0} clients</span>
      <span>{summary?.avgSignal ?? 'N/A'} dBm avg</span>
      <span>{summary?.avgSnr ?? 'N/A'} dB SNR</span>
    </div>
    <HoverCard className="top-3 right-3 w-72">
      <HoverRow label="Connected clients" value={summary?.clientCount ?? 0} />
      <HoverRow label="Average signal" value={summary?.avgSignal !== null && summary?.avgSignal !== undefined ? `${summary.avgSignal} dBm` : 'N/A'} />
      <HoverRow label="Average SNR" value={summary?.avgSnr !== null && summary?.avgSnr !== undefined ? `${summary.avgSnr} dB` : 'N/A'} />
      <HoverRow label="Average retry" value={summary?.avgRetry !== null && summary?.avgRetry !== undefined ? `${summary.avgRetry}%` : 'N/A'} />
      <HoverRow label="Average discard" value={summary?.avgDiscard !== null && summary?.avgDiscard !== undefined ? `${summary.avgDiscard}%` : 'N/A'} />
      <HoverRow label="Strongest client" value={summary?.strongestClient?.name || 'N/A'} />
      <HoverRow label="Weakest client" value={summary?.weakestClient?.name || 'N/A'} />
    </HoverCard>
  </div>
);

const SsidCard = ({ ssid, clients }: { ssid: SSID; clients: AccessPointClient[] }) => {
  const bandLabels = Array.from(new Set(clients.map((client) => client.radioType || client.radioId))).filter(Boolean);

  return (
    <div className="group relative rounded-2xl bg-soft p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-text">{ssid.name}</p>
          <p className="mt-1 text-xs text-muted">{ssid.vlan}</p>
        </div>
        <div className="rounded-full bg-accent/10 px-2.5 py-1 text-xs font-semibold text-accent">{ssid.clientCount} clients</div>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <QuickStat label="Security" value={ssid.authMode} />
        <QuickStat label="Bands" value={bandLabels.join(', ') || 'N/A'} />
        <QuickStat label="Top Host" value={clients[0]?.hostname || clients[0]?.name || 'None'} />
        <QuickStat label="Visible Clients" value={clients.length} />
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {clients.slice(0, 3).map((client) => (
          <span key={client.id} className="rounded-full bg-canvas px-2 py-1 text-xs text-muted">{client.name}</span>
        ))}
        {!clients.length ? <span className="text-xs text-muted">No active clients</span> : null}
      </div>
      <HoverCard className="top-3 right-3 w-80">
        <HoverRow label="Client count" value={ssid.clientCount} />
        <HoverRow label="Bands in use" value={bandLabels.join(', ') || 'N/A'} />
        <HoverRow label="Top hostnames" value={clients.slice(0, 4).map((client) => client.hostname || client.name).join(', ') || 'N/A'} />
        <HoverRow label="MAC preview" value={clients.slice(0, 3).map((client) => client.mac).join(', ') || 'N/A'} />
      </HoverCard>
    </div>
  );
};

const QuickStat = ({ label, value }: { label: string; value: ReactNode }) => (
  <div className="rounded-2xl border border-border/70 bg-canvas px-3 py-2">
    <p className="text-[11px] uppercase tracking-wide text-muted">{label}</p>
    <p className="mt-1 text-sm font-medium text-text">{value}</p>
  </div>
);

const ClientCard = ({ client }: { client: AccessPointClient }) => (
  <div className="group relative rounded-2xl border border-border bg-soft p-4">
    <div className="flex items-start justify-between gap-3">
      <div>
        <p className="text-sm font-semibold text-text">{client.name}</p>
        <p className="mt-1 text-xs text-muted">{client.ip || client.mac}</p>
      </div>
      <StatusBadge value={client.health === 'poor' || client.health === 'fair' ? 'warning' : 'healthy'} />
    </div>
    <div className="mt-3 grid gap-2 text-xs text-muted">
      <div>SSID: {client.ssid}</div>
      <div>Radio: {client.radioType || client.radioId}</div>
      <div>Signal: {client.signal ?? 'N/A'} dBm</div>
      <div>SNR: {client.snr ?? 'N/A'} dB</div>
    </div>
    <HoverCard className="top-3 right-3 w-80">
      <HoverRow label="Hostname" value={client.hostname || 'N/A'} />
      <HoverRow label="DHCP name" value={client.dhcpName || 'N/A'} />
      <HoverRow label="MAC address" value={client.mac} />
      <HoverRow label="Manufacturer" value={client.manufacturer || 'N/A'} />
      <HoverRow label="RX / TX rate" value={`${client.rxRateMbps ?? 'N/A'} / ${client.txRateMbps ?? 'N/A'} Mbps`} />
      <HoverRow label="Retry / discard" value={`${client.retryPercent ?? 'N/A'}% / ${client.discardPercent ?? 'N/A'}%`} />
      <HoverRow label="Idle time" value={client.idleSeconds !== undefined ? formatDuration(client.idleSeconds) : 'N/A'} />
      <HoverRow label="Connected since" value={client.connectedAt ? formatRelativeTime(client.connectedAt) : 'N/A'} />
    </HoverCard>
  </div>
);

const HoverCard = ({ children, className }: { children: ReactNode; className?: string }) => (
  <div className={cn('pointer-events-none absolute z-30 hidden rounded-2xl border border-border bg-canvas p-3 shadow-2xl group-hover:block', className)}>
    <div className="space-y-2 text-xs text-muted">{children}</div>
  </div>
);

const HoverRow = ({ label, value }: { label: string; value: ReactNode }) => (
  <div className="grid grid-cols-[110px_1fr] gap-3">
    <span className="text-muted">{label}</span>
    <span className="text-text">{value}</span>
  </div>
);

const SummaryItem = ({ label, value }: { label: string; value: ReactNode }) => (
  <div className="rounded-2xl bg-soft px-4 py-3">
    <p className="text-xs uppercase tracking-wide text-muted">{label}</p>
    <div className="mt-2 text-sm font-medium text-text">{value}</div>
  </div>
);
