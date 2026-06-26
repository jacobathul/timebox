import { create } from 'zustand';

interface UiState {
  isCommandPaletteOpen: boolean;
  isProjectModalOpen: boolean;
  isContextModalOpen: boolean;
  manualTimeEntryTaskId: string | null;

  openCommandPalette: () => void;
  closeCommandPalette: () => void;
  openProjectModal: () => void;
  closeProjectModal: () => void;
  openContextModal: () => void;
  closeContextModal: () => void;
  openManualTimeEntry: (taskId: string) => void;
  closeManualTimeEntry: () => void;
  closeActiveModal: () => void;
}

export const useUiStore = create<UiState>()((set) => ({
  isCommandPaletteOpen: false,
  isProjectModalOpen: false,
  isContextModalOpen: false,
  manualTimeEntryTaskId: null,

  openCommandPalette: () => set({ isCommandPaletteOpen: true }),
  closeCommandPalette: () => set({ isCommandPaletteOpen: false }),
  openProjectModal: () => set({ isProjectModalOpen: true }),
  closeProjectModal: () => set({ isProjectModalOpen: false }),
  openContextModal: () => set({ isContextModalOpen: true }),
  closeContextModal: () => set({ isContextModalOpen: false }),
  openManualTimeEntry: (taskId) => set({ manualTimeEntryTaskId: taskId }),
  closeManualTimeEntry: () => set({ manualTimeEntryTaskId: null }),
  closeActiveModal: () => set({
    isCommandPaletteOpen: false,
    isProjectModalOpen: false,
    isContextModalOpen: false,
    manualTimeEntryTaskId: null,
  }),
}));
