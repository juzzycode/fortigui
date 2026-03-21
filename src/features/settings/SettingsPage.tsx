import { ShieldCheck, UserCog, Workflow } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { Panel } from '@/components/common/Panel';
import { useAppStore } from '@/store/useAppStore';

export const SettingsPage = () => {
  const role = useAppStore((state) => state.role);

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Platform" title="Settings" description="Placeholder platform settings with role-aware visibility hints for super admins, site admins, and read-only operators." />
      <div className="grid gap-6 xl:grid-cols-3">
        <SettingCard icon={UserCog} title="Role-Aware Access" body={`Current mock role is ${role.replace('_', ' ')}. Use this as the seam for future permission gating and per-site scope rules.`} />
        <SettingCard icon={ShieldCheck} title="Security Controls" body="Reserve this space for SSO, MFA policy, admin audit exports, and API token issuance." />
        <SettingCard icon={Workflow} title="Automation Hooks" body="Future webhooks, outbound notifications, and remediation policies can attach here." />
      </div>
      <Panel title="Integration Notes">
        <div className="space-y-3 text-sm text-muted">
          <p>Mock data is isolated in a service layer so the UI can later swap to real REST or websocket endpoints with minimal component churn.</p>
          <p>Theme, selected site, role state, and command palette open state live in a lightweight Zustand store.</p>
        </div>
      </Panel>
    </div>
  );
};

const SettingCard = ({ icon: Icon, title, body }: { icon: typeof UserCog; title: string; body: string }) => (
  <div className="panel p-5">
    <div className="rounded-2xl bg-accent-muted p-3 text-accent"><Icon className="h-5 w-5" /></div>
    <h3 className="mt-4 text-lg font-semibold text-text">{title}</h3>
    <p className="mt-2 text-sm text-muted">{body}</p>
  </div>
);
