/**
 * Vercel Cron Job: Generate Daily Pick
 * Schedule: Every day at 6:00 AM UTC
 * API Usage: ~1 call per day = 30/month
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

    console.log(`[CRON] Generating daily pick at ${new Date().toISOString()}`);

    // Call your existing getBoard function which handles pick generation
    const response = await fetch(`${baseUrl}/api/picks/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-cron-secret": process.env.CRON_SECRET || "",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to generate pick: ${response.statusText}`);
    }

    const data = await response.json();

    console.log(`[CRON] Pick generated successfully:`, data);

    return res.status(200).json({
      success: true,
      message: "Daily pick generated",
      data,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("[CRON] Error generating pick:", error);
    return res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
}
