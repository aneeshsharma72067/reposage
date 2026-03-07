import { create } from 'zustand';

interface UIState {
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;

  selectedRepositoryId: string | null;
  setSelectedRepositoryId: (id: string | null) => void;

  activeDashboardTab: string;
  setActiveDashboardTab: (tab: string) => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),

  selectedRepositoryId: null,
  setSelectedRepositoryId: (id) => set({ selectedRepositoryId: id }),

  activeDashboardTab: 'overview',
  setActiveDashboardTab: (tab) => set({ activeDashboardTab: tab }),
}));
