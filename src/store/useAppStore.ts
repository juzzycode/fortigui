import { create } from 'zustand';
import type { Role } from '@/types/models';

interface AppState {
  theme: 'light' | 'dark';
  role: Role;
  selectedSiteId: string | 'all';
  commandPaletteOpen: boolean;
  liveTick: number;
  setTheme: (theme: 'light' | 'dark') => void;
  toggleTheme: () => void;
  setRole: (role: Role) => void;
  setSelectedSiteId: (siteId: string | 'all') => void;
  setCommandPaletteOpen: (open: boolean) => void;
  bumpLiveTick: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  theme: 'dark',
  role: 'super_admin',
  selectedSiteId: 'all',
  commandPaletteOpen: false,
  liveTick: 0,
  setTheme: (theme) => set({ theme }),
  toggleTheme: () => set((state) => ({ theme: state.theme === 'dark' ? 'light' : 'dark' })),
  setRole: (role) => set({ role }),
  setSelectedSiteId: (selectedSiteId) => set({ selectedSiteId }),
  setCommandPaletteOpen: (commandPaletteOpen) => set({ commandPaletteOpen }),
  bumpLiveTick: () => set((state) => ({ liveTick: state.liveTick + 1 })),
}));
