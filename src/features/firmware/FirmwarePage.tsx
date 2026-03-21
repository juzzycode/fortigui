import { useEffect, useMemo, useState } from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { Panel } from '@/components/common/Panel';
import { LoadingState } from '@/components/common/States';
import { DataTable, type Column } from '@/components/tables/DataTable';
import { api } from '@/services/api';
import type { FirmwareStatus } from '@/types/models';

export const FirmwarePage = () => {
  const [rows, setRows] = useState<FirmwareStatus[] | null>(null);

  useEffect(() => {
    api.getFirmwareStatuses().then(setRows);
  }, []);

  const summary = useMemo(() => {
    if (!rows) return { compliant: 0, pending: 0, blocked: 0 };
    return rows.reduce((acc, row) => {
      acc[row.compliance] += 1;
      return acc;
    }, { compliant: 0, pending: 0, blocked: 0 });
  }, [rows]);

  if (!rows) return <LoadingState label="Loading firmware view..." />;

  const columns: Column<FirmwareStatus>[] = [
    { key: 'type', header: 'Type', render: (item) => item.deviceType },
    { key: 'device', header: 'Device ID', render: (item) => item.deviceId },
    { key: 'current', header: 'Current', render: (item) => item.current },
    { key: 'target', header: 'Target', render: (item) => item.target },
    { key: 'compliance', header: 'Compliance', render: (item) => item.compliance },
    { key: 'group', header: 'Upgrade Group', render: (item) => item.rolloutGroup },
    { key: 'eligible', header: 'Eligible', render: (item) => (item.eligible ? 'Yes' : 'No') },
  ];

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Lifecycle" title="Firmware Lifecycle" description="Review compliance posture, staged rollout groupings, and eligibility before wiring in live upgrade orchestration." />
      <div className="grid gap-4 md:grid-cols-3">
        <SummaryCard label="Compliant" value={summary.compliant} />
        <SummaryCard label="Pending" value={summary.pending} />
        <SummaryCard label="Blocked" value={summary.blocked} />
      </div>
      <Panel title="Staged Rollout Queue" subtitle="Mock upgrade waves designed to match a future orchestration API.">
        <DataTable data={rows} columns={columns} keyExtractor={(item) => item.id} />
      </Panel>
    </div>
  );
};

const SummaryCard = ({ label, value }: { label: string; value: number }) => (
  <div className="panel p-5">
    <p className="text-xs uppercase tracking-wide text-muted">{label}</p>
    <p className="mt-3 text-3xl font-semibold text-text">{value}</p>
  </div>
);
