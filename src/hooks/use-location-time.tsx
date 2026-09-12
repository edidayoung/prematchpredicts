/**
 * useLocationTime Hook
 * 
 * Gets user's location (city, state) and current time
 * Updates time every minute for live display
 */

import { useState, useEffect } from "react";

interface LocationTimeData {
  location: string;
  dateTime: string;
  isLoading: boolean;
}

export function useLocationTime(): LocationTimeData {
  const [location, setLocation] = useState<string>("Loading...");
  const [dateTime, setDateTime] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);

  // Get user's location using IP geolocation
  useEffect(() => {
    const fetchLocation = async () => {
      try {
        // Using ipapi.co free API (no key required)
        const response = await fetch('https://ipapi.co/json/');
        const data = await response.json();
        
        // Format: "City, State" or "City, Country" if not in US
        const locationStr = data.region 
          ? `${data.city}, ${data.region}`
          : `${data.city}, ${data.country_name}`;
        
        setLocation(locationStr);
        setIsLoading(false);
      } catch (error) {
        // Fallback if API fails
        setLocation("Unknown Location");
        setIsLoading(false);
      }
    };

    fetchLocation();
  }, []);

  // Update time every second for live tracking
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const formatted = now.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
      setDateTime(formatted);
    };

    updateTime(); // Initial call
    const interval = setInterval(updateTime, 1000); // Update every second for live feel

    return () => clearInterval(interval);
  }, []);

  return {
    location,
    dateTime,
    isLoading,
  };
}
