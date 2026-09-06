/**
 * Vercel Cron Job: Settle Pending Games
 * Schedule: Every 2 hours
 * API Usage: ~1 call per pending game = ~12/day = 360/month
 */

import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Verify cron secret to prevent unauthorized calls
  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const baseUrl = process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000";

    console.log(`[CRON] Settling pending games at ${new Date().toISOString()}`);

    // Call settlement endpoint
    const response = await fetch(`${baseUrl}/api/picks/settle`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-cron-secret": process.env.CRON_SECRET || "",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to settle games: ${response.statusText}`);
    }

    const data = await response.json();

    console.log(`[CRON] Settlement complete:`, data);

    return res.status(200).json({
      success: true,
      message: "Games settled",
      data,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("[CRON] Error settling games:", error);
    return res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
}
