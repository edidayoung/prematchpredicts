const BASE = "https://api.the-odds-api.com/v4";

export type Candidate = {
  sportKey: string;
  sportTitle: string;
  eventId: string;
  homeTeam: string;
  awayTeam: string;
  commenceTime: string;
  selection: "Over" | "Under";
  line: number;
  odds: number;
  bookmaker: string;
  confidence: number;
  reasoning: string;
  edge: number;        // Percentage edge (e.g., 0.169 = 16.9%)
  adjustedWinProb: number;  // Fair win probability (e.g., 0.508 = 50.8%)
};

type Outcome = { name: string; price: number; point?: number };
type Market = { key: string; outcomes: Outcome[] };
type Bookmaker = { key: string; title: string; markets: Market[] };
type OddsEvent = {
  id: string;
  sport_key: string;
  sport_title: string;
  commence_time: string;
  home_team: string;
  away_team: string;
  bookmakers: Bookmaker[];
};
type SportEntry = { key: string; group: string; title: string; active: boolean; has_outrights: boolean };
type ScoreEvent = {
  id: string;
  sport_key?: string;
  commence_time?: string;
  home_team?: string;
  away_team?: string;
  completed: boolean;
  scores?: { name: string; score: string }[] | null;
};

/** One finished game, used to build each team's real scoring history. */
export type FinishedGame = {
  sportKey: string;
  eventId: string;
  commenceTime: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  total: number;
};

/** Rolling scoring form for one team, computed from past finished games. */
export type TeamForm = { games: number; avgFor: number; avgAgainst: number };
/** team form keyed by `${sportKey}|${team name}`, plus per-sport league averages. */
export type FormBook = {
  teams: Record<string, TeamForm>;
  leagueAvgTotal: Record<string, number>;
};

// The odds band the user bets in. Sweet spot pays a bonus in scoring.
export const MIN_ODDS = 1.9;
export const MAX_ODDS = 2.3;
const SWEET_MIN = 2.0;
const SWEET_MAX = 2.15;

// Minimum confidence threshold - reject picks below this level
export const MIN_CONFIDENCE = 85;


async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Odds API ${res.status}: ${await res.text()}`);
  return (await res.json()) as T;
}

export async function listBasketballSports(apiKey: string): Promise<SportEntry[]> {
  const all = await getJson<SportEntry[]>(`${BASE}/sports/?apiKey=${apiKey}`);
  return all.filter((s) => s.group === "Basketball" && s.active && !s.has_outrights);
}

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid]! : (sorted[mid - 1]! + sorted[mid]!) / 2;
}

function pairsFor(book: Bookmaker) {
  const totals = book.markets.find((m) => m.key === "totals");
  if (!totals) return null;
  const over = totals.outcomes.find((o) => o.name === "Over");
  const under = totals.outcomes.find((o) => o.name === "Under");
  if (!over || !under || over.point == null || under.point == null) return null;
  return { book, over, under, point: over.point };
}

/** Pull the last few days of finished games so team history keeps growing. */
export async function fetchRecentResults(apiKey: string, keys: string[]): Promise<FinishedGame[]> {
  const results = await Promise.allSettled(
    keys.map(async (k) => ({
      key: k,
      events: await getJson<ScoreEvent[]>(`${BASE}/sports/${k}/scores/?apiKey=${apiKey}&daysFrom=3`),
    })),
  );
  const games: FinishedGame[] = [];
  for (const r of results) {
    if (r.status !== "fulfilled") continue;
    for (const e of r.value.events) {
      if (!e.completed || !e.scores || !e.home_team || !e.away_team) continue;
      const home = Number(e.scores.find((s) => s.name === e.home_team)?.score);
      const away = Number(e.scores.find((s) => s.name === e.away_team)?.score);
      if (!Number.isFinite(home) || !Number.isFinite(away)) continue;
      games.push({
        sportKey: e.sport_key ?? r.value.key,
        eventId: e.id,
        commenceTime: e.commence_time ?? new Date().toISOString(),
        homeTeam: e.home_team,
        awayTeam: e.away_team,
        homeScore: home,
        awayScore: away,
        total: home + away,
      });
    }
  }
  return games;
}

/** Turn a list of finished games into per-team scoring form, newest games weighted most. */
export function buildFormBook(games: FinishedGame[]): FormBook {
  const acc: Record<string, { f: number; a: number; w: number; n: number }> = {};
  const league: Record<string, { t: number; n: number }> = {};
  const now = Date.now();

  for (const g of [...games].sort((a, b) => +new Date(a.commenceTime) - +new Date(b.commenceTime))) {
    const ageDays = Math.max(0, (now - +new Date(g.commenceTime)) / 86_400_000);
    const weight = Math.exp(-ageDays / 45); // a game from 45 days ago counts ~a third of a fresh one
    const add = (team: string, forPts: number, against: number) => {
      const key = `${g.sportKey}|${team}`;
      const cur = acc[key] ?? { f: 0, a: 0, w: 0, n: 0 };
      cur.f += forPts * weight;
      cur.a += against * weight;
      cur.w += weight;
      cur.n += 1;
      acc[key] = cur;
    };
    add(g.homeTeam, g.homeScore, g.awayScore);
    add(g.awayTeam, g.awayScore, g.homeScore);
    const l = league[g.sportKey] ?? { t: 0, n: 0 };
    l.t += g.total;
    l.n += 1;
    league[g.sportKey] = l;
  }

  const teams: Record<string, TeamForm> = {};
  for (const [key, v] of Object.entries(acc)) {
    teams[key] = { games: v.n, avgFor: v.f / v.w, avgAgainst: v.a / v.w };
  }
  const leagueAvgTotal: Record<string, number> = {};
  for (const [key, v] of Object.entries(league)) leagueAvgTotal[key] = v.t / v.n;
  return { teams, leagueAvgTotal };
}

function normalCdf(z: number): number {
  // Abramowitz & Stegun approximation, plenty accurate for this.
  const t = 1 / (1 + 0.2316419 * Math.abs(z));
  const d = 0.3989423 * Math.exp((-z * z) / 2);
  const p = d * t * (1.330274 * t ** 4 - 1.821256 * t ** 3 + 1.781478 * t * t - 0.356538 * t + 0.319382);
  return z > 0 ? 1 - p : p;
}

/** Expected combined score from the two teams' own history, or null without enough games. */
function projectTotal(event: OddsEvent, form: FormBook) {
  const home = form.teams[`${event.sport_key}|${event.home_team}`];
  const away = form.teams[`${event.sport_key}|${event.away_team}`];
  if (!home || !away) return null;
  const sample = Math.min(home.games, away.games);
  if (sample < 3) return null;

  const leagueAvg = form.leagueAvgTotal[event.sport_key];
  // Each side's projected score blends its own attack with the opponent's defence.
  const homeProj = (home.avgFor + away.avgAgainst) / 2;
  const awayProj = (away.avgFor + home.avgAgainst) / 2;
  let expected = homeProj + awayProj;
  // Small samples get pulled back toward the league average total.
  if (leagueAvg) {
    const shrink = Math.min(1, sample / 10);
    expected = expected * shrink + leagueAvg * (1 - shrink);
  }
  const sd = Math.max(4, expected * 0.14);
  return { expected, sd, sample, homeProj, awayProj, homeGames: home.games, awayGames: away.games };
}

function scoreEvent(
  event: OddsEvent,
  band = { min: MIN_ODDS, max: MAX_ODDS },
  form: FormBook = { teams: {}, leagueAvgTotal: {} },
): Candidate | null {

  const pairs = event.bookmakers.map(pairsFor).filter((p): p is NonNullable<typeof p> => p !== null);
  if (pairs.length < 2) return null;

  const consensusLine = median(pairs.map((p) => p.point));
  // De-vigged consensus probability that the game goes Over the market line.
  const fairOvers = pairs.map((p) => {
    const io = 1 / p.over.price;
    const iu = 1 / p.under.price;
    return io / (io + iu);
  });
  const fairOver = fairOvers.reduce((a, b) => a + b, 0) / fairOvers.length;
  const spread = Math.max(...pairs.map((p) => p.point)) - Math.min(...pairs.map((p) => p.point));

  let best: Candidate | null = null;

  for (const p of pairs) {
    for (const side of ["Over", "Under"] as const) {
      const outcome = side === "Over" ? p.over : p.under;
      const price = outcome.price;
      if (price < band.min || price > band.max) continue;

      // Line advantage: a shorter line helps Over, a longer line helps Under.
      const lineEdge = side === "Over" ? consensusLine - p.point : p.point - consensusLine;
      const fair = side === "Over" ? fairOver : 1 - fairOver;
      // Each point of line advantage is worth roughly 2% of win probability.
      const adjusted = Math.min(0.95, Math.max(0.05, fair + lineEdge * 0.02));
      const edge = adjusted * price - 1;

      let confidence = 50 + edge * 260 + lineEdge * 3;
      if (price >= SWEET_MIN && price <= SWEET_MAX) confidence += 6;
      confidence += Math.min(8, pairs.length); // more books quoting = more trustworthy
      confidence -= Math.min(10, spread * 2); // books disagreeing on the total = noise
      confidence = Math.round(Math.max(1, Math.min(97, confidence)));

      const reasoning =
        `${pairs.length} bookmakers price this game, settling around a ${consensusLine} total. ` +
        `${p.book.title} is offering ${side} ${p.point} at ${price.toFixed(2)}, ` +
        (lineEdge > 0
          ? `which is ${lineEdge.toFixed(1)} points friendlier than the market consensus. `
          : lineEdge < 0
            ? `slightly against the consensus line. `
            : `right on the consensus line. `) +
        `Fair win chance works out at ${(adjusted * 100).toFixed(1)}%, ` +
        `so the price carries a ${(edge * 100).toFixed(1)}% edge. ` +
        `Bookmaker agreement on the total: ${spread === 0 ? "unanimous" : `${spread.toFixed(1)} points apart`}.`;

      if (!best || confidence > best.confidence) {
        best = {
          sportKey: event.sport_key,
          sportTitle: event.sport_title,
          eventId: event.id,
          homeTeam: event.home_team,
          awayTeam: event.away_team,
          commenceTime: event.commence_time,
          selection: side,
          line: p.point,
          odds: price,
          bookmaker: p.book.title,
          confidence,
          reasoning,
          edge,                    // Store the edge value
          adjustedWinProb: adjusted, // Store the fair win probability
        };
      }
    }
  }

  return best;
}

async function fetchScored(
  apiKey: string,
  keys: string[],
  band: { min: number; max: number },
): Promise<{ start: number; candidate: Candidate }[]> {
  const results = await Promise.allSettled(
    keys.map((k) =>
      getJson<OddsEvent[]>(
        `${BASE}/sports/${k}/odds/?apiKey=${apiKey}&regions=eu,uk,us&markets=totals&oddsFormat=decimal`,
      ),
    ),
  );
  const scored: { start: number; candidate: Candidate }[] = [];
  for (const r of results) {
    if (r.status !== "fulfilled") continue;
    for (const event of r.value) {
      const candidate = scoreEvent(event, band);
      if (candidate) scored.push({ start: new Date(event.commence_time).getTime(), candidate });
    }
  }
  return scored;
}

// Sports checked for picks (all checked together, no priority - highest confidence wins)
const FALLBACK_GROUPS = [
  "Soccer",
  "Basketball",
  "American Football",
  "Ice Hockey",
  "Baseball",
  "Rugby League",
  "Aussie Rules",
  "Cricket",
];

/** Rank today's candidates across ALL sports, picking the absolute best regardless of sport. */
export async function findCandidates(apiKey: string, dayIso: string): Promise<Candidate[]> {
  const all = await getJson<SportEntry[]>(`${BASE}/sports/?apiKey=${apiKey}`);
  const active = all.filter((s) => s.active && !s.has_outrights);
  const dayStart = new Date(`${dayIso}T00:00:00Z`).getTime();
  const dayEnd = dayStart + 36 * 60 * 60 * 1000; // today plus overnight tip-offs
  const now = Date.now();

  const inDay = (s: { start: number }) => s.start >= Math.max(dayStart, now) && s.start <= dayEnd;

  // Collect ALL sport keys - Soccer prioritized, but ALL checked together
  const soccer = active.filter((s) => s.group === "Soccer").map((s) => s.key);
  const otherSports = FALLBACK_GROUPS.filter(g => g !== "Soccer")
    .flatMap((g) => active.filter((s) => s.group === g).map((s) => s.key))
    .slice(0, 20);
  
  // Combine all sports - they'll ALL be compared by confidence
  const allSportKeys = [...soccer, ...otherSports];
  
  console.log(`[FIND_CANDIDATES] Checking ${allSportKeys.length} sports for ${dayIso}`);
  
  if (allSportKeys.length === 0) return [];

  // Fetch and score ALL sports at once (no tiers - pure confidence comparison)
  const scored = await fetchScored(apiKey, allSportKeys, { min: MIN_ODDS, max: MAX_ODDS });
  const todays = scored.filter(inDay);
  
  console.log(`[FIND_CANDIDATES] Found ${todays.length} games today across all sports`);
  
  if (todays.length === 0) return [];
  
  // Log all candidates before filtering
  todays.forEach(s => {
    console.log(`[CANDIDATE] ${s.candidate.sportTitle}: ${s.candidate.awayTeam} @ ${s.candidate.homeTeam} - ${s.candidate.confidence}% confidence | Edge: ${(s.candidate.edge * 100).toFixed(1)}% | Win Prob: ${(s.candidate.adjustedWinProb * 100).toFixed(1)}%`);
  });
  
  // Filter by confidence threshold and sort with hybrid tiebreaker
  const qualified = todays
    .map((s) => s.candidate)
    .filter((c) => c.confidence >= MIN_CONFIDENCE)
    .sort((a, b) => {
      // Primary sort: Higher confidence wins
      if (b.confidence !== a.confidence) {
        return b.confidence - a.confidence;
      }
      
      // Tiebreaker: When confidence is equal
      const edgeDiff = Math.abs(b.edge - a.edge);
      
      // If edge difference is significant (>2%), pick higher edge (better value)
      if (edgeDiff > 0.02) {
        return b.edge - a.edge;
      }
      
      // If edges are close, pick higher win probability (safer)
      return b.adjustedWinProb - a.adjustedWinProb;
    });
  
  console.log(`[FIND_CANDIDATES] ${qualified.length} picks qualify (>= ${MIN_CONFIDENCE}% confidence)`);
  
  if (qualified.length > 0) {
    const winner = qualified[0];
    console.log(`[SELECTED] ${winner.sportTitle}: ${winner.awayTeam} @ ${winner.homeTeam}`);
    console.log(`  ├─ Confidence: ${winner.confidence}%`);
    console.log(`  ├─ Edge: ${(winner.edge * 100).toFixed(1)}%`);
    console.log(`  ├─ Win Probability: ${(winner.adjustedWinProb * 100).toFixed(1)}%`);
    console.log(`  └─ Odds: ${winner.odds.toFixed(2)}`);
    
    // Show runner-ups if there were ties
    const tiedPicks = qualified.filter(p => p.confidence === winner.confidence);
    if (tiedPicks.length > 1) {
      console.log(`[TIEBREAKER] ${tiedPicks.length} picks had ${winner.confidence}% confidence:`);
      tiedPicks.forEach((pick, idx) => {
        const symbol = idx === 0 ? '✓' : '✗';
        console.log(`  ${symbol} ${pick.sportTitle}: Edge ${(pick.edge * 100).toFixed(1)}% | Win Prob ${(pick.adjustedWinProb * 100).toFixed(1)}%`);
      });
    }
  } else {
    console.log(`[SELECTED] No picks meet the ${MIN_CONFIDENCE}% confidence threshold today`);
  }
  
  return qualified;
}


/** Final combined score for a finished game, or null when it is not settled yet. */
export async function fetchFinalTotal(
  apiKey: string,
  sportKey: string,
  eventId: string,
): Promise<number | null> {
  try {
    console.log(`[FETCH_FINAL_TOTAL] Requesting scores for sport: ${sportKey}, event: ${eventId}`);
    const url = `${BASE}/sports/${sportKey}/scores/?apiKey=${apiKey}&daysFrom=3`;
    
    const events = await getJson<ScoreEvent[]>(url);
    console.log(`[FETCH_FINAL_TOTAL] Received ${events?.length ?? 0} events from API`);
    
    const match = events.find((e) => e.id === eventId);
    
    if (!match) {
      console.log(`[FETCH_FINAL_TOTAL] ❌ Event ${eventId} not found in API response`);
      return null;
    }
    
    console.log(`[FETCH_FINAL_TOTAL] Found event: ${match.home_team} vs ${match.away_team}`);
    console.log(`[FETCH_FINAL_TOTAL] Completed: ${match.completed}, Has scores: ${!!match.scores}`);
    
    if (!match.completed) {
      console.log(`[FETCH_FINAL_TOTAL] ⏳ Game not completed yet`);
      return null;
    }
    
    if (!match.scores) {
      console.log(`[FETCH_FINAL_TOTAL] ❌ No scores available`);
      return null;
    }
    
    const total = match.scores.reduce((sum, s) => sum + Number(s.score ?? 0), 0);
    console.log(`[FETCH_FINAL_TOTAL] ✅ Total score calculated: ${total}`);
    
    // Accept 0 as valid (scoreless draws in soccer), just check it's a finite number
    return Number.isFinite(total) && total >= 0 ? total : null;
  } catch (error) {
    console.error(`[FETCH_FINAL_TOTAL] ❌ Error:`, error);
    return null;
  }
}
