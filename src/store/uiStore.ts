// @group DatabaseOperations : Zustand store for global UI state
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Page } from "../types";

// @group Types : UI store shape
interface UiState {
  currentPage: Page;
  sidebarCollapsed: boolean;

  // @group BusinessLogic : Actions
  navigate: (page: Page) => void;
  toggleSidebar: () => void;
}

// @group Exports : UI store instance — persisted so page/sidebar survive reload
export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      currentPage: "distros",
      sidebarCollapsed: false,
      navigate: (currentPage) => set({ currentPage }),
      toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
    }),
    { name: "distrod-ui" }
  )
);
