import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { Panel } from '@/components/common/Panel';
import { LoadingState } from '@/components/common/States';
import { api } from '@/services/api';

export const ProfilesPage = () => {
  const [data, setData] = useState<Awaited<ReturnType<typeof api.getProfiles>> | null>(null);

  useEffect(() => {
    api.getProfiles().then(setData);
  }, []);

  if (!data) return <LoadingState label="Loading profile catalog..." />;

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Configuration" title="Profiles" description="Manage reusable switch, AP, SSID, VLAN, and port policy objects with future-ready CRUD flows." />
      <div className="grid gap-6 xl:grid-cols-2">
        <Panel title="Device Profiles">
          <div className="space-y-3">
            {data.deviceProfiles.map((profile) => (
              <Card key={profile.id} title={profile.name} subtitle={`${profile.type} • ${profile.assignedCount} assigned • ${profile.version}`} body={profile.description} />
            ))}
          </div>
        </Panel>
        <Panel title="VLAN Profiles">
          <div className="space-y-3">
            {data.vlanProfiles.map((profile) => (
              <Card key={profile.id} title={profile.name} subtitle={`VLAN ${profile.vlanId} • QoS ${profile.qos}`} body={profile.purpose} />
            ))}
          </div>
        </Panel>
      </div>
      <Panel title="Port Profiles">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {data.portProfiles.map((profile) => (
            <Card key={profile.id} title={profile.name} subtitle={`Access VLAN ${profile.accessVlan}`} body={`PoE ${profile.poeMode} • Voice VLAN ${profile.voiceVlan} • Storm control ${profile.stormControl}`} />
          ))}
        </div>
      </Panel>
    </div>
  );
};

const Card = ({ title, subtitle, body }: { title: string; subtitle: string; body: string }) => (
  <div className="rounded-3xl border border-border bg-soft p-4">
    <p className="font-semibold text-text">{title}</p>
    <p className="mt-1 text-xs uppercase tracking-wide text-muted">{subtitle}</p>
    <p className="mt-3 text-sm text-muted">{body}</p>
  </div>
);
