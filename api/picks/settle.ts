/**
 * API Endpoint: Settle Pending Games
 * Manual endpoint to check and settle finished games
 */

import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { createClient } = await import("@supabase/supabase-js");
    
    const supabaseUrl = process.env.SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const oddsApiKey = process.env.ODDS_API_KEY!;

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Find pending picks that should be finished (>2 hours ago)
    const { data: pending } = await supabase
      .from("daily_picks")
      .select("*")
      .eq("status", "pending")
      .lt("commence_time", new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString());

    if (!pending || pending.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No pending games to settle",
        settled: 0,
      });
    }

    const { fetchFinalTotal } = await import("../../src/lib/odds.server");

    const settled = [];

    for (const pick of pending) {
      try {
        const total = await fetchFinalTotal(oddsApiKey, pick.sport_key, pick.event_id);
        
        if (total == null) {
          console.log(`[SETTLE] Game ${pick.id} not finished yet`);
          continue;
        }

        const line = Number(pick.line);
        const status =
          total === line ? "push" : (total > line) === (pick.selection === "Over") ? "won" : "lost";
        
        const profit =
          status === "push" ? 0 : status === "won" ? Number(pick.stake) * (Number(pick.odds) - 1) : -Number(pick.stake);

        await supabase
          .from("daily_picks")
          .update({
            status,
            final_total: total,
            profit,
            settled_at: new Date().toISOString(),
          })
          .eq("id", pick.id);

        settled.push({
          id: pick.id,
          teams: `${pick.away_team} @ ${pick.home_team}`,
          status,
          profit,
        });

        console.log(`[SETTLE] ✅ ${pick.away_team} @ ${pick.home_team}: ${status.toUpperCase()} (${total} total)`);
      } catch (error) {
        console.error(`[SETTLE] Error settling pick ${pick.id}:`, error);
      }
    }

    return res.status(200).json({
      success: true,
      message: `Settled ${settled.length} games`,
      settled,
    });
  } catch (error: any) {
    console.error("Settle games error:", error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}
