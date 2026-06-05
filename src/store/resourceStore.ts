// @group DatabaseOperations : Zustand store for resource monitoring state
import { create } from "zustand";
import type { ResourceHistory, ResourceThresholds } from "../types";

const MAX_SNAPSHOTS = 60; // 2 min of history at 2s interval

// @group Types : Resource store shape
interface ResourceState {
  history: Record<string, ResourceHistory>;
  thresholds: ResourceThresholds;

  // @group BusinessLogic : Actions
  pushSnapshot: (distroName: string, snapshot: ResourceHistory["snapshots"][0]) => void;
  setThresholds: (thresholds: ResourceThresholds) => void;
  clearHistory: (distroName: string) => void;
}

// @group Exports : Resource store instance
export const useResourceStore = create<ResourceState>((set) => ({
  history: {},
  thresholds: { cpuPercent: 80, memoryPercent: 80 },

  pushSnapshot: (distroName, snapshot) =>
    set((state) => {
      const existing = state.history[distroName]?.snapshots ?? [];
      const snapshots = [...existing, snapshot].slice(-MAX_SNAPSHOTS);
      return {
        history: {
          ...state.history,
          [distroName]: { distroName, snapshots },
        },
      };
    }),

  setThresholds: (thresholds) => set({ thresholds }),

  clearHistory: (distroName) =>
    set((state) => {
      const { [distroName]: _, ...rest } = state.history;
      return { history: rest };
    }),
}));
