// Session tracking for active users
import { supabase } from "@/integrations/supabase/client";

export function getSessionId(): string {
  let sessionId = localStorage.getItem("session_id");
  
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem("session_id", sessionId);
    localStorage.setItem("session_start", new Date().toISOString());
  }
  
  return sessionId;
}

export async function updateHeartbeat() {
  const sessionId = getSessionId();
  const sessionStart = localStorage.getItem("session_start") || new Date().toISOString();
  
  try {
    const { error } = await supabase
      .from("active_sessions")
      .upsert({
        session_id: sessionId,
        last_seen: new Date().toISOString(),
        logged_in_at: sessionStart,
      }, {
        onConflict: "session_id"
      });
    
    if (error) throw error;
  } catch (error) {
    console.error("Heartbeat failed:", error);
  }
}

export async function getActiveSessions() {
  const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000).toISOString();
  
  try {
    const { data, error } = await supabase
      .from("active_sessions")
      .select("*")
      .gte("last_seen", twoMinutesAgo)
      .order("last_seen", { ascending: false });
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Failed to fetch active sessions:", error);
    return [];
  }
}

export async function cleanupSession() {
  const sessionId = getSessionId();
  
  try {
    const { error } = await supabase
      .from("active_sessions")
      .delete()
      .eq("session_id", sessionId);
    
    if (error) throw error;
  } catch (error) {
    console.error("Session cleanup failed:", error);
  }
}
