import { Bug, CheckCircle2, GitCommitHorizontal, Radar, Rocket, ShieldCheck, Sparkles, Wrench } from 'lucide-react';
import { BrandMark } from '@/components/common/BrandMark';
import { PageHeader } from '@/components/common/PageHeader';
import { Panel } from '@/components/common/Panel';
import { StatusBadge } from '@/components/common/StatusBadge';
import { EDGEOPS_VERSION } from '@/version';

type RevisionTone = 'feature' | 'fix' | 'ops';

interface RevisionEntry {
  title: string;
  description: string;
  tag: string;
  tone: RevisionTone;
}

const revisionEntries: RevisionEntry[] = [
  {
    title: 'Site ping response history',
    description:
      'The dashboard now tracks 24 hours of site ping replies with 30-minute rollup averages, making down sites and latency drift easier to spot at a glance.',
    tag: 'Feature',
    tone: 'feature',
  },
  {
    title: 'FortiWiFi integrated AP support',
    description:
      'FortiWiFi units now count their built-in radio as the managed AP and collapse duplicate WIFI0 controller rows so topology reflects the real device count.',
    tag: 'Feature',
    tone: 'feature',
  },
  {
    title: 'Warning reason hover text',
    description:
      'Client warning badges now expose the reason on hover so operators can tell whether a client is stale, detached, or missing expected attachment data.',
    tag: 'Feature',
    tone: 'feature',
  },
  {
    title: 'Production and dev process scripts',
    description:
      'Start and stop scripts now support daemonized production mode, a short -d flag, dev mode binding, runtime PID tracking, and reverse-proxy setup notes.',
    tag: 'Ops',
    tone: 'ops',
  },
  {
    title: 'EdgeOps identity pass',
    description:
      'Added the new EO favicon, reused it in the shell and version footer, and bumped the app version to 0.9.1.',
    tag: 'Feature',
    tone: 'feature',
  },
  {
    title: 'FortiOS 7.6.6 config backup fallback',
    description:
      'Config archive pulls now retry through the newer method when older backup endpoints return HTTP 405, improving compatibility with newer FortiGate firmware.',
    tag: 'Fix',
    tone: 'fix',
  },
  {
    title: 'FortiGate request resilience',
    description:
      'FortiGate polling now has longer configurable timeouts and targeted retry handling for rate limits so temporary 429s do not immediately poison a sync.',
    tag: 'Fix',
    tone: 'fix',
  },
  {
    title: 'LastPass overlay cleanup',
    description:
      'Login and authenticated startup now remove LastPass-injected overlays that could grey out the app after declining a password update.',
    tag: 'Fix',
    tone: 'fix',
  },
  {
    title: 'Session check no longer shouts',
    description:
      'The session endpoint now returns an empty session instead of noisy unauthorized errors during normal unauthenticated startup.',
    tag: 'Fix',
    tone: 'fix',
  },
  {
    title: 'Site creation column mismatch',
    description:
      'Fixed the SQLite insert path that could fail with a 16-values-for-17-columns error when adding new sites.',
    tag: 'Fix',
    tone: 'fix',
  },
];

const releaseHighlights = [
  'Better visibility when a site is actually down, not just missing inventory data.',
  'Cleaner FortiWiFi topology for small sites with integrated wireless.',
  'Less browser-extension weirdness after login. Tiny gremlin cage, very useful.',
  'More forgiving FortiGate API polling across rate limits, slow links, and firmware differences.',
];

const revisionStats = [
  { label: 'Current Version', value: EDGEOPS_VERSION, icon: Sparkles },
  { label: 'Tracked Updates', value: String(revisionEntries.length), icon: GitCommitHorizontal },
  { label: 'Feature Items', value: String(revisionEntries.filter((entry) => entry.tone === 'feature').length), icon: Rocket },
  { label: 'Fix Items', value: String(revisionEntries.filter((entry) => entry.tone === 'fix').length), icon: Bug },
];

const toneIcon = {
  feature: Rocket,
  fix: Wrench,
  ops: ShieldCheck,
} satisfies Record<RevisionTone, typeof Rocket>;

const toneClass = {
  feature: 'bg-accent-muted text-accent',
  fix: 'bg-amber-500/15 text-amber-600 dark:text-amber-300',
  ops: 'bg-sky-500/15 text-sky-600 dark:text-sky-300',
} satisfies Record<RevisionTone, string>;

export const RevisionsPage = () => (
  <div>
    <PageHeader
      eyebrow="Release Notes"
      title="Revision History"
      description="A compact operator-facing ledger of the newest EdgeOps features, fixes, and field discoveries from the recent commit run."
    />

    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {revisionStats.map(({ label, value, icon: Icon }) => (
        <Panel key={label} className="overflow-hidden">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted">{label}</p>
              <p className="mt-3 text-3xl font-semibold text-text">{value}</p>
            </div>
            <div className="rounded-3xl bg-accent-muted p-3 text-accent">
              <Icon className="h-5 w-5" />
            </div>
          </div>
        </Panel>
      ))}
    </div>

    <div className="mt-6 grid gap-6 xl:grid-cols-[1.4fr_0.8fr]">
      <Panel
        title="Recent Changes"
        subtitle="Grouped from the latest bug-fix and feature commits so operators can see what changed without reading git history."
      >
        <div className="space-y-3">
          {revisionEntries.map((entry) => {
            const Icon = toneIcon[entry.tone];

            return (
              <article key={entry.title} className="rounded-3xl border border-border bg-soft p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex gap-3">
                    <div className={`mt-0.5 rounded-2xl p-2 ${toneClass[entry.tone]}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-text">{entry.title}</h3>
                      <p className="mt-1 text-sm leading-6 text-muted">{entry.description}</p>
                    </div>
                  </div>
                  <StatusBadge value={entry.tag} title={`${entry.tag} revision item`} />
                </div>
              </article>
            );
          })}
        </div>
      </Panel>

      <div className="space-y-6">
        <Panel className="overflow-hidden">
          <div className="rounded-[28px] bg-gradient-to-br from-accent/15 via-accent-muted to-sky-400/10 p-5">
            <div className="flex items-center gap-3">
              <BrandMark size="lg" />
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-accent">EdgeOps Cloud</p>
                <h2 className="mt-2 text-2xl font-semibold text-text">Version {EDGEOPS_VERSION}</h2>
              </div>
            </div>
            <p className="mt-4 text-sm leading-6 text-muted">
              This release is mostly about making the app behave better in the messy real world: extension overlays, FortiGate API quirks,
              FortiWiFi identity wrinkles, and site reachability that needs to be visible immediately.
            </p>
          </div>
        </Panel>

        <Panel title="Release Highlights" subtitle="What this batch should feel like day to day.">
          <div className="space-y-3">
            {releaseHighlights.map((highlight) => (
              <div key={highlight} className="flex gap-3 rounded-2xl border border-border bg-soft p-3">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                <p className="text-sm leading-6 text-muted">{highlight}</p>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Next Watch Areas" subtitle="Good places to keep an eye on after this revision.">
          <div className="space-y-3">
            <div className="flex gap-3 rounded-2xl border border-border bg-soft p-3">
              <Radar className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
              <p className="text-sm leading-6 text-muted">
                Verify config backup behavior across more FortiOS builds, especially when devices expose backup endpoints differently.
              </p>
            </div>
            <div className="flex gap-3 rounded-2xl border border-border bg-soft p-3">
              <Radar className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
              <p className="text-sm leading-6 text-muted">
                Keep watching FortiWiFi AP normalization so external FortiAPs and integrated radios stay distinct without duplicate rows.
              </p>
            </div>
          </div>
        </Panel>
      </div>
    </div>
  </div>
);
