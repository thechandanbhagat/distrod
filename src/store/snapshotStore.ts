// @group DatabaseOperations : Zustand store for snapshot manager state
import { create } from "zustand";
import type { Snapshot } from "../types";

// @group Types : Snapshot store shape
interface SnapshotState {
  snapshots: Snapshot[];
  loading: boolean;
  error: string | null;

  // @group BusinessLogic : Actions
  setSnapshots: (snapshots: Snapshot[]) => void;
  addSnapshot: (snapshot: Snapshot) => void;
  removeSnapshot: (id: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

// @group Exports : Snapshot store instance
export const useSnapshotStore = create<SnapshotState>((set) => ({
  snapshots: [],
  loading: false,
  error: null,

  setSnapshots: (snapshots) => set({ snapshots }),

  addSnapshot: (snapshot) =>
    set((state) => ({ snapshots: [snapshot, ...state.snapshots] })),

  removeSnapshot: (id) =>
    set((state) => ({
      snapshots: state.snapshots.filter((s) => s.id !== id),
    })),

  setLoading: (loading) => set({ loading }),

  setError: (error) => set({ error }),
}));
