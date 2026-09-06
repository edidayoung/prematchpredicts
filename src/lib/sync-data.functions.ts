import { createServerFn } from "@tanstack/react-start";

/**
 * Manually trigger a data sync from BallDontLie API
 * This fetches teams and recent game stats
 */
export const syncData = createServerFn({ method: "POST" }).handler(async () => {
  const ballApiKey = process.env["BALLDONTLIE_API_KEY"];
  
  if (!ballApiKey) {
    return {
      success: false,
      error: "BallDontLie API key not configured",
    };
  }

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { fullSync } = await import("./stats-sync.server");

  try {
    console.log("Starting NBA data sync...");
    const result = await fullSync(supabaseAdmin, ballApiKey);
    
    return {
      success: true,
      message: "NBA data synced successfully!",
    };
  } catch (error: any) {
    console.error("NBA Sync error:", error);
    return {
      success: false,
      error: error.message || "Unknown error during NBA sync",
    };
  }
});

/**
 * Get sync status and stats overview
 */
export const getSyncStatus = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  try {
    const { data: teams, count: teamCount } = await supabaseAdmin
      .from("nba_teams")
      .select("*", { count: "exact", head: false })
      .limit(5);

    const { data: stats, count: statsCount } = await supabaseAdmin
      .from("team_stats")
      .select("*", { count: "exact", head: false })
      .limit(1);

    const { data: games, count: gamesCount } = await supabaseAdmin
      .from("games")
      .select("*", { count: "exact", head: false })
      .limit(1);

    const lastStats = stats && stats.length > 0 ? stats[0] : null;

    return {
      success: true,
      teamsCount: teamCount || 0,
      statsCount: statsCount || 0,
      gamesCount: gamesCount || 0,
      lastUpdate: lastStats?.updated_at || null,
      sampleTeams: teams?.slice(0, 5).map((t: any) => t.team_name) || [],
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
});
