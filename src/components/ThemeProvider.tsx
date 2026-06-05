// @group Configuration : Applies the active theme's CSS custom properties to :root
import { useLayoutEffect } from "react";
import { useThemeStore } from "../store/themeStore";
import { THEMES, DEFAULT_THEME_ID } from "../themes/themes";

// @group BusinessLogic : ThemeProvider component
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { themeId } = useThemeStore();

  useLayoutEffect(() => {
    const theme = THEMES.find((t) => t.id === themeId) ?? THEMES.find((t) => t.id === DEFAULT_THEME_ID)!;
    const root = document.documentElement;
    for (const [key, value] of Object.entries(theme.tokens)) {
      root.style.setProperty(key, value);
    }
  }, [themeId]);

  return <>{children}</>;
}
