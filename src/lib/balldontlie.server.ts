// BallDontLie API Integration for NBA Stats
const BASE_URL = "https://api.balldontlie.io/v1";

type BallDontLieTeam = {
  id: number;
  conference: string;
  division: string;
  city: string;
  name: string;
  full_name: string;
  abbreviation: string;
};

type BallDontLieGame = {
  id: number;
  date: string;
  season: number;
  status: string;
  home_team: BallDontLieTeam;
  visitor_team: BallDontLieTeam;
  home_team_score: number;
  visitor_team_score: number;
};

type BallDontLieStats = {
  id: number;
  min: string | null;
  fgm: number;
  fga: number;
  fg3m: number;
  fg3a: number;
  ftm: number;
  fta: number;
  oreb: number;
  dreb: number;
  reb: number;
  ast: number;
  stl: number;
  blk: number;
  turnover: number;
  pf: number;
  pts: number;
  team: BallDontLieTeam;
  player: {
    id: number;
    first_name: string;
    last_name: string;
    position: string;
    team: BallDontLieTeam;
  };
  game: BallDontLieGame;
};

async function fetchBallDontLie<T>(endpoint: string, apiKey: string): Promise<T> {
  const url = `${BASE_URL}${endpoint}`;
  const res = await fetch(url, {
    headers: {
      Authorization: apiKey,
    },
  });

  if (!res.ok) {
    throw new Error(`BallDontLie API error ${res.status}: ${await res.text()}`);
  }

  return (await res.json()) as T;
}

/**
 * Fetch all NBA teams
 */
export async function fetchAllTeams(apiKey: string): Promise<BallDontLieTeam[]> {
  const response = await fetchBallDontLie<{ data: BallDontLieTeam[] }>(
    "/teams?per_page=30",
    apiKey
  );
  return response.data;
}

/**
 * Fetch recent games for analysis
 * @param apiKey BallDontLie API key
 * @param season Season year (e.g., 2024)
 * @param startDate Start date YYYY-MM-DD
 * @param endDate End date YYYY-MM-DD
 */
export async function fetchGames(
  apiKey: string,
  season: number,
  startDate?: string,
  endDate?: string
): Promise<BallDontLieGame[]> {
  let endpoint = `/games?seasons[]=${season}&per_page=100`;
  if (startDate) endpoint += `&start_date=${startDate}`;
  if (endDate) endpoint += `&end_date=${endDate}`;

  const response = await fetchBallDontLie<{ data: BallDontLieGame[]; meta: any }>(
    endpoint,
    apiKey
  );
  return response.data;
}

/**
 * Fetch game stats for detailed analysis
 */
export async function fetchGameStats(
  apiKey: string,
  gameIds: number[]
): Promise<BallDontLieStats[]> {
  const allStats: BallDontLieStats[] = [];
  
  // Fetch in batches to avoid rate limits
  for (const gameId of gameIds.slice(0, 25)) { // Limit to 25 games at once
    try {
      const response = await fetchBallDontLie<{ data: BallDontLieStats[] }>(
        `/stats?game_ids[]=${gameId}&per_page=100`,
        apiKey
      );
      allStats.push(...response.data);
    } catch (error) {
      console.error(`Error fetching stats for game ${gameId}:`, error);
    }
  }

  return allStats;
}

/**
 * Calculate team statistics from recent games
 */
export function calculateTeamStats(games: BallDontLieGame[], teamId: number) {
  const teamGames = games.filter(
    (g) =>
      g.home_team.id === teamId ||
      g.visitor_team.id === teamId
  );

  if (teamGames.length === 0) {
    return null;
  }

  let totalPoints = 0;
  let totalPointsAllowed = 0;
  let homeWins = 0;
  let homeLosses = 0;
  let awayWins = 0;
  let awayLosses = 0;

  // Last 5 and 10 games tracking
  const recentGames = teamGames.slice(-10);
  const last5Games = teamGames.slice(-5);

  for (const game of teamGames) {
    const isHome = game.home_team.id === teamId;
    const teamScore = isHome ? game.home_team_score : game.visitor_team_score;
    const opponentScore = isHome ? game.visitor_team_score : game.home_team_score;

    totalPoints += teamScore;
    totalPointsAllowed += opponentScore;

    const won = teamScore > opponentScore;
    if (isHome) {
      if (won) homeWins++;
      else homeLosses++;
    } else {
      if (won) awayWins++;
      else awayLosses++;
    }
  }

  const last5AvgPoints =
    last5Games.reduce((sum, g) => {
      const score =
        g.home_team.id === teamId ? g.home_team_score : g.visitor_team_score;
      return sum + score;
    }, 0) / last5Games.length;

  const last5AvgAllowed =
    last5Games.reduce((sum, g) => {
      const score =
        g.home_team.id === teamId ? g.visitor_team_score : g.home_team_score;
      return sum + score;
    }, 0) / last5Games.length;

  const last10AvgPoints =
    recentGames.reduce((sum, g) => {
      const score =
        g.home_team.id === teamId ? g.home_team_score : g.visitor_team_score;
      return sum + score;
    }, 0) / recentGames.length;

  const last10AvgAllowed =
    recentGames.reduce((sum, g) => {
      const score =
        g.home_team.id === teamId ? g.visitor_team_score : g.home_team_score;
      return sum + score;
    }, 0) / recentGames.length;

  return {
    gamesPlayed: teamGames.length,
    pointsPerGame: totalPoints / teamGames.length,
    pointsAllowedPerGame: totalPointsAllowed / teamGames.length,
    homeRecord: `${homeWins}-${homeLosses}`,
    awayRecord: `${awayWins}-${awayLosses}`,
    last5AvgPoints,
    last5AvgAllowed,
    last10AvgPoints,
    last10AvgAllowed,
  };
}

/**
 * Get current NBA season year
 */
export function getCurrentSeason(): number {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1; // 0-indexed
  
  // NBA season starts in October
  // If before October, we're in the previous season
  return month >= 10 ? year : year - 1;
}
