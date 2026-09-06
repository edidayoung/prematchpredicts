// Sync NBA team data and stats to Supabase
import {
  fetchAllTeams,
  fetchGames,
  calculateTeamStats,
  getCurrentSeason,
} from "./balldontlie.server";

type SupabaseClient = any; // We'll use the actual type from supabase

/**
 * Sync all NBA teams to database
 */
export async function syncTeams(supabase: SupabaseClient, apiKey: string) {
  console.log("Fetching NBA teams from BallDontLie...");
  const teams = await fetchAllTeams(apiKey);

  console.log(`Syncing ${teams.length} teams to database...`);
  for (const team of teams) {
    const { error } = await supabase.from("nba_teams").upsert(
      {
        team_id: team.id,
        team_name: team.name,
        abbreviation: team.abbreviation,
        conference: team.conference,
        division: team.division,
        city: team.city,
        full_name: team.full_name,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "team_id" }
    );

    if (error) {
      console.error(`Error syncing team ${team.full_name}:`, error);
    }
  }

  console.log("✅ Teams synced successfully");
  return teams;
}

/**
 * Sync recent game results and update team stats
 */
export async function syncGamesAndStats(
  supabase: SupabaseClient,
  apiKey: string,
  daysBack: number = 30
) {
  const season = getCurrentSeason();
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - daysBack);

  const startDateStr = startDate.toISOString().split("T")[0];
  const endDateStr = endDate.toISOString().split("T")[0];

  console.log(
    `Fetching games from ${startDateStr} to ${endDateStr} (Season ${season})...`
  );
  const games = await fetchGames(apiKey, season, startDateStr, endDateStr);

  console.log(`Processing ${games.length} games...`);

  // Store games in database
  for (const game of games) {
    const { data: existingTeams } = await supabase
      .from("nba_teams")
      .select("team_id")
      .in("team_id", [game.home_team.id, game.visitor_team.id]);

    if (!existingTeams || existingTeams.length < 2) {
      console.log(
        `Skipping game ${game.id} - teams not in database yet`
      );
      continue;
    }

    await supabase.from("games").upsert(
      {
        game_id: `bdl_${game.id}`,
        event_id: `bdl_${game.id}`,
        game_date: game.date.split("T")[0],
        season: season.toString(),
        home_team_id: game.home_team.id,
        away_team_id: game.visitor_team.id,
        home_team_score: game.home_team_score,
        away_team_score: game.visitor_team_score,
        total_score: game.home_team_score + game.visitor_team_score,
        status: game.status === "Final" ? "completed" : "scheduled",
        updated_at: new Date().toISOString(),
      },
      { onConflict: "game_id" }
    );
  }

  console.log("✅ Games synced successfully");

  // Now calculate and update team stats
  console.log("Calculating team statistics...");
  const { data: teams } = await supabase.from("nba_teams").select("team_id");

  if (!teams) {
    console.error("No teams found in database");
    return;
  }

  for (const team of teams) {
    const stats = calculateTeamStats(games, team.team_id);

    if (!stats) {
      console.log(`No stats available for team ${team.team_id}`);
      continue;
    }

    // Calculate offensive and defensive ratings (simplified)
    // Offensive rating: points per 100 possessions (approximated)
    const offensiveRating = stats.pointsPerGame * 1.02; // Simplified multiplier
    const defensiveRating = stats.pointsAllowedPerGame * 1.02;
    
    // Pace: estimated possessions per game (simplified formula)
    const pace = ((stats.pointsPerGame + stats.pointsAllowedPerGame) / 2) * 0.96;

    await supabase.from("team_stats").upsert(
      {
        team_id: team.team_id,
        season: season.toString(),
        games_played: stats.gamesPlayed,
        points_per_game: stats.pointsPerGame.toFixed(2),
        points_allowed_per_game: stats.pointsAllowedPerGame.toFixed(2),
        pace: pace.toFixed(2),
        offensive_rating: offensiveRating.toFixed(2),
        defensive_rating: defensiveRating.toFixed(2),
        home_record: stats.homeRecord,
        away_record: stats.awayRecord,
        last_5_avg_points: stats.last5AvgPoints.toFixed(2),
        last_10_avg_points: stats.last10AvgPoints.toFixed(2),
        last_5_avg_allowed: stats.last5AvgAllowed.toFixed(2),
        last_10_avg_allowed: stats.last10AvgAllowed.toFixed(2),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "team_id,season" }
    );
  }

  console.log("✅ Team stats calculated and synced");
}

/**
 * Full sync: teams + games + stats
 */
export async function fullSync(supabase: SupabaseClient, apiKey: string) {
  console.log("🚀 Starting full data sync...");
  
  try {
    await syncTeams(supabase, apiKey);
    await syncGamesAndStats(supabase, apiKey, 60); // Last 60 days for more data
    
    console.log("✅ Full sync completed successfully!");
    return { success: true };
  } catch (error) {
    console.error("❌ Sync failed:", error);
    return { success: false, error };
  }
}
