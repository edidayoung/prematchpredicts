import { createServerFn } from "@tanstack/react-start";
import type { Pick } from "./picks.functions";

export type LineEdgeStats = {
  range: string;
  rangeLabel: string;
  picks: number;
  wins: number;
  losses: number;
  pushes: number;
  winRate: number;
  avgEdge: number;
};

export type SpreadStats = {
  range: string;
  rangeLabel: string;
  picks: number;
  wins: number;
  losses: number;
  pushes: number;
  winRate: number;
  avgSpread: number;
};

export type SportSpreadStats = {
  sport: string;
  stats: SpreadStats[];
};

export type Pattern = {
  type: "winning" | "losing";
  name: string;
  conditions: {
    lineEdgeMin?: number;
    lineEdgeMax?: number;
    spreadMin?: number;
    spreadMax?: number;
    confidenceMin?: number;
    sports?: string[];
  };
  picks: number;
  wins: number;
  winRate: number;
  sampleSize: "too_small" | "small" | "medium" | "large";
};

export type AnalyticsData = {
  lineEdgeStats: LineEdgeStats[];
  spreadStats: SpreadStats[];
  sportSpreadStats: SportSpreadStats[];
  winningPatterns: Pattern[];
  losingPatterns: Pattern[];
  totalPicks: number;
  picksWithData: number;
};

function categorizePicks(picks: Pick[]): AnalyticsData {
  // Filter picks that have the analytics data
  const picksWithData = picks.filter(
    (p) => p.line_edge !== null && p.bookmaker_spread !== null && p.status !== "pending"
  );

  // Line Edge Categories
  const lineEdgeRanges = [
    { min: 0, max: Infinity, label: "≥ 0.0 (Advantage)", key: "positive" },
    { min: -0.25, max: -0.01, label: "-0.25 to 0.0", key: "slight_neg" },
    { min: -0.5, max: -0.26, label: "-0.5 to -0.26", key: "moderate_neg" },
    { min: -Infinity, max: -0.51, label: "< -0.5 (High Risk)", key: "high_neg" },
  ];

  const lineEdgeStats: LineEdgeStats[] = lineEdgeRanges.map((range) => {
    const inRange = picksWithData.filter(
      (p) => p.line_edge! >= range.min && p.line_edge! < range.max
    );
    const wins = inRange.filter((p) => p.status === "won").length;
    const losses = inRange.filter((p) => p.status === "lost").length;
    const pushes = inRange.filter((p) => p.status === "push").length;
    const decided = wins + losses;

    return {
      range: range.key,
      rangeLabel: range.label,
      picks: inRange.length,
      wins,
      losses,
      pushes,
      winRate: decided > 0 ? (wins / decided) * 100 : 0,
      avgEdge: inRange.length > 0
        ? inRange.reduce((sum, p) => sum + (p.line_edge || 0), 0) / inRange.length
        : 0,
    };
  });

  // Bookmaker Spread Categories
  const spreadRanges = [
    { min: 0, max: 0.5, label: "0 - 0.5 (Strong)", key: "strong" },
    { min: 0.5, max: 1.0, label: "0.5 - 1.0 (Good)", key: "good" },
    { min: 1.0, max: 2.0, label: "1.0 - 2.0 (Fair)", key: "fair" },
    { min: 2.0, max: Infinity, label: "> 2.0 (Weak)", key: "weak" },
  ];

  const spreadStats: SpreadStats[] = spreadRanges.map((range) => {
    const inRange = picksWithData.filter(
      (p) => p.bookmaker_spread! >= range.min && p.bookmaker_spread! < range.max
    );
    const wins = inRange.filter((p) => p.status === "won").length;
    const losses = inRange.filter((p) => p.status === "lost").length;
    const pushes = inRange.filter((p) => p.status === "push").length;
    const decided = wins + losses;

    return {
      range: range.key,
      rangeLabel: range.label,
      picks: inRange.length,
      wins,
      losses,
      pushes,
      winRate: decided > 0 ? (wins / decided) * 100 : 0,
      avgSpread: inRange.length > 0
        ? inRange.reduce((sum, p) => sum + (p.bookmaker_spread || 0), 0) / inRange.length
        : 0,
    };
  });

  // Sport-specific spread analysis
  const sports = [...new Set(picksWithData.map((p) => p.sport_title))];
  const sportSpreadStats: SportSpreadStats[] = sports.map((sport) => {
    const sportPicks = picksWithData.filter((p) => p.sport_title === sport);
    const stats: SpreadStats[] = spreadRanges.map((range) => {
      const inRange = sportPicks.filter(
        (p) => p.bookmaker_spread! >= range.min && p.bookmaker_spread! < range.max
      );
      const wins = inRange.filter((p) => p.status === "won").length;
      const losses = inRange.filter((p) => p.status === "lost").length;
      const pushes = inRange.filter((p) => p.status === "push").length;
      const decided = wins + losses;

      return {
        range: range.key,
        rangeLabel: range.label,
        picks: inRange.length,
        wins,
        losses,
        pushes,
        winRate: decided > 0 ? (wins / decided) * 100 : 0,
        avgSpread: inRange.length > 0
          ? inRange.reduce((sum, p) => sum + (p.bookmaker_spread || 0), 0) / inRange.length
          : 0,
      };
    });

    return { sport, stats };
  });

  // Pattern Detection
  const winningPatterns: Pattern[] = [];
  const losingPatterns: Pattern[] = [];

  // Pattern 1: Sweet Spot (Good line edge + low spread + high confidence)
  const sweetSpot = picksWithData.filter(
    (p) => p.line_edge! >= -0.25 && p.bookmaker_spread! <= 0.5 && p.confidence >= 95
  );
  const sweetWins = sweetSpot.filter((p) => p.status === "won").length;
  const sweetLosses = sweetSpot.filter((p) => p.status === "lost").length;
  const sweetDecided = sweetWins + sweetLosses;
  if (sweetDecided > 0) {
    const winRate = (sweetWins / sweetDecided) * 100;
    const pattern: Pattern = {
      type: winRate >= 75 ? "winning" : "losing",
      name: "The Sweet Spot",
      conditions: {
        lineEdgeMin: -0.25,
        spreadMax: 0.5,
        confidenceMin: 95,
      },
      picks: sweetSpot.length,
      wins: sweetWins,
      winRate,
      sampleSize: sweetDecided < 5 ? "too_small" : sweetDecided < 10 ? "small" : sweetDecided < 20 ? "medium" : "large",
    };
    if (winRate >= 75) {
      winningPatterns.push(pattern);
    } else if (winRate <= 50) {
      losingPatterns.push(pattern);
    }
  }

  // Pattern 2: Danger Zone (Bad line edge + high spread)
  const dangerZone = picksWithData.filter(
    (p) => p.line_edge! < -0.5 && p.bookmaker_spread! > 1.5
  );
  const dangerWins = dangerZone.filter((p) => p.status === "won").length;
  const dangerLosses = dangerZone.filter((p) => p.status === "lost").length;
  const dangerDecided = dangerWins + dangerLosses;
  if (dangerDecided > 0) {
    const winRate = (dangerWins / dangerDecided) * 100;
    const pattern: Pattern = {
      type: winRate <= 50 ? "losing" : "winning",
      name: "The Danger Zone",
      conditions: {
        lineEdgeMax: -0.5,
        spreadMin: 1.5,
      },
      picks: dangerZone.length,
      wins: dangerWins,
      winRate,
      sampleSize: dangerDecided < 5 ? "too_small" : dangerDecided < 10 ? "small" : dangerDecided < 20 ? "medium" : "large",
    };
    if (winRate <= 50) {
      losingPatterns.push(pattern);
    } else if (winRate >= 75) {
      winningPatterns.push(pattern);
    }
  }

  // Pattern 3: High Confidence Edge (Minimal line edge but very high confidence)
  const highConfEdge = picksWithData.filter(
    (p) => p.line_edge! >= -0.25 && p.line_edge! <= 0 && p.confidence >= 97
  );
  const hceWins = highConfEdge.filter((p) => p.status === "won").length;
  const hceLosses = highConfEdge.filter((p) => p.status === "lost").length;
  const hceDecided = hceWins + hceLosses;
  if (hceDecided > 0) {
    const winRate = (hceWins / hceDecided) * 100;
    const pattern: Pattern = {
      type: winRate >= 75 ? "winning" : "losing",
      name: "High Confidence Play",
      conditions: {
        lineEdgeMin: -0.25,
        lineEdgeMax: 0,
        confidenceMin: 97,
      },
      picks: highConfEdge.length,
      wins: hceWins,
      winRate,
      sampleSize: hceDecided < 5 ? "too_small" : hceDecided < 10 ? "small" : hceDecided < 20 ? "medium" : "large",
    };
    if (winRate >= 75) {
      winningPatterns.push(pattern);
    } else if (winRate <= 50) {
      losingPatterns.push(pattern);
    }
  }

  return {
    lineEdgeStats,
    spreadStats,
    sportSpreadStats,
    winningPatterns,
    losingPatterns,
    totalPicks: picks.length,
    picksWithData: picksWithData.length,
  };
}

export const getAnalytics = createServerFn({ method: "GET" }).handler(async (): Promise<AnalyticsData> => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  // Fetch all picks
  const { data: rows } = await supabaseAdmin
    .from("daily_picks")
    .select("*")
    .order("pick_date", { ascending: false });

  const picks = (rows ?? []) as unknown as Pick[];

  return categorizePicks(picks);
});
