// @group Utilities : Hook for type-safe Tauri command invocation
import { useState, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";

// @group Types : Hook return type
interface InvokeState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  execute: (...args: unknown[]) => Promise<T | null>;
}

// @group BusinessLogic : useTauriInvoke hook
export function useTauriInvoke<T>(command: string): InvokeState<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(
    async (...args: unknown[]): Promise<T | null> => {
      setLoading(true);
      setError(null);
      try {
        const payload = args.length === 1 && typeof args[0] === "object" && args[0] !== null
          ? (args[0] as Record<string, unknown>)
          : {};
        const result = await invoke<T>(command, payload);
        setData(result);
        return result;
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        setError(message);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [command]
  );

  return { data, loading, error, execute };
}
