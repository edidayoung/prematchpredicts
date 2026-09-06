import { useEffect, useState } from "react";
import { useRouter } from "@tanstack/react-router";

/**
 * Auto-refresh hook - reloads route data every X minutes
 * NO API calls - just refreshes from database
 */
export function useAutoRefresh(intervalMinutes: number = 5) {
  const router = useRouter();
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  useEffect(() => {
    // Only run in browser
    if (typeof window === "undefined") return;

    const intervalMs = intervalMinutes * 60 * 1000;

    const interval = setInterval(() => {
      console.log(`[AUTO-REFRESH] Refreshing data (no API call)`);
      router.invalidate();
      setLastRefresh(new Date());
    }, intervalMs);

    return () => clearInterval(interval);
  }, [router, intervalMinutes]);

  return lastRefresh;
}
