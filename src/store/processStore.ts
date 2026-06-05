// @group DatabaseOperations : Zustand store for process manager state
import { create } from "zustand";
import type { LinuxProcess } from "../types";

// @group Types : Process store shape
interface ProcessState {
  processes: LinuxProcess[];
  filterText: string;
  sortKey: keyof LinuxProcess;
  sortAsc: boolean;
  loading: boolean;

  // @group BusinessLogic : Actions
  setProcesses: (processes: LinuxProcess[]) => void;
  clearProcesses: () => void;
  setFilter: (text: string) => void;
  setSort: (key: keyof LinuxProcess) => void;
  setLoading: (loading: boolean) => void;
}

// @group Exports : Process store instance
export const useProcessStore = create<ProcessState>((set) => ({
  processes: [],
  filterText: "",
  sortKey: "cpuPercent",
  sortAsc: false,
  loading: false,

  setProcesses: (processes) => set({ processes }),
  clearProcesses: () => set({ processes: [], loading: true }),

  setFilter: (filterText) => set({ filterText }),

  setSort: (key) =>
    set((state) => ({
      sortKey: key,
      sortAsc: state.sortKey === key ? !state.sortAsc : false,
    })),

  setLoading: (loading) => set({ loading }),
}));
