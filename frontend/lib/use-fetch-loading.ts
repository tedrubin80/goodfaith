"use client";

import { useCallback, useState } from "react";

/**
 * Derives a loading flag for data fetches without calling setState synchronously
 * inside useEffect (react-hooks/set-state-in-effect).
 */
export function useFetchLoading(enabled: boolean, fetchKey: string) {
  const [completedKey, setCompletedKey] = useState<string | null>(null);
  const loading = enabled && completedKey !== fetchKey;
  const markComplete = useCallback(() => {
    setCompletedKey(fetchKey);
  }, [fetchKey]);
  return { loading, markComplete };
}