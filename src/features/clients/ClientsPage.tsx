import { Search } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Panel } from '@/components/common/Panel';
import { PageHeader } from '@/components/common/PageHeader';
import { LoadingState } from '@/components/common/States';
import { SideDrawer } from '@/components/drawers/SideDrawer';
import { DataTable, type Column } from '@/components/tables/DataTable';
import { sites } from '@/mocks/data';
import { api } from '@/services/api';
import type { Client } from '@/types/models';
import { formatRelativeTime } from '@/lib/utils';

export const ClientsPage = () => {
  const [clients, setClients] = useState<Client[] | null>(null);
  const [query, setQuery] = useState('');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  useEffect(() => {
    api.getClients().then(setClients);
  }, []);

  const filtered = useMemo(() => {
    if (!clients) return [];
    return clients.filter((client) => [client.name, client.mac, client.ip, client.username].some((value) => value.toLowerCase().includes(query.toLowerCase())));
  }, [clients, query]);

  if (!clients) return <LoadingState label="Loading client inventory..." />;

  const columns: Column<Client>[] = [
    { key: 'name', header: 'Client Name', render: (item) => <button className="text-left font-semibold text-accent hover:underline" onClick={() => setSelectedClient(item)}>{item.name}</button> },
    { key: 'type', header: 'Connection', render: (item) => item.connectionType },
    { key: 'ip', header: 'IP', render: (item) => item.ip },
    { key: 'mac', header: 'MAC', render: (item) => item.mac },
    { key: 'network', header: 'VLAN / SSID', render: (item) => item.network },
    { key: 'device', header: 'Connected Device', render: (item) => item.connectedDeviceId },
    { key: 'site', header: 'Site', render: (item) => sites.find((site) => site.id === item.siteId)?.name ?? item.siteId },
    { key: 'usage', header: 'Usage', render: (item) => `${item.usageGb.toFixed(1)} GB` },
    { key: 'status', header: 'Status', render: (item) => item.status },
  ];

  return (
    <>
      <div className="space-y-6">
        <PageHeader eyebrow="Endpoints" title="Clients & Endpoints" description="Track wired and wireless endpoints, search by identity attributes, and prepare for future historical connection views." />
        <Panel title="Client Inventory" subtitle={`${filtered.length} clients shown`}>
          <div className="mb-4 flex items-center gap-3 rounded-2xl border border-border bg-soft px-4 py-3">
            <Search className="h-4 w-4 text-muted" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} className="w-full border-0 bg-transparent text-sm text-text focus:outline-none" placeholder="Search hostname, MAC, IP, username" />
          </div>
          <DataTable data={filtered} columns={columns} keyExtractor={(item) => item.id} />
        </Panel>
      </div>
      <SideDrawer open={Boolean(selectedClient)} title={selectedClient?.name ?? ''} subtitle="Client detail drawer" onClose={() => setSelectedClient(null)}>
        {selectedClient ? (
          <div className="space-y-3">
            <DrawerItem label="Username" value={selectedClient.username} />
            <DrawerItem label="Connection" value={selectedClient.connectionType} />
            <DrawerItem label="IP / MAC" value={`${selectedClient.ip} • ${selectedClient.mac}`} />
            <DrawerItem label="Network" value={selectedClient.network} />
            <DrawerItem label="Connected Device" value={selectedClient.connectedDeviceId} />
            <DrawerItem label="Status" value={selectedClient.status} />
            <DrawerItem label="Last Seen" value={formatRelativeTime(selectedClient.lastSeen)} />
            <DrawerItem label="Historical Connection" value="Placeholder for future client roaming history and session trails." />
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
