/**
 * API Endpoint: Generate Daily Pick
 * Manual endpoint to generate today's pick
 */

import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Import server functions (only works on server-side)
    const { createClient } = await import("@supabase/supabase-js");
    
    const supabaseUrl = process.env.SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const oddsApiKey = process.env.ODDS_API_KEY!;
    const ballApiKey = process.env.BALLDONTLIE_API_KEY;

    const supabase = createClient(supabaseUrl, supabaseKey);

    const today = new Date().toISOString().slice(0, 10);

    // Check if today already has a pick
    const { data: existing } = await supabase
      .from("daily_picks")
      .select("*")
      .eq("pick_date", today)
      .maybeSingle();

    if (existing) {
      return res.status(200).json({
        success: true,
        message: "Pick already exists for today",
        pick: existing,
      });
    }

    // Generate new pick (import odds functions)
    const { findCandidates } = await import("../../src/lib/odds.server");
    const { enhanceWithPrediction } = await import("../../src/lib/prediction-engine.server");

    const candidates = await findCandidates(oddsApiKey, today);

    if (candidates.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No qualifying games today",
        pick: null,
      });
    }

    // Enhance NBA games with stats
    const enhancedCandidates = await Promise.all(
      candidates.map(async (candidate) => {
        if (candidate.sportKey === "basketball_nba" && ballApiKey) {
          try {
            const { data: homeTeams } = await supabase
              .from("nba_teams")
              .select("team_id")
              .or(`full_name.ilike.%${candidate.homeTeam}%,team_name.ilike.%${candidate.homeTeam}%`)
              .limit(1)
              .maybeSingle();

            const { data: awayTeams } = await supabase
              .from("nba_teams")
              .select("team_id")
              .or(`full_name.ilike.%${candidate.awayTeam}%,team_name.ilike.%${candidate.awayTeam}%`)
              .limit(1)
              .maybeSingle();

            if (homeTeams && awayTeams) {
              const { data: homeStats } = await supabase
                .from("team_stats")
                .select("*")
                .eq("team_id", homeTeams.team_id)
                .maybeSingle();

              const { data: awayStats } = await supabase
                .from("team_stats")
                .select("*")
                .eq("team_id", awayTeams.team_id)
                .maybeSingle();

              if (homeStats && awayStats) {
                return enhanceWithPrediction(candidate, homeStats, awayStats);
              }
            }
          } catch (error) {
            console.error("Enhancement error:", error);
          }
        }
        return candidate;
      })
    );

    enhancedCandidates.sort((a, b) => b.confidence - a.confidence);
    const best = enhancedCandidates[0]!;

    // Insert pick
    const { data: newPick, error } = await supabase.from("daily_picks").insert({
      pick_date: today,
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
      stake: 10,
    }).select().single();

    if (error) throw error;

    return res.status(200).json({
      success: true,
      message: "Pick generated successfully",
      pick: newPick,
    });
  } catch (error: any) {
    console.error("Generate pick error:", error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}
