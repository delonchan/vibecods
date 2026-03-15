import {
  HeadToHeadSnapshot,
  MatchIntelligenceSnapshot,
  ScoutMatch,
  ScoutMatchesResponse,
  TeamFormSnapshot,
  TeamSeasonStatsSnapshot,
} from "@/lib/types";

const FOOTBALL_DATA_BASE_URL =
  process.env.FOOTBALL_DATA_BASE_URL ?? "https://api.football-data.org/v4";
const FOOTBALL_DATA_API_KEY = process.env.FOOTBALL_DATA_API_KEY;

const COMPETITIONS = [
  { code: "PL", league: "Premier League" },
  { code: "SA", league: "Serie A" },
  { code: "PD", league: "La Liga" },
  { code: "BL1", league: "Bundesliga" },
  { code: "CL", league: "Champions League" },
] as const;

const EMPTY_FORM: TeamFormSnapshot = {
  last_5_form: [],
  recent_goals_scored: [],
  recent_goals_conceded: [],
};

const EMPTY_SEASON_STATS: TeamSeasonStatsSnapshot = {
  position: null,
  points: null,
  goals_scored_season: null,
  goals_conceded_season: null,
};

const EMPTY_HEAD_TO_HEAD: HeadToHeadSnapshot = {
  last_5_results: [],
  home_wins: 0,
  away_wins: 0,
  draws: 0,
  avg_goals_h2h: null,
};

const EMPTY_INTELLIGENCE: MatchIntelligenceSnapshot = {
  expected_goals: 0,
  btts_probability: 0,
  goal_environment: "low",
  predictability_score: 0,
};


interface FootballDataCompetitionMatchesResponse {
  matches?: Array<{
    status: string;
    utcDate: string;
    homeTeam: {
      id: number;
      name: string;
    };
    awayTeam: {
      id: number;
      name: string;
    };
    venue?: string | null;
  }>;
}

interface FootballDataTeamMatch {
  status: string;
  utcDate: string;
  homeTeam: {
    id: number;
    name?: string;
  };
  awayTeam: {
    id: number;
    name?: string;
  };
  score: {
    fullTime: {
      home: number | null;
      away: number | null;
    };
  };
}

interface FootballDataTeamMatchesResponse {
  matches?: FootballDataTeamMatch[];
}

interface FootballDataCompetitionStandingsResponse {
  standings?: Array<{
    table?: Array<{
      position: number;
      points: number;
      goalsFor: number;
      goalsAgainst: number;
      team: {
        id: number;
      };
    }>;
  }>;
}

interface ScheduledMatchBase {
  league: string;
  competition_code: string;
  home_team: string;
  away_team: string;
  home_team_id: number;
  away_team_id: number;
  match_date: string;
  venue: string | null;
}

interface CompetitionFetchResult {
  matches: ScheduledMatchBase[];
  standingsMap: Map<number, TeamSeasonStatsSnapshot>;
}

function getAuthHeaders(): HeadersInit {
  return {
    "X-Auth-Token": FOOTBALL_DATA_API_KEY ?? "",
  };
}

async function fetchFootballDataJson<T>(path: string): Promise<T> {
  const response = await fetch(`${FOOTBALL_DATA_BASE_URL}${path}`, {
    headers: getAuthHeaders(),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(
      `Failed request for ${path}: ${response.status} ${response.statusText}`,
    );
  }

  return (await response.json()) as T;
}

function isWithinNext48Hours(isoDate: string): boolean {
  const matchTime = new Date(isoDate).getTime();
  const now = Date.now();
  const fortyEightHoursMs = 48 * 60 * 60 * 1000;

  return matchTime >= now && matchTime <= now + fortyEightHoursMs;
}

function buildStandingsLookup(
  payload: FootballDataCompetitionStandingsResponse,
): Map<number, TeamSeasonStatsSnapshot> {
  const standingsMap = new Map<number, TeamSeasonStatsSnapshot>();

  for (const standings of payload.standings ?? []) {
    for (const tableRow of standings.table ?? []) {
      standingsMap.set(tableRow.team.id, {
        position: tableRow.position,
        points: tableRow.points,
        goals_scored_season: tableRow.goalsFor,
        goals_conceded_season: tableRow.goalsAgainst,
      });
    }
  }

  return standingsMap;
}

async function fetchCompetitionStandings(
  competitionCode: string,
): Promise<Map<number, TeamSeasonStatsSnapshot>> {
  const payload =
    await fetchFootballDataJson<FootballDataCompetitionStandingsResponse>(
      `/competitions/${competitionCode}/standings`,
    );

  return buildStandingsLookup(payload);
}

async function fetchCompetitionMatches(
  competitionCode: string,
  leagueName: string,
): Promise<CompetitionFetchResult> {
  const [matchesPayload, standingsMap] = await Promise.all([
    fetchFootballDataJson<FootballDataCompetitionMatchesResponse>(
      `/competitions/${competitionCode}/matches`,
    ),
    fetchCompetitionStandings(competitionCode),
  ]);

  const matches = (matchesPayload.matches ?? [])
    .filter(
      (match) =>
        match.status === "SCHEDULED" && isWithinNext48Hours(match.utcDate),
    )
    .map((match) => ({
      league: leagueName,
      competition_code: competitionCode,
      home_team: match.homeTeam.name,
      away_team: match.awayTeam.name,
      home_team_id: match.homeTeam.id,
      away_team_id: match.awayTeam.id,
      match_date: match.utcDate,
      venue: match.venue ?? null,
    }));

  return {
    matches,
    standingsMap,
  };
}

function computeTeamForm(
  teamId: number,
  matches: FootballDataTeamMatch[],
): TeamFormSnapshot {
  const finishedMatches = matches.filter((match) => match.status === "FINISHED");

  const last_5_form: Array<"W" | "D" | "L"> = [];
  const recent_goals_scored: number[] = [];
  const recent_goals_conceded: number[] = [];

  for (const match of finishedMatches) {
    const homeGoals = match.score.fullTime.home;
    const awayGoals = match.score.fullTime.away;

    if (homeGoals === null || awayGoals === null) {
      continue;
    }

    const isHome = match.homeTeam.id === teamId;
    const goalsScored = isHome ? homeGoals : awayGoals;
    const goalsConceded = isHome ? awayGoals : homeGoals;

    recent_goals_scored.push(goalsScored);
    recent_goals_conceded.push(goalsConceded);

    if (goalsScored > goalsConceded) {
      last_5_form.push("W");
    } else if (goalsScored < goalsConceded) {
      last_5_form.push("L");
    } else {
      last_5_form.push("D");
    }
  }

  return {
    last_5_form,
    recent_goals_scored,
    recent_goals_conceded,
  };
}

async function fetchTeamFinishedMatches(
  teamId: number,
  limit: number,
): Promise<FootballDataTeamMatch[]> {
  const payload = await fetchFootballDataJson<FootballDataTeamMatchesResponse>(
    `/teams/${teamId}/matches?status=FINISHED&limit=${limit}`,
  );

  return (payload.matches ?? []).filter((match) => match.status === "FINISHED");
}

async function fetchTeamForm(teamId: number): Promise<TeamFormSnapshot> {
  try {
    const matches = await fetchTeamFinishedMatches(teamId, 5);
    return computeTeamForm(teamId, matches);
  } catch {
    return EMPTY_FORM;
  }
}

function computeHeadToHeadFromMatches(
  homeTeamId: number,
  awayTeamId: number,
  fallbackHomeName: string,
  fallbackAwayName: string,
  homeTeamRecentMatches: FootballDataTeamMatch[],
): HeadToHeadSnapshot {
  const headToHeadMatches = homeTeamRecentMatches
    .filter((match) => {
      const isCurrentPairing =
        (match.homeTeam.id === homeTeamId && match.awayTeam.id === awayTeamId) ||
        (match.homeTeam.id === awayTeamId && match.awayTeam.id === homeTeamId);

      return isCurrentPairing;
    })
    .sort(
      (a, b) =>
        new Date(b.utcDate).getTime() - new Date(a.utcDate).getTime(),
    )
    .slice(0, 5);

  if (headToHeadMatches.length === 0) {
    return EMPTY_HEAD_TO_HEAD;
  }

  const last_5_results: HeadToHeadSnapshot["last_5_results"] = [];
  let home_wins = 0;
  let away_wins = 0;
  let draws = 0;
  let totalGoals = 0;

  for (const match of headToHeadMatches) {
    const homeGoals = match.score.fullTime.home;
    const awayGoals = match.score.fullTime.away;

    if (homeGoals === null || awayGoals === null) {
      continue;
    }

    totalGoals += homeGoals + awayGoals;

    if (homeGoals === awayGoals) {
      draws += 1;
    } else {
      const winnerId = homeGoals > awayGoals ? match.homeTeam.id : match.awayTeam.id;
      if (winnerId === homeTeamId) {
        home_wins += 1;
      } else if (winnerId === awayTeamId) {
        away_wins += 1;
      }
    }

    last_5_results.push({
      home_team: match.homeTeam.name ?? fallbackHomeName,
      away_team: match.awayTeam.name ?? fallbackAwayName,
      score: `${homeGoals}-${awayGoals}`,
      date: match.utcDate.slice(0, 10),
    });
  }

  if (last_5_results.length === 0) {
    return EMPTY_HEAD_TO_HEAD;
  }

  const avg_goals_h2h = Number((totalGoals / last_5_results.length).toFixed(2));

  return {
    last_5_results,
    home_wins,
    away_wins,
    draws,
    avg_goals_h2h,
  };
}

function average(values: number[]): number {
  if (!values.length) {
    return 0;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function computeFormPoints(form?: TeamFormSnapshot): number {
  return (form?.last_5_form ?? []).reduce((total, result) => {
    if (result === "W") {
      return total + 3;
    }

    if (result === "D") {
      return total + 1;
    }

    return total;
  }, 0);
}

function computeBttsRate(form?: TeamFormSnapshot): number {
  const scored = form?.recent_goals_scored ?? [];
  const conceded = form?.recent_goals_conceded ?? [];
  const sampleSize = Math.min(scored.length, conceded.length);

  if (sampleSize === 0) {
    return 0;
  }

  let bttsCount = 0;

  for (let index = 0; index < sampleSize; index += 1) {
    if (scored[index] > 0 && conceded[index] > 0) {
      bttsCount += 1;
    }
  }

  return bttsCount / sampleSize;
}

function computePredictabilityScore(match: ScoutMatch): number {
  const positionGap = Math.abs(
    (match.home_season_stats?.position ?? 0) -
      (match.away_season_stats?.position ?? 0),
  );
  const pointsGap = Math.abs(
    (match.home_season_stats?.points ?? 0) - (match.away_season_stats?.points ?? 0),
  );
  const formGap = Math.abs(
    computeFormPoints(match.home_form) - computeFormPoints(match.away_form),
  );
  const concededGap = Math.abs(
    average(match.home_form?.recent_goals_conceded ?? []) -
      average(match.away_form?.recent_goals_conceded ?? []),
  );

  const positionFactor = clamp(positionGap / 20, 0, 1);
  const pointsFactor = clamp(pointsGap / 30, 0, 1);
  const formFactor = clamp(formGap / 15, 0, 1);
  const concededFactor = clamp(concededGap / 2, 0, 1);

  const weightedScore =
    positionFactor * 0.35 +
    pointsFactor * 0.30 +
    formFactor * 0.20 +
    concededFactor * 0.15;

  return Math.round(clamp(weightedScore * 100, 0, 100));
}

function computeMatchIntelligence(match: ScoutMatch): MatchIntelligenceSnapshot {
  try {
    const homeAvgScored = average(match.home_form?.recent_goals_scored ?? []);
    const awayAvgConceded = average(match.away_form?.recent_goals_conceded ?? []);
    const awayAvgScored = average(match.away_form?.recent_goals_scored ?? []);
    const homeAvgConceded = average(match.home_form?.recent_goals_conceded ?? []);

    const expectedGoalsRaw =
      ((homeAvgScored + awayAvgConceded) + (awayAvgScored + homeAvgConceded)) / 2;
    const expected_goals = Number(expectedGoalsRaw.toFixed(2));

    const homeBttsRate = computeBttsRate(match.home_form);
    const awayBttsRate = computeBttsRate(match.away_form);
    const btts_probability = Number((((homeBttsRate + awayBttsRate) / 2) * 100).toFixed(2));

    let goal_environment: MatchIntelligenceSnapshot["goal_environment"] = "low";
    if (expected_goals > 2.7) {
      goal_environment = "high";
    } else if (expected_goals >= 2.0) {
      goal_environment = "medium";
    }

    const predictability_score = computePredictabilityScore(match);

    return {
      expected_goals,
      btts_probability,
      goal_environment,
      predictability_score,
    };
  } catch {
    return EMPTY_INTELLIGENCE;
  }
}

async function fetchHeadToHead(
  match: ScheduledMatchBase,
  teamFinishedMatchesCache: Map<number, Promise<FootballDataTeamMatch[]>>,
): Promise<HeadToHeadSnapshot> {
  try {
    if (!teamFinishedMatchesCache.has(match.home_team_id)) {
      teamFinishedMatchesCache.set(
        match.home_team_id,
        fetchTeamFinishedMatches(match.home_team_id, 20),
      );
    }

    const homeTeamMatches = await teamFinishedMatchesCache.get(match.home_team_id);
    return computeHeadToHeadFromMatches(
      match.home_team_id,
      match.away_team_id,
      match.home_team,
      match.away_team,
      homeTeamMatches ?? [],
    );
  } catch {
    return EMPTY_HEAD_TO_HEAD;
  }
}

function getSeasonStatsForTeam(
  teamId: number,
  standingsMap: Map<number, TeamSeasonStatsSnapshot>,
): TeamSeasonStatsSnapshot {
  return standingsMap.get(teamId) ?? EMPTY_SEASON_STATS;
}

async function addEnrichmentToMatch(
  match: ScheduledMatchBase,
  teamFormCache: Map<number, Promise<TeamFormSnapshot>>,
  standingsMap: Map<number, TeamSeasonStatsSnapshot>,
  teamFinishedMatchesCache: Map<number, Promise<FootballDataTeamMatch[]>>,
): Promise<ScoutMatch> {
  if (!teamFormCache.has(match.home_team_id)) {
    teamFormCache.set(match.home_team_id, fetchTeamForm(match.home_team_id));
  }

  if (!teamFormCache.has(match.away_team_id)) {
    teamFormCache.set(match.away_team_id, fetchTeamForm(match.away_team_id));
  }

  const [homeForm, awayForm, headToHead] = await Promise.all([
    teamFormCache.get(match.home_team_id),
    teamFormCache.get(match.away_team_id),
    fetchHeadToHead(match, teamFinishedMatchesCache),
  ]);

  return {
    ...match,
    home_form: homeForm ?? EMPTY_FORM,
    away_form: awayForm ?? EMPTY_FORM,
    home_season_stats: getSeasonStatsForTeam(match.home_team_id, standingsMap),
    away_season_stats: getSeasonStatsForTeam(match.away_team_id, standingsMap),
    head_to_head: headToHead,
    intelligence: computeMatchIntelligence({
      ...match,
      home_form: homeForm ?? EMPTY_FORM,
      away_form: awayForm ?? EMPTY_FORM,
      home_season_stats: getSeasonStatsForTeam(match.home_team_id, standingsMap),
      away_season_stats: getSeasonStatsForTeam(match.away_team_id, standingsMap),
      head_to_head: headToHead,
    }),
  };
}

export async function getScoutMatchesData(): Promise<ScoutMatchesResponse> {
  if (!FOOTBALL_DATA_API_KEY) {
    throw new Error("FOOTBALL_DATA_API_KEY is required.");
  }

  const results = await Promise.all(
    COMPETITIONS.map(async (competition) => {
      try {
        const result = await fetchCompetitionMatches(
          competition.code,
          competition.league,
        );

        return {
          code: competition.code,
          ...result,
        };
      } catch (error) {
        return {
          error:
            error instanceof Error
              ? error.message
              : `Unknown error for ${competition.code}`,
          code: competition.code,
        };
      }
    }),
  );

  const scheduledMatches: ScheduledMatchBase[] = [];
  const standingsByCompetition = new Map<
    string,
    Map<number, TeamSeasonStatsSnapshot>
  >();
  const errors: string[] = [];

  for (const result of results) {
    if ("matches" in result && "standingsMap" in result) {
      scheduledMatches.push(...result.matches);
      standingsByCompetition.set(result.code, result.standingsMap);
      continue;
    }

    errors.push(`${result.code}: ${result.error}`);
  }

  if (scheduledMatches.length === 0 && errors.length > 0) {
    throw new Error(`Unable to fetch matches. ${errors.join(" | ")}`);
  }

  const teamFormCache = new Map<number, Promise<TeamFormSnapshot>>();
  const teamFinishedMatchesCache = new Map<number, Promise<FootballDataTeamMatch[]>>();

  const matchesWithEnrichment = await Promise.all(
    scheduledMatches.map((match) =>
      addEnrichmentToMatch(
        match,
        teamFormCache,
        standingsByCompetition.get(match.competition_code) ?? new Map(),
        teamFinishedMatchesCache,
      ),
    ),
  );

  return {
    matches: matchesWithEnrichment.sort(
      (a, b) =>
        new Date(a.match_date).getTime() - new Date(b.match_date).getTime(),
    ),
  };
}
