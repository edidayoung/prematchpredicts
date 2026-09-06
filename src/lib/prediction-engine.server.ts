// Advanced Prediction Engine using Real Team Statistics
import type { Candidate } from "./odds.server";

type TeamStats = {
  team_id: number;
  games_played: number;
  points_per_game: number;
  points_allowed_per_game: number;
  pace: number;
  offensive_rating: number;
  defensive_rating: number;
  last_5_avg_points: number;
  last_10_avg_points: number;
  last_5_avg_allowed: number;
  last_10_avg_allowed: number;
  home_record: string;
  away_record: string;
};

type PredictionResult = {
  predictedTotal: number;
  predictedHomeScore: number;
  predictedAwayScore: number;
  confidenceScore: number;
  edge: number;
  reasoning: string;
  modelFactors: {
    homeOffense: number;
    homeDefense: number;
    awayOffense: number;
    awayDefense: number;
    pace: number;
    recentForm: string;
    homeAdvantage: number;
  };
};

const HOME_COURT_ADVANTAGE = 2.5; // Points advantage for home team
const RECENT_FORM_WEIGHT = 0.35; // 35% weight to last 10 games
const SEASON_AVG_WEIGHT = 0.65; // 65% weight to season averages

/**
 * Predict game total using Four Factors approach
 */
export function predictGameTotal(
  homeTeam: TeamStats,
  awayTeam: TeamStats,
  isHomeTeamAtHome: boolean = true
): PredictionResult {
  // 1. Calculate expected pace
  const avgPace = (homeTeam.pace + awayTeam.pace) / 2;

  // 2. Blend season averages with recent form
  const homeOffense =
    homeTeam.points_per_game * SEASON_AVG_WEIGHT +
    homeTeam.last_10_avg_points * RECENT_FORM_WEIGHT;

  const homeDefense =
    homeTeam.points_allowed_per_game * SEASON_AVG_WEIGHT +
    homeTeam.last_10_avg_allowed * RECENT_FORM_WEIGHT;

  const awayOffense =
    awayTeam.points_per_game * SEASON_AVG_WEIGHT +
    awayTeam.last_10_avg_points * RECENT_FORM_WEIGHT;

  const awayDefense =
    awayTeam.points_allowed_per_game * SEASON_AVG_WEIGHT +
    awayTeam.last_10_avg_allowed * RECENT_FORM_WEIGHT;

  // 3. Project scores using offense vs defense matchup
  // Home team's score = (their offense + opponent's defense) / 2
  let predictedHomeScore = (homeOffense + awayDefense) / 2;
  let predictedAwayScore = (awayOffense + homeDefense) / 2;

  // 4. Apply home court advantage
  if (isHomeTeamAtHome) {
    predictedHomeScore += HOME_COURT_ADVANTAGE / 2;
    predictedAwayScore -= HOME_COURT_ADVANTAGE / 2;
  }

  // 5. Adjust for pace (faster pace = higher scores)
  const leagueAvgPace = 100; // NBA average
  const paceFactor = avgPace / leagueAvgPace;
  predictedHomeScore *= paceFactor;
  predictedAwayScore *= paceFactor;

  const predictedTotal = predictedHomeScore + predictedAwayScore;

  // 6. Calculate confidence based on data quality
  let confidence = 50;

  // More games played = more confidence
  const minGames = Math.min(homeTeam.games_played, awayTeam.games_played);
  confidence += Math.min(20, minGames * 0.8);

  // Recent form consistency
  const homeFormConsistency =
    1 - Math.abs(homeTeam.last_5_avg_points - homeTeam.last_10_avg_points) / homeTeam.points_per_game;
  const awayFormConsistency =
    1 - Math.abs(awayTeam.last_5_avg_points - awayTeam.last_10_avg_points) / awayTeam.points_per_game;
  const avgConsistency = (homeFormConsistency + awayFormConsistency) / 2;
  confidence += avgConsistency * 15;

  confidence = Math.round(Math.max(1, Math.min(95, confidence)));

  // 7. Build reasoning
  const homeFormTrend =
    homeTeam.last_5_avg_points > homeTeam.last_10_avg_points ? "improving" : "declining";
  const awayFormTrend =
    awayTeam.last_5_avg_points > awayTeam.last_10_avg_points ? "improving" : "declining";

  const reasoning = `🤖 STATISTICAL MODEL ANALYSIS:\n\n` +
    `📊 DATA SOURCE: Real team statistics from ${minGames} games\n` +
    `• Home Team Stats: ${homeTeam.points_per_game.toFixed(1)} season PPG, Last 10: ${homeTeam.last_10_avg_points.toFixed(1)} (${homeFormTrend})\n` +
    `• Away Team Stats: ${awayTeam.points_per_game.toFixed(1)} season PPG, Last 10: ${awayTeam.last_10_avg_points.toFixed(1)} (${awayFormTrend})\n` +
    `• Home Defense: Allowing ${homeTeam.points_allowed_per_game.toFixed(1)} PPG\n` +
    `• Away Defense: Allowing ${awayTeam.points_allowed_per_game.toFixed(1)} PPG\n\n` +
    `🧮 MODEL PREDICTION:\n` +
    `• Projected Home Score: ${predictedHomeScore.toFixed(1)}\n` +
    `• Projected Away Score: ${predictedAwayScore.toFixed(1)}\n` +
    `• TOTAL PREDICTION: ${predictedTotal.toFixed(1)} points\n` +
    `• Expected Pace: ${avgPace.toFixed(1)} possessions\n` +
    `• Home Court Bonus: +${HOME_COURT_ADVANTAGE} points\n\n` +
    `✅ Model confidence: ${confidence}% (based on ${(avgConsistency * 100).toFixed(0)}% form consistency)`;

  return {
    predictedTotal: Math.round(predictedTotal * 2) / 2, // Round to nearest 0.5
    predictedHomeScore: Math.round(predictedHomeScore * 2) / 2,
    predictedAwayScore: Math.round(predictedAwayScore * 2) / 2,
    confidenceScore: confidence,
    edge: 0, // Will be calculated when comparing to bookmaker line
    reasoning,
    modelFactors: {
      homeOffense: Math.round(homeOffense * 10) / 10,
      homeDefense: Math.round(homeDefense * 10) / 10,
      awayOffense: Math.round(awayOffense * 10) / 10,
      awayDefense: Math.round(awayDefense * 10) / 10,
      pace: Math.round(avgPace * 10) / 10,
      recentForm: `Home: ${homeFormTrend}, Away: ${awayFormTrend}`,
      homeAdvantage: HOME_COURT_ADVANTAGE,
    },
  };
}

/**
 * Compare prediction to bookmaker line and determine value
 */
export function evaluateValue(
  prediction: PredictionResult,
  bookmakerLine: number,
  odds: number
): {
  selection: "Over" | "Under";
  edge: number;
  adjustedConfidence: number;
  enhancedReasoning: string;
} {
  const diff = prediction.predictedTotal - bookmakerLine;
  const absDiff = Math.abs(diff);

  // Determine selection based on our prediction vs line
  const selection: "Over" | "Under" = diff > 0 ? "Over" : "Under";

  // Calculate edge
  // If we predict 220 and line is 215, we have 5 point edge
  // Each point is worth roughly 2-3% in win probability
  const edgePoints = selection === "Over" ? diff : -diff;
  const edgePercentage = edgePoints * 2.5; // 2.5% per point of edge

  // Implied probability from odds
  const impliedProb = 1 / odds;
  
  // Our estimated probability (simplified model)
  const ourProb = Math.min(0.95, Math.max(0.05, impliedProb + edgePercentage / 100));
  
  // Expected value
  const edge = (ourProb * odds - 1) * 100;

  // Adjust confidence based on edge size
  let adjustedConfidence = prediction.confidenceScore;
  
  // Bigger edge = more confidence
  if (absDiff >= 4) adjustedConfidence += 15;
  else if (absDiff >= 2.5) adjustedConfidence += 10;
  else if (absDiff >= 1.5) adjustedConfidence += 5;
  else adjustedConfidence -= 5; // Small edge = less confident

  // Price bonus
  if (odds >= 2.0 && odds <= 2.15) adjustedConfidence += 5;

  adjustedConfidence = Math.round(Math.max(1, Math.min(97, adjustedConfidence)));

  const enhancedReasoning =
    `📈 VALUE ANALYSIS:\n\n` +
    prediction.reasoning +
    `\n\n💰 BOOKMAKER vs MODEL:\n` +
    `• Bookmaker Line: ${bookmakerLine}\n` +
    `• Our Model Projects: ${prediction.predictedTotal.toFixed(1)}\n` +
    `• Difference: ${absDiff.toFixed(1)} points in favor of ${selection}\n` +
    `• Odds: ${odds.toFixed(2)} (implied ${(impliedProb * 100).toFixed(1)}% probability)\n` +
    `• Expected Edge: ${edge.toFixed(1)}%\n\n` +
    `${absDiff >= 3 ? "🔥 STRONG VALUE: Model shows significant disagreement with market!" : "💡 MODERATE VALUE: Small edge detected."}`;

  return {
    selection,
    edge,
    adjustedConfidence,
    enhancedReasoning,
  };
}

/**
 * Enhance a candidate with statistical prediction
 */
export function enhanceWithPrediction(
  candidate: Candidate,
  homeTeamStats: TeamStats | null,
  awayTeamStats: TeamStats | null
): Candidate & { prediction?: PredictionResult; modelEdge?: number } {
  if (!homeTeamStats || !awayTeamStats) {
    // No stats available, return original candidate
    return candidate;
  }

  // Generate prediction
  const prediction = predictGameTotal(homeTeamStats, awayTeamStats, true);

  // Evaluate against bookmaker line
  const evaluation = evaluateValue(prediction, candidate.line, candidate.odds);

  // Only take the bet if our model agrees with the selection
  const modelAgrees =
    (evaluation.selection === "Over" && candidate.selection === "Over") ||
    (evaluation.selection === "Under" && candidate.selection === "Under");

  if (!modelAgrees) {
    // Model disagrees - reduce confidence significantly
    return {
      ...candidate,
      confidence: Math.max(1, candidate.confidence - 30),
      reasoning: `Market suggests ${candidate.selection}, but our statistical model predicts ${evaluation.selection}. Conflicting signals reduce confidence.`,
      prediction,
      modelEdge: evaluation.edge,
    };
  }

  // Model agrees - enhance the pick
  return {
    ...candidate,
    confidence: evaluation.adjustedConfidence,
    reasoning: evaluation.enhancedReasoning,
    prediction,
    modelEdge: evaluation.edge,
  };
}
