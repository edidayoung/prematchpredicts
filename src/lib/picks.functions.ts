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
const STAKE = 100; // NGN 100 per bet

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
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { findCandidates } = await import("./odds.server");

  let message: string | null = null;
  const day = todayIso();
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
          message = "No high-confidence pick available today. Our AI model only selects games with 80%+ confidence to protect your bankroll. Check back tomorrow!";
        } else {
          candidates.sort((a, b) => b.confidence - a.confidence);
          const best = candidates[0]!;

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
  
  // Separate today's pick from history based on 4-hour rule
  const now = Date.now();
  let today: Pick | null = null;
  const history: Pick[] = [];
  
  for (const pick of picks) {
    if (pick.pick_date === day) {
      // Check if game started more than 4 hours ago
      const gameStartTime = new Date(pick.commence_time).getTime();
      const fourHoursAfterStart = gameStartTime + (4 * 60 * 60 * 1000); // 4 hours in milliseconds
      
      if (now < fourHoursAfterStart) {
        // Game started less than 4 hours ago - still "today's pick"
        today = pick;
      } else {
        // Game started more than 4 hours ago - move to history for settlement
        history.push(pick);
      }
    } else {
      history.push(pick);
    }
  }

  return {
    today,
    history,
    stats: buildStats(picks),
    message,
  };
});

// Manual settlement function for admin
export const settlePick = createServerFn({ method: "POST" })
  .validator((data: { pickId: string; status: string; finalTotal: number }) => data)
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    
    // Get the pick
    const { data: pick, error: fetchError } = await supabaseAdmin
      .from("daily_picks")
      .select("*")
      .eq("id", data.pickId)
      .single();

    if (fetchError || !pick) {
      throw new Error("Pick not found");
    }

    // Calculate profit
    let profit = 0;
    if (data.status === "won") {
      profit = Number(pick.stake) * (Number(pick.odds) - 1);
    } else if (data.status === "lost") {
      profit = -Number(pick.stake);
    } else if (data.status === "push" || data.status === "void") {
      profit = 0;
    }

    // Update the pick
    const { error: updateError } = await supabaseAdmin
      .from("daily_picks")
      .update({
        status: data.status,
        final_total: data.finalTotal,
        profit,
        settled_at: new Date().toISOString(),
      })
      .eq("id", data.pickId);

    if (updateError) {
      throw new Error("Failed to update pick");
    }

    return { success: true, profit };
  });


