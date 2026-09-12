/**
 * LocationTimeBadge Component
 * 
 * Displays current time in WAT (West Africa Time)
 * Updates time automatically every second
 */

import { Clock } from "lucide-react";
import { useState, useEffect } from "react";

export function LocationTimeBadge() {
  const [dateTime, setDateTime] = useState<string>("");

  // Update time every second
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      
      // Format time in WAT timezone
      const formatted = now.toLocaleString('en-US', {
        timeZone: 'Africa/Lagos',
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      });
      
      setDateTime(formatted);
    };

    updateTime(); // Initial call
    const interval = setInterval(updateTime, 1000); // Update every second

    return () => clearInterval(interval);
  }, []);

  if (!dateTime) {
    return (
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Clock className="h-3 w-3 animate-pulse text-[#10B981]" />
        <span>Loading...</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
      <Clock className="h-3 w-3 text-[#10B981]" />
      <span>{dateTime} WAT</span>
    </div>
  );
}
