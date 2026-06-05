// @group BusinessLogic : Hook for resource monitoring with 2s polling
import { useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useResourceStore } from "../store/resourceStore";
import { usePolling } from "./usePolling";
import type { ResourceSnapshot } from "../types";

// @group BusinessLogic : useResources hook
export function useResources(distroName: string | null) {
  const { history, thresholds, pushSnapshot, setThresholds } = useResourceStore();

  const fetchSnapshot = useCallback(async () => {
    if (!distroName) return;
    try {
      const snapshot = await invoke<ResourceSnapshot>("get_resource_snapshot", {
        distroName,
      });
      pushSnapshot(distroName, snapshot);
    } catch {
      // Silently skip failed polls — distro may be stopped
    }
  }, [distroName, pushSnapshot]);

  usePolling(fetchSnapshot, 2000, !!distroName);

  const currentHistory = distroName ? history[distroName] : undefined;
  const latest = currentHistory?.snapshots.at(-1) ?? null;

  const cpuAlert = latest !== null && latest !== undefined
    ? latest.cpuPercent >= thresholds.cpuPercent
    : false;

  const memPercent = latest ? (latest.memoryRss / (latest.memoryVsz || 1)) * 100 : 0;
  const memAlert = memPercent >= thresholds.memoryPercent;

  return {
    history: currentHistory?.snapshots ?? [],
    latest,
    thresholds,
    cpuAlert,
    memAlert,
    setThresholds,
  };
}
