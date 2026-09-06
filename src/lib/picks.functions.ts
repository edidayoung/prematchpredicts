import { createServerFn } from "@tanstack/react-start";

export type Pick = {
  id: string;
  pick_date: string;
  sport_title: string;
  home_team: string;
  away_team: string;
  commence_time: string;
  selection: string;
  line: number;
  odds: number;
  bookmaker: string;
  confidence: number;
  reasoning: string;
  status: string;
  final_total: number | null;
  stake: number;
  profit: number | null;
};

export type BoardData = {
  today: Pick | null;
  history: Pick[];
  stats: {
    settled: number;
    wins: number;
    losses: number;
    pushes: number;
    winRate: number;
    profit: number;
    staked: number;
    roi: number;
    bankroll: number;
    streak: number;
  };
  message: string | null;
};

const STARTING_BANKROLL = 1000; // NGN 1,000 starting bankroll
const STAKE = 10; // NGN 10 per bet

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function buildStats(picks: Pick[]): BoardData["stats"] {
  const settled = picks.filter((p) => p.status === "won" || p.status === "lost" || p.status === "push");
  const wins = settled.filter((p) => p.status === "won").length;
  const losses = settled.filter((p) => p.status === "lost").length;
  const pushes = settled.filter((p) => p.status === "push").length;
  const decided = wins + losses;
  const profit = settled.reduce((sum, p) => sum + Number(p.profit ?? 0), 0);
  const staked = settled.reduce((sum, p) => sum + Number(p.stake ?? 0), 0);

  // Current run of wins (positive) or losses (negative), newest first.
  let streak = 0;
  for (const p of settled) {
    if (p.status === "won" && streak >= 0) streak += 1;
    else if (p.status === "lost" && streak <= 0) streak -= 1;
    else break;
  }

  return {
    settled: settled.length,
    wins,
    losses,
    pushes,
    winRate: decided ? (wins / decided) * 100 : 0,
    profit,
    staked,
    roi: staked ? (profit / staked) * 100 : 0,
    bankroll: STARTING_BANKROLL + profit,
    streak,
  };
}

export const getBoard = createServerFn({ method: "GET" }).handler(async (): Promise<BoardData> => {
  const oddsApiKey = process.env["ODDS_API_KEY"];
  const ballApiKey = process.env["BALLDONTLIE_API_KEY"];
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { findCandidates, fetchFinalTotal } = await import("./odds.server");
  const { enhanceWithPrediction } = await import("./prediction-engine.server");

  let message: string | null = null;
  const day = todayIso();

  // 1. Settle anything that has finished since the last visit.
  if (oddsApiKey) {
    const { data: pending } = await supabaseAdmin
      .from("daily_picks")
      .select("*")
      .eq("status", "pending")
      .lt("commence_time", new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString());

    for (const row of pending ?? []) {
      const total = await fetchFinalTotal(oddsApiKey, row.sport_key, row.event_id);
      if (total == null) continue;
      const line = Number(row.line);
      const status =
        total === line ? "push" : (total > line) === (row.selection === "Over") ? "won" : "lost";
      const profit =
        status === "push" ? 0 : status === "won" ? Number(row.stake) * (Number(row.odds) - 1) : -Number(row.stake);
      await supabaseAdmin
        .from("daily_picks")
        .update({ status, final_total: total, profit, settled_at: new Date().toISOString() })
        .eq("id", row.id);
    }
  }

  // 2. Make sure today has a pick.
  const { data: existingToday } = await supabaseAdmin
    .from("daily_picks")
    .select("*")
    .eq("pick_date", day)
    .maybeSingle();

  if (!existingToday) {
    if (!oddsApiKey) {
      message = "The odds feed key is missing, so today's pick could not be generated.";
    } else {
      try {
        const candidates = await findCandidates(oddsApiKey, day);
        if (candidates.length === 0) {
          message = "No game anywhere today has an over/under price in range. Check back closer to kick-off.";
        } else {
          // Enhance candidates with statistical predictions for NBA games
          const enhancedCandidates = await Promise.all(
            candidates.map(async (candidate) => {
              // Only enhance NBA games if we have the BallDontLie API key
              if (candidate.sportKey === "basketball_nba" && ballApiKey) {
                try {
                  console.log(`[PREDICTION] Attempting to enhance NBA game: ${candidate.awayTeam} @ ${candidate.homeTeam}`);
                  
                  // Try to find team stats
                  const { data: teams } = await supabaseAdmin
                    .from("nba_teams")
                    .select("team_id, team_name, full_name")
                    .or(`full_name.ilike.%${candidate.homeTeam}%,team_name.ilike.%${candidate.homeTeam}%`)
                    .limit(1)
                    .maybeSingle();

                  const { data: awayTeams } = await supabaseAdmin
                    .from("nba_teams")
                    .select("team_id, team_name, full_name")
                    .or(`full_name.ilike.%${candidate.awayTeam}%,team_name.ilike.%${candidate.awayTeam}%`)
                    .limit(1)
                    .maybeSingle();

                  if (teams && awayTeams) {
                    console.log(`[PREDICTION] Found teams: ${teams.full_name} vs ${awayTeams.full_name}`);
                    
                    const { data: homeStats } = await supabaseAdmin
                      .from("team_stats")
                      .select("*")
                      .eq("team_id", teams.team_id)
                      .maybeSingle();

                    const { data: awayStats } = await supabaseAdmin
                      .from("team_stats")
                      .select("*")
                      .eq("team_id", awayTeams.team_id)
                      .maybeSingle();

                    if (homeStats && awayStats) {
                      console.log(`[PREDICTION] ✅ Using real stats! Home: ${homeStats.points_per_game} PPG, Away: ${awayStats.points_per_game} PPG`);
                      const enhanced = enhanceWithPrediction(candidate, homeStats, awayStats);
                      console.log(`[PREDICTION] Enhanced confidence: ${candidate.confidence}% → ${enhanced.confidence}%`);
                      return enhanced;
                    } else {
                      console.log(`[PREDICTION] ⚠️ Teams found but stats missing. Run /admin sync.`);
                    }
                  } else {
                    console.log(`[PREDICTION] ⚠️ NBA teams not in database. Run /admin sync first.`);
                  }
                } catch (error) {
                  console.error("[PREDICTION] Error enhancing candidate with stats:", error);
                }
              }
              return candidate;
            })
          );

          // Sort by confidence (now enhanced with statistical model)
          enhancedCandidates.sort((a, b) => b.confidence - a.confidence);
          const best = enhancedCandidates[0]!;

          await supabaseAdmin.from("daily_picks").insert({
            pick_date: day,
            sport_key: best.sportKey,
            sport_title: best.sportTitle,
            event_id: best.eventId,
            home_team: best.homeTeam,
            away_team: best.awayTeam,
            commence_time: best.commenceTime,
            selection: best.selection,
            line: best.line,
            odds: best.odds,
            bookmaker: best.bookmaker,
            confidence: best.confidence,
            reasoning: best.reasoning,
            stake: STAKE,
          });
        }
      } catch (error) {
        console.error("pick generation failed", error);
        message = "The odds feed could not be reached just now. Try refreshing in a moment.";
      }
    }
  }

  // 3. Read everything back for the board.
  const { data: rows } = await supabaseAdmin
    .from("daily_picks")
    .select("*")
    .order("pick_date", { ascending: false })
    .limit(120);

  const picks = (rows ?? []) as unknown as Pick[];
  const today = picks.find((p) => p.pick_date === day) ?? null;

  return {
    today,
    history: picks.filter((p) => p.pick_date !== day),
    stats: buildStats(picks),
    message,
  };
});
