import { KeyRound, LockKeyhole, Server, ShieldCheck } from 'lucide-react';
import { useMemo, useState } from 'react';
import { ActionButton } from '@/components/common/ActionButton';
import { Panel } from '@/components/common/Panel';
import { StatusBadge } from '@/components/common/StatusBadge';
import type { SetupStatus } from '@/types/models';

interface StartupWizardPageProps {
  status: SetupStatus | null;
  saving: boolean;
  error: string;
  onSubmit: (payload: {
    username: string;
    password: string;
    fortigateIp: string;
    fortigateApiKey: string;
  }) => Promise<void>;
}

export const StartupWizardPage = ({ status, saving, error, onSubmit }: StartupWizardPageProps) => {
  const [form, setForm] = useState({
    username: '',
    password: '',
    fortigateIp: '',
    fortigateApiKey: '',
  });

  const missingItems = useMemo(
    () => status?.checks.filter((check) => !check.fileExists || !check.hasValue) ?? [],
    [status],
  );

  return (
    <div className="min-h-screen bg-canvas px-4 py-8">
      <div className="mx-auto grid max-w-6xl gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="panel overflow-hidden p-0">
          <div className="bg-gradient-to-br from-accent/15 via-accent-muted to-sky-400/10 p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-accent">EdgeOps Cloud</p>
            <h1 className="mt-4 text-4xl font-semibold text-text">Startup Wizard</h1>
            <p className="mt-3 max-w-2xl text-subtle">
              Complete the initial FortiGate connection details. If any required setup database file is missing later,
              the wizard will automatically be shown again.
            </p>
          </div>
          <div className="p-8">
            {error ? (
              <div className="mb-5 rounded-2xl border border-danger/25 bg-danger/10 px-4 py-3 text-sm text-danger">{error}</div>
            ) : null}
            <form
              className="grid gap-4"
              onSubmit={async (event) => {
                event.preventDefault();
                await onSubmit(form);
              }}
            >
              <Field
                label="Username"
                icon={ShieldCheck}
                value={form.username}
                onChange={(value) => setForm((current) => ({ ...current, username: value }))}
                placeholder="admin"
              />
              <Field
                label="Password"
                type="password"
                icon={LockKeyhole}
                value={form.password}
                onChange={(value) => setForm((current) => ({ ...current, password: value }))}
                placeholder="Enter appliance password"
              />
              <Field
                label="FortiGate IP"
                icon={Server}
                value={form.fortigateIp}
                onChange={(value) => setForm((current) => ({ ...current, fortigateIp: value }))}
                placeholder="192.0.2.10"
              />
              <Field
                label="FortiGate API Key"
                type="password"
                icon={KeyRound}
                value={form.fortigateApiKey}
                onChange={(value) => setForm((current) => ({ ...current, fortigateApiKey: value }))}
                placeholder="Paste API token"
              />

              <div className="pt-2">
                <ActionButton className="w-full justify-center bg-accent text-white hover:border-accent hover:text-white" disabled={saving}>
                  {saving ? 'Saving setup...' : 'Complete Setup'}
                </ActionButton>
              </div>
            </form>
          </div>
        </div>

        <div className="space-y-6">
          <Panel title="Required Files" subtitle="Each value is persisted into its own SQLite file.">
            <div className="space-y-3">
              {(status?.checks ?? []).map((check) => (
                <div key={check.key} className="rounded-2xl bg-soft px-4 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-medium text-text">{check.label}</p>
                      <p className="mt-1 break-all text-xs text-muted">{check.filePath}</p>
                    </div>
                    <StatusBadge value={check.fileExists && check.hasValue ? 'healthy' : 'warning'} />
                  </div>
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="Wizard Trigger Rules">
            <div className="space-y-3 text-sm text-muted">
              <p>The wizard completes only when all four setup files exist and contain values.</p>
              <p>If any file is deleted or becomes empty, the app will redirect back here on the next load.</p>
              <p>Passwords and API keys are stored separately from the non-secret setup details.</p>
            </div>
          </Panel>

          {missingItems.length ? (
            <Panel title="Current Missing Items" subtitle={`${missingItems.length} setup requirement(s) still incomplete.`}>
              <div className="space-y-3">
                {missingItems.map((item) => (
                  <div key={item.key} className="rounded-2xl border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-warning">
                    {item.label} is missing or has no saved value.
                  </div>
                ))}
              </div>
            </Panel>
          ) : null}
        </div>
      </div>
    </div>
  );
};

const Field = ({
  label,
  value,
  onChange,
  placeholder,
  icon: Icon,
  type = 'text',
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  icon: typeof ShieldCheck;
  type?: 'text' | 'password';
}) => (
  <label className="grid gap-2">
    <span className="text-sm font-medium text-text">{label}</span>
    <div className="flex items-center gap-3 rounded-2xl border border-border bg-soft px-4 py-3">
      <Icon className="h-4 w-4 text-muted" />
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full border-0 bg-transparent text-sm text-text placeholder:text-muted focus:outline-none"
        placeholder={placeholder}
      />
    </div>
  </label>
);
