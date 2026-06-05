// @group Configuration : Zustand store for persisted theme selection
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { DEFAULT_THEME_ID } from "../themes/themes";

// @group Types : Theme store shape
interface ThemeState {
  themeId: string;
  setTheme: (id: string) => void;
}

// @group Exports : Theme store instance — persisted to localStorage
export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      themeId: DEFAULT_THEME_ID,
      setTheme: (themeId) => set({ themeId }),
    }),
    { name: "distrod-theme" }
  )
);
