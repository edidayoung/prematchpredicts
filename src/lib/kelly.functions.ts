import { createServerFn } from "@tanstack/react-start";

export type KellyTracker = {
  id: string;
  name: string;
  starting_bankroll: number;
  current_bankroll: number;
  kelly_fraction: number;
  total_bets: number;
  wins: number;
  losses: number;
  pushes: number;
  total_staked: number;
  total_profit: number;
  roi: number;
  created_at: string;
  locked_at: string;
};

export type KellyBet = {
  id: string;
  tracker_id: string;
  pick_id: string;
  stake: number;
  result: string;
  profit: number;
  bankroll_before: number;
  bankroll_after: number;
  edge_used: number;
  win_prob_used: number;
  kelly_percentage: number;
  created_at: string;
  settled_at: string | null;
};

/**
 * Calculate the Kelly Criterion percentage for optimal bet sizing
 * Formula: (odds × probability - 1) / (odds - 1)
 * 
 * @param odds - Decimal odds (e.g., 2.30)
 * @param winProbability - Fair win probability (e.g., 0.508 = 50.8%)
 * @returns Kelly percentage (e.g., 0.12 = 12% of bankroll)
 */
export function calculateKellyPercentage(odds: number, winProbability: number): number {
  // Kelly formula: (odds × probability - 1) / (odds - 1)
  const numerator = (odds * winProbability) - 1;
  const denominator = odds - 1;
  
  const kelly = numerator / denominator;
  
  // Cap at 25% for safety (even before applying fraction)
  return Math.max(0, Math.min(0.25, kelly));
}

/**
 * Calculate the recommended stake using Half Kelly
 */
export function calculateKellyStake(
  bankroll: number,
  odds: number,
  winProbability: number,
  kellyFraction: number = 0.5
): { stake: number; kellyPercentage: number } {
  const kellyPercentage = calculateKellyPercentage(odds, winProbability);
  const stake = bankroll * kellyPercentage * kellyFraction;
  
  // Round to 2 decimal places
  return {
    stake: Math.round(stake * 100) / 100,
    kellyPercentage
  };
}

/**
 * Get all Kelly trackers
 */
export const getKellyTrackers = createServerFn({ method: "GET" }).handler(async (): Promise<KellyTracker[]> => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  
  const { data, error } = await supabaseAdmin
    .from("kelly_trackers")
    .select("*")
    .order("created_at", { ascending: false });
  
  if (error) {
    console.error("Error fetching Kelly trackers:", error);
    throw new Error("Failed to fetch Kelly trackers");
  }
  
  return (data || []) as KellyTracker[];
});

/**
 * Get a single Kelly tracker with its bet history
 */
export const getKellyTracker = createServerFn({ method: "GET" })
  .validator((data: { trackerId: string }) => data)
  .handler(async ({ data }): Promise<{ tracker: KellyTracker; bets: KellyBet[] }> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    
    const { data: tracker, error: trackerError } = await supabaseAdmin
      .from("kelly_trackers")
      .select("*")
      .eq("id", data.trackerId)
      .single();
    
    if (trackerError || !tracker) {
      throw new Error("Tracker not found");
    }
    
    const { data: bets, error: betsError } = await supabaseAdmin
      .from("kelly_bets")
      .select("*")
      .eq("tracker_id", data.trackerId)
      .order("created_at", { ascending: false });
    
    if (betsError) {
      console.error("Error fetching Kelly bets:", betsError);
      throw new Error("Failed to fetch Kelly bets");
    }
    
    return {
      tracker: tracker as KellyTracker,
      bets: (bets || []) as KellyBet[]
    };
  });

/**
 * Create a new Kelly tracker
 */
export const createKellyTracker = createServerFn({ method: "POST" })
  .validator((data: { name: string; startingBankroll: number }) => data)
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    
    if (!data.name || data.name.trim().length === 0) {
      throw new Error("Tracker name is required");
    }
    
    if (data.startingBankroll <= 0) {
      throw new Error("Starting bankroll must be greater than 0");
    }
    
    const { data: tracker, error } = await supabaseAdmin
      .from("kelly_trackers")
      .insert({
        name: data.name.trim(),
        starting_bankroll: data.startingBankroll,
        current_bankroll: data.startingBankroll,
        kelly_fraction: 0.5, // Always Half Kelly
      })
      .select()
      .single();
    
    if (error) {
      console.error("Error creating Kelly tracker:", error);
      throw new Error("Failed to create tracker");
    }
    
    return tracker as KellyTracker;
  });

/**
 * Apply Kelly bet to all active trackers for a settled pick
 * Called automatically when admin settles a pick
 */
export async function applyKellyBetToAllTrackers(pickId: string): Promise<void> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  
  // Get all trackers
  const { data: trackers, error: trackersError } = await supabaseAdmin
    .from("kelly_trackers")
    .select("*");
  
  if (trackersError) {
    console.error("[KELLY_AUTO_APPLY] Error fetching trackers:", trackersError);
    return;
  }
  
  if (!trackers || trackers.length === 0) {
    console.log("[KELLY_AUTO_APPLY] No trackers found");
    return;
  }
  
  console.log(`[KELLY_AUTO_APPLY] Applying Kelly bet to ${trackers.length} tracker(s)`);
  
  // Apply to each tracker
  for (const tracker of trackers) {
    try {
      await applyKellyBet({
        data: {
          trackerId: tracker.id,
          pickId: pickId,
        },
      });
    } catch (error) {
      console.error(`[KELLY_AUTO_APPLY] Failed for tracker ${tracker.name}:`, error);
      // Continue with other trackers even if one fails
    }
  }
  
  console.log("[KELLY_AUTO_APPLY] Finished applying Kelly bets");
}

/**
 * Apply Kelly bet to a settled pick
 * Called automatically when a pick is settled
 */
export const applyKellyBet = createServerFn({ method: "POST" })
  .validator((data: { trackerId: string; pickId: string }) => data)
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    
    // Get tracker
    const { data: tracker, error: trackerError } = await supabaseAdmin
      .from("kelly_trackers")
      .select("*")
      .eq("id", data.trackerId)
      .single();
    
    if (trackerError || !tracker) {
      throw new Error("Tracker not found");
    }
    
    // Get pick
    const { data: pick, error: pickError } = await supabaseAdmin
      .from("daily_picks")
      .select("*")
      .eq("id", data.pickId)
      .single();
    
    if (pickError || !pick) {
      throw new Error("Pick not found");
    }
    
    // Check if pick was created after tracker (Option B logic)
    if (new Date(pick.created_at) < new Date(tracker.created_at)) {
      console.log(`[KELLY] Skipping pick ${pick.id} - created before tracker`);
      return { skipped: true, reason: "Pick created before tracker" };
    }
    
    // Check if pick is settled
    if (pick.status === "pending") {
      throw new Error("Pick is not settled yet");
    }
    
    // Check if bet already exists
    const { data: existingBet } = await supabaseAdmin
      .from("kelly_bets")
      .select("id")
      .eq("tracker_id", data.trackerId)
      .eq("pick_id", data.pickId)
      .maybeSingle();
    
    if (existingBet) {
      console.log(`[KELLY] Bet already exists for pick ${pick.id}`);
      return { skipped: true, reason: "Bet already applied" };
    }
    
    // Calculate Kelly stake using actual edge and win probability from pick
    const odds = Number(pick.odds);
    const winProb = pick.adjusted_win_prob ? Number(pick.adjusted_win_prob) : 0.5; // Fallback to 50% if not available
    const edge = pick.edge ? Number(pick.edge) : 0; // Fallback to 0 if not available
    
    const { stake, kellyPercentage } = calculateKellyStake(
      Number(tracker.current_bankroll),
      odds,
      winProb,
      Number(tracker.kelly_fraction)
    );
    
    // Calculate profit
    let profit = 0;
    if (pick.status === "won") {
      profit = stake * (odds - 1);
    } else if (pick.status === "lost") {
      profit = -stake;
    } else if (pick.status === "push" || pick.status === "void") {
      profit = 0;
    }
    
    const bankrollAfter = Number(tracker.current_bankroll) + profit;
    
    // Create Kelly bet record
    const { error: betError } = await supabaseAdmin
      .from("kelly_bets")
      .insert({
        tracker_id: data.trackerId,
        pick_id: data.pickId,
        stake,
        result: pick.status,
        profit,
        bankroll_before: Number(tracker.current_bankroll),
        bankroll_after: bankrollAfter,
        edge_used: edge,
        win_prob_used: winProb,
        kelly_percentage: kellyPercentage,
        settled_at: pick.settled_at,
      });
    
    if (betError) {
      console.error("Error creating Kelly bet:", betError);
      throw new Error("Failed to create bet record");
    }
    
    // Update tracker stats
    const wins = pick.status === "won" ? Number(tracker.wins) + 1 : Number(tracker.wins);
    const losses = pick.status === "lost" ? Number(tracker.losses) + 1 : Number(tracker.losses);
    const pushes = (pick.status === "push" || pick.status === "void") ? Number(tracker.pushes) + 1 : Number(tracker.pushes);
    const totalBets = Number(tracker.total_bets) + 1;
    const totalStaked = Number(tracker.total_staked) + stake;
    const totalProfit = Number(tracker.total_profit) + profit;
    const roi = totalStaked > 0 ? (totalProfit / totalStaked) * 100 : 0;
    
    const { error: updateError } = await supabaseAdmin
      .from("kelly_trackers")
      .update({
        current_bankroll: bankrollAfter,
        total_bets: totalBets,
        wins,
        losses,
        pushes,
        total_staked: totalStaked,
        total_profit: totalProfit,
        roi,
      })
      .eq("id", data.trackerId);
    
    if (updateError) {
      console.error("Error updating Kelly tracker:", updateError);
      throw new Error("Failed to update tracker");
    }
    
    console.log(`[KELLY] Applied bet to tracker ${tracker.name}: ${pick.status} | Stake: ₦${stake.toFixed(2)} | Profit: ₦${profit.toFixed(2)}`);
    
    return { success: true, stake, profit, bankrollAfter };
  });


/**
 * Delete a Kelly tracker (admin only)
 */
export const deleteKellyTracker = createServerFn({ method: "POST" })
  .validator((data: { trackerId: string }) => data)
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    
    const { error } = await supabaseAdmin
      .from("kelly_trackers")
      .delete()
      .eq("id", data.trackerId);
    
    if (error) {
      console.error("Error deleting Kelly tracker:", error);
      throw new Error("Failed to delete tracker");
    }
    
    console.log(`[KELLY] Deleted tracker ${data.trackerId}`);
    return { success: true };
  });
