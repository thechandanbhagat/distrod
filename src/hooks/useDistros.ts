// @group BusinessLogic : Hook for distro data management
import { useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useDistroStore } from "../store/distroStore";
import type { Distro } from "../types";

// @group BusinessLogic : useDistros hook
export function useDistros() {
  const { distros, selectedDistro, loading, error, setDistros, setLoading, setError, selectDistro, updateDistroStatus } =
    useDistroStore();

  const fetchDistros = useCallback(async () => {
    setLoading(true);
    try {
      const result = await invoke<Distro[]>("list_distros");
      setDistros(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, [setDistros, setLoading, setError]);

  // Note: the distro list is polled app-wide by useDistroSync (mounted at the App root),
  // so this hook no longer polls. fetchDistros remains for manual refresh + post-action reloads.

  const startDistro = useCallback(
    async (name: string) => {
      updateDistroStatus(name, "running");
      try {
        await invoke("start_distro", { name });
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
        updateDistroStatus(name, "stopped");
      }
    },
    [updateDistroStatus, setError]
  );

  const stopDistro = useCallback(
    async (name: string) => {
      updateDistroStatus(name, "stopped");
      try {
        await invoke("stop_distro", { name });
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
        updateDistroStatus(name, "running");
      }
    },
    [updateDistroStatus, setError]
  );

  const setDefault = useCallback(
    async (name: string) => {
      try {
        await invoke("set_default_distro", { name });
        await fetchDistros();
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      }
    },
    [fetchDistros, setError]
  );

  const exportDistro = useCallback(
    async (name: string, path: string) => {
      try {
        await invoke("export_distro", { name, path });
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      }
    },
    [setError]
  );

  const importDistro = useCallback(
    async (name: string, path: string) => {
      try {
        await invoke("import_distro", { name, path });
        await fetchDistros();
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      }
    },
    [fetchDistros, setError]
  );

  return {
    distros,
    selectedDistro,
    loading,
    error,
    selectDistro,
    startDistro,
    stopDistro,
    setDefault,
    exportDistro,
    importDistro,
    refresh: fetchDistros,
  };
}
