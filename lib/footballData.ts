import {
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

interface FootballDataTeamMatchesResponse {
  matches?: Array<{
    status: string;
    homeTeam: {
      id: number;
    };
    awayTeam: {
      id: number;
    };
    score: {
      fullTime: {
        home: number | null;
        away: number | null;
      };
    };
  }>;
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
  matches: NonNullable<FootballDataTeamMatchesResponse["matches"]>,
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

async function fetchTeamForm(teamId: number): Promise<TeamFormSnapshot> {
  try {
    const payload = await fetchFootballDataJson<FootballDataTeamMatchesResponse>(
      `/teams/${teamId}/matches?status=FINISHED&limit=5`,
    );

    return computeTeamForm(teamId, payload.matches ?? []);
  } catch {
    return EMPTY_FORM;
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
): Promise<ScoutMatch> {
  if (!teamFormCache.has(match.home_team_id)) {
    teamFormCache.set(match.home_team_id, fetchTeamForm(match.home_team_id));
  }

  if (!teamFormCache.has(match.away_team_id)) {
    teamFormCache.set(match.away_team_id, fetchTeamForm(match.away_team_id));
  }

  const [homeForm, awayForm] = await Promise.all([
    teamFormCache.get(match.home_team_id),
    teamFormCache.get(match.away_team_id),
  ]);

  return {
    ...match,
    home_form: homeForm ?? EMPTY_FORM,
    away_form: awayForm ?? EMPTY_FORM,
    home_season_stats: getSeasonStatsForTeam(match.home_team_id, standingsMap),
    away_season_stats: getSeasonStatsForTeam(match.away_team_id, standingsMap),
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
  const standingsByCompetition = new Map<string, Map<number, TeamSeasonStatsSnapshot>>();
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
  const matchesWithFormAndSeason = await Promise.all(
    scheduledMatches.map((match) =>
      addEnrichmentToMatch(
        match,
        teamFormCache,
        standingsByCompetition.get(match.competition_code) ?? new Map(),
      ),
    ),
  );

  return {
    matches: matchesWithFormAndSeason.sort(
      (a, b) =>
        new Date(a.match_date).getTime() - new Date(b.match_date).getTime(),
    ),
  };
}
