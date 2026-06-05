// @group BusinessLogic : App-wide distro list synchronisation
import { useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useDistroStore } from "../store/distroStore";
import { usePolling } from "./usePolling";
import type { Distro } from "../types";

// @group BusinessLogic : useDistroSync — polls list_distros into the global store.
// Mounted once at the app root so every page (Terminal, Files, Network, …) has the
// distro list available, not just the Distros page. Subscribes only to stable
// setters via selectors, so it never triggers re-renders of its host component.
export function useDistroSync(intervalMs = 5000): void {
  const setDistros = useDistroStore((s) => s.setDistros);
  const setLoading = useDistroStore((s) => s.setLoading);
  const setError = useDistroStore((s) => s.setError);

  const fetchDistros = useCallback(async () => {
    setLoading(true);
    try {
      setDistros(await invoke<Distro[]>("list_distros"));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, [setDistros, setLoading, setError]);

  usePolling(fetchDistros, intervalMs);
}
