import { Layers3, RadioTower, ShieldCheck, SplitSquareVertical } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { Panel } from '@/components/common/Panel';
import { EmptyState, ErrorState, LoadingState } from '@/components/common/States';
import { StatCard } from '@/components/common/StatCard';
import { DataTable, type Column } from '@/components/tables/DataTable';
import { api } from '@/services/api';
import { useAppStore } from '@/store/useAppStore';
import type { DeviceProfile, PortProfile, VLANProfile } from '@/types/models';

export const ProfilesPage = () => {
  const [data, setData] = useState<Awaited<ReturnType<typeof api.getProfiles>> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { selectedSiteId } = useAppStore();

  useEffect(() => {
    setError(null);
    api
      .getProfiles(selectedSiteId)
      .then(setData)
      .catch((requestError) => {
        setData({ deviceProfiles: [], vlanProfiles: [], portProfiles: [] });
        setError(requestError instanceof Error ? requestError.message : 'Unable to load profiles');
      });
  }, [selectedSiteId]);

  const profileSummary = useMemo(() => {
    if (!data) return { switchProfiles: 0, apProfiles: 0, ssidProfiles: 0, vlanProfiles: 0 };
    return {
      switchProfiles: data.deviceProfiles.filter((profile) => profile.type === 'switch').length,
      apProfiles: data.deviceProfiles.filter((profile) => profile.type === 'ap').length,
      ssidProfiles: data.deviceProfiles.filter((profile) => profile.type === 'ssid').length,
      vlanProfiles: data.vlanProfiles.length,
    };
  }, [data]);

  if (!data) return <LoadingState label="Loading profile catalog..." />;

  const deviceColumns: Column<DeviceProfile>[] = [
    { key: 'name', header: 'Profile', render: (item) => <div><p className="font-medium text-text">{item.name}</p><p className="text-xs uppercase tracking-wide text-muted">{item.type}</p></div> },
    { key: 'assignedCount', header: 'Assigned', render: (item) => item.assignedCount },
    { key: 'version', header: 'Observed Version', render: (item) => item.version },
    { key: 'description', header: 'Description', className: 'max-w-md', render: (item) => item.description },
  ];

  const vlanColumns: Column<VLANProfile>[] = [
    { key: 'name', header: 'VLAN Profile', render: (item) => item.name },
    { key: 'vlanId', header: 'VLAN ID', render: (item) => (item.vlanId > 0 ? item.vlanId : 'Derived') },
    { key: 'qos', header: 'Traffic Class', render: (item) => item.qos },
    { key: 'purpose', header: 'Purpose', className: 'max-w-md', render: (item) => item.purpose },
  ];

  const portColumns: Column<PortProfile>[] = [
    { key: 'name', header: 'Port Policy', render: (item) => item.name },
    { key: 'access', header: 'Access VLAN', render: (item) => item.accessVlan },
    { key: 'poe', header: 'PoE Mode', render: (item) => item.poeMode },
    { key: 'voice', header: 'Voice VLAN', render: (item) => item.voiceVlan },
    { key: 'storm', header: 'Storm Control', render: (item) => item.stormControl },
  ];

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Configuration" title="Profiles" description="Live derived policy views for switch, AP, SSID, VLAN, and port objects observed in the FortiGate-managed estate." />
      {error ? <ErrorState title="Profile API unavailable" description={error} /> : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Switch Profiles" value={String(profileSummary.switchProfiles)} icon={Layers3} />
        <StatCard title="AP Profiles" value={String(profileSummary.apProfiles)} icon={RadioTower} />
        <StatCard title="SSID Profiles" value={String(profileSummary.ssidProfiles)} icon={ShieldCheck} />
        <StatCard title="VLAN Profiles" value={String(profileSummary.vlanProfiles)} icon={SplitSquareVertical} />
      </div>

      <Panel title="Device Profiles" subtitle="Grouped from live switch, AP, and SSID assignments seen in the selected site scope.">
        {data.deviceProfiles.length ? (
          <DataTable data={data.deviceProfiles} columns={deviceColumns} keyExtractor={(item) => item.id} />
        ) : (
          <EmptyState title="No device profiles observed" description="Add a live site or widen the site selector to collect profile assignments." />
        )}
      </Panel>

      <div className="grid gap-6 xl:grid-cols-2">
        <Panel title="VLAN Profiles" subtitle="Derived from live switch ports and SSID mappings.">
          {data.vlanProfiles.length ? (
            <DataTable data={data.vlanProfiles} columns={vlanColumns} keyExtractor={(item) => item.id} />
          ) : (
            <EmptyState title="No VLAN objects observed" description="No VLAN-bearing ports or WLAN mappings were returned for the current scope." />
          )}
        </Panel>

        <Panel title="Port Profiles" subtitle="Observed port policy names and baseline defaults from managed switch ports.">
          {data.portProfiles.length ? (
            <DataTable data={data.portProfiles} columns={portColumns} keyExtractor={(item) => item.id} />
          ) : (
            <EmptyState title="No port policies observed" description="Managed switch data did not expose any port policy assignments yet." />
          )}
        </Panel>
      </div>
    </div>
  );
};
