import { useEffect } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { AlertsPage } from '@/features/alerts/AlertsPage';
import { ApDetailPage } from '@/features/aps/ApDetailPage';
import { ApsPage } from '@/features/aps/ApsPage';
import { ClientsPage } from '@/features/clients/ClientsPage';
import { DashboardPage } from '@/features/dashboard/DashboardPage';
import { FirmwarePage } from '@/features/firmware/FirmwarePage';
import { ProfilesPage } from '@/features/profiles/ProfilesPage';
import { SettingsPage } from '@/features/settings/SettingsPage';
import { SiteDetailPage } from '@/features/sites/SiteDetailPage';
import { SitesPage } from '@/features/sites/SitesPage';
import { SwitchDetailPage } from '@/features/switches/SwitchDetailPage';
import { SwitchesPage } from '@/features/switches/SwitchesPage';
import { useAppStore } from '@/store/useAppStore';

export const App = () => {
  const theme = useAppStore((state) => state.theme);
  const bumpLiveTick = useAppStore((state) => state.bumpLiveTick);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  useEffect(() => {
    const timer = window.setInterval(() => bumpLiveTick(), 12000);
    return () => window.clearInterval(timer);
  }, [bumpLiveTick]);

  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/sites" element={<SitesPage />} />
        <Route path="/sites/:id" element={<SiteDetailPage />} />
        <Route path="/switches" element={<SwitchesPage />} />
        <Route path="/switches/:id" element={<SwitchDetailPage />} />
        <Route path="/aps" element={<ApsPage />} />
        <Route path="/aps/:id" element={<ApDetailPage />} />
        <Route path="/clients" element={<ClientsPage />} />
        <Route path="/alerts" element={<AlertsPage />} />
        <Route path="/profiles" element={<ProfilesPage />} />
        <Route path="/firmware" element={<FirmwarePage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Routes>
    </AppShell>
  );
};
