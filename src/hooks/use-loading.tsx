/**
 * useLoading Hook
 * 
 * Simple hook to manage loading states with optional minimum duration
 * to prevent loading flashes.
 */

import { useState, useCallback } from "react";

export function useLoading(minDuration = 500) {
  const [isLoading, setIsLoading] = useState(false);

  const startLoading = useCallback(() => {
    setIsLoading(true);
  }, []);

  const stopLoading = useCallback(() => {
    // Keep loading for minimum duration for smooth UX
    setTimeout(() => {
      setIsLoading(false);
    }, minDuration);
  }, [minDuration]);

  const withLoading = useCallback(
    async <T,>(fn: () => Promise<T>): Promise<T> => {
      const startTime = Date.now();
      setIsLoading(true);
      
      try {
        const result = await fn();
        const elapsed = Date.now() - startTime;
        const remaining = Math.max(0, minDuration - elapsed);
        
        // Ensure minimum loading duration
        await new Promise(resolve => setTimeout(resolve, remaining));
        
        return result;
      } finally {
        setIsLoading(false);
      }
    },
    [minDuration]
  );

  return {
    isLoading,
    startLoading,
    stopLoading,
    withLoading,
  };
}
