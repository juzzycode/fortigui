import type { PropsWithChildren } from 'react';
import { Bell, ChevronDown, Command, MoonStar, Search, SunMedium, UserCircle2 } from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';
import { sites } from '@/mocks/data';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/store/useAppStore';

const navItems = [
  ['Dashboard', '/dashboard'],
  ['Sites', '/sites'],
  ['Switches', '/switches'],
  ['Access Points', '/aps'],
  ['Clients', '/clients'],
  ['Alerts', '/alerts'],
  ['Profiles', '/profiles'],
  ['Firmware', '/firmware'],
  ['Settings', '/settings'],
];

export const AppShell = ({ children }: PropsWithChildren) => {
  const location = useLocation();
  const { role, theme, selectedSiteId, setRole, setSelectedSiteId, toggleTheme, commandPaletteOpen, setCommandPaletteOpen } = useAppStore();

  return (
    <div className="min-h-screen">
      <div className="mx-auto flex min-h-screen max-w-[1800px] gap-6 p-4 lg:p-6">
        <aside className="panel hidden w-72 shrink-0 flex-col p-4 lg:flex">
          <div className="rounded-[28px] bg-gradient-to-br from-accent/15 via-accent-muted to-sky-400/10 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-accent">EdgeOps Cloud</p>
            <h1 className="mt-3 text-2xl font-semibold text-text">Network operations, simplified.</h1>
            <p className="mt-2 text-sm text-muted">Original monitoring UI built for distributed switching and wireless visibility.</p>
          </div>
          <nav className="mt-6 space-y-1">
            {navItems.map(([label, to]) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) => cn('flex items-center justify-between rounded-2xl px-4 py-3 text-sm font-medium transition', isActive ? 'bg-accent text-white' : 'text-muted hover:bg-soft hover:text-text')}
              >
                <span>{label}</span>
                {location.pathname.startsWith(to) ? <ChevronDown className="h-4 w-4" /> : null}
              </NavLink>
            ))}
          </nav>
          <div className="mt-auto rounded-3xl border border-border bg-soft p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">Live update simulation</p>
            <p className="mt-2 text-sm text-text">Telemetry refreshes every 12 seconds so widgets feel closer to real operations tooling.</p>
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <div className="mb-4 flex gap-2 overflow-x-auto lg:hidden">
            {navItems.map(([label, to]) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  cn(
                    'whitespace-nowrap rounded-2xl border px-4 py-2 text-sm font-medium transition',
                    isActive ? 'border-accent bg-accent text-white' : 'border-border bg-surface text-muted',
                  )
                }
              >
                {label}
              </NavLink>
            ))}
          </div>

          <header className="panel mb-6 p-4">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div className="flex flex-1 flex-wrap items-center gap-3">
                <div className="flex min-w-[260px] flex-1 items-center gap-3 rounded-2xl border border-border bg-soft px-4 py-3">
                  <Search className="h-4 w-4 text-muted" />
                  <input className="w-full border-0 bg-transparent text-sm text-text placeholder:text-muted focus:outline-none" placeholder="Search sites, devices, clients, profiles..." />
                  <button className="rounded-xl border border-border px-2 py-1 text-xs text-muted" onClick={() => setCommandPaletteOpen(!commandPaletteOpen)}>
                    <span className="inline-flex items-center gap-1">
                      <Command className="h-3 w-3" />
                      K
                    </span>
                  </button>
                </div>

                <select value={selectedSiteId} onChange={(event) => setSelectedSiteId(event.target.value as string | 'all')} className="focus-ring rounded-2xl border border-border bg-soft px-4 py-3 text-sm text-text">
                  <option value="all">All sites</option>
                  {sites.map((site) => (
                    <option key={site.id} value={site.id}>
                      {site.name}
                    </option>
                  ))}
                </select>

                <select value={role} onChange={(event) => setRole(event.target.value as typeof role)} className="focus-ring rounded-2xl border border-border bg-soft px-4 py-3 text-sm capitalize text-text">
                  <option value="super_admin">Super Admin</option>
                  <option value="site_admin">Site Admin</option>
                  <option value="read_only">Read Only</option>
                </select>
              </div>

              <div className="flex items-center gap-3">
                <button className="focus-ring rounded-2xl border border-border bg-soft p-3 text-muted hover:text-text" onClick={toggleTheme}>
                  {theme === 'dark' ? <SunMedium className="h-4 w-4" /> : <MoonStar className="h-4 w-4" />}
                </button>
                <button className="focus-ring rounded-2xl border border-border bg-soft p-3 text-muted hover:text-text">
                  <Bell className="h-4 w-4" />
                </button>
                <div className="flex items-center gap-3 rounded-2xl border border-border bg-soft px-4 py-3">
                  <UserCircle2 className="h-5 w-5 text-accent" />
                  <div>
                    <p className="text-sm font-medium text-text">Network Admin</p>
                    <p className="text-xs capitalize text-muted">{role.replace('_', ' ')}</p>
                  </div>
                </div>
              </div>
            </div>
          </header>

          <main>{children}</main>
        </div>
      </div>
    </div>
  );
};
