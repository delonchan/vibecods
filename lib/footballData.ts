import { ScoutMatch, ScoutMatchesResponse } from "@/lib/types";

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

interface FootballDataMatchesResponse {
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

function isWithinNext48Hours(isoDate: string): boolean {
  const matchTime = new Date(isoDate).getTime();
  const now = Date.now();
  const fortyEightHoursMs = 48 * 60 * 60 * 1000;

  return matchTime >= now && matchTime <= now + fortyEightHoursMs;
}

async function fetchCompetitionMatches(
  competitionCode: string,
  leagueName: string,
): Promise<ScoutMatch[]> {
  const response = await fetch(
    `${FOOTBALL_DATA_BASE_URL}/competitions/${competitionCode}/matches`,
    {
      headers: {
        "X-Auth-Token": FOOTBALL_DATA_API_KEY ?? "",
      },
      cache: "no-store",
    },
  );

  if (!response.ok) {
    throw new Error(
      `Failed to fetch ${competitionCode} matches: ${response.status} ${response.statusText}`,
    );
  }

  const payload = (await response.json()) as FootballDataMatchesResponse;
  const matches = payload.matches ?? [];

  return matches
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
}

export async function getScoutMatchesData(): Promise<ScoutMatchesResponse> {
  if (!FOOTBALL_DATA_API_KEY) {
    throw new Error("FOOTBALL_DATA_API_KEY is required.");
  }

  const results = await Promise.all(
    COMPETITIONS.map(async (competition) => {
      try {
        return await fetchCompetitionMatches(
          competition.code,
          competition.league,
        );
      } catch (error) {
        return {
          error:
            error instanceof Error
              ? error.message
              : `Unknown error for ${competition.code}`,
          code: competition.code,
          matches: [] as ScoutMatch[],
        };
      }
    }),
  );

  const flattenedMatches: ScoutMatch[] = [];
  const errors: string[] = [];

  for (const result of results) {
    if (Array.isArray(result)) {
      flattenedMatches.push(...result);
      continue;
    }

    errors.push(`${result.code}: ${result.error}`);
  }

  if (flattenedMatches.length === 0 && errors.length > 0) {
    throw new Error(`Unable to fetch matches. ${errors.join(" | ")}`);
  }

  return {
    matches: flattenedMatches.sort(
      (a, b) =>
        new Date(a.match_date).getTime() - new Date(b.match_date).getTime(),
    ),
  };
}
