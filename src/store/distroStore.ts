// @group DatabaseOperations : Zustand store for WSL distro state
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Distro } from "../types";

// @group Types : Distro store shape
interface DistroState {
  distros: Distro[];
  selectedDistro: string | null;
  loading: boolean;
  error: string | null;

  // @group BusinessLogic : Actions
  setDistros: (distros: Distro[]) => void;
  selectDistro: (name: string | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  updateDistroStatus: (name: string, status: Distro["status"]) => void;
}

// @group Exports : Distro store instance — selectedDistro persisted; distros list always fetched fresh
export const useDistroStore = create<DistroState>()(
  persist(
    (set) => ({
      distros: [],
      selectedDistro: null,
      loading: false,
      error: null,
      setDistros: (distros) => set({ distros }),
      selectDistro: (name) => set({ selectedDistro: name }),
      setLoading: (loading) => set({ loading }),
      setError: (error) => set({ error }),
      updateDistroStatus: (name, status) =>
        set((state) => ({
          distros: state.distros.map((d) =>
            d.name === name ? { ...d, status } : d
          ),
        })),
    }),
    {
      name: "distrod-distro",
      partialize: (state) => ({ selectedDistro: state.selectedDistro }),
    }
  )
);
