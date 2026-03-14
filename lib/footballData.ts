import { mockScoutData } from "@/lib/mockData";
import { ScoutDashboardData } from "@/lib/types";

const FOOTBALL_DATA_BASE_URL =
  process.env.FOOTBALL_DATA_BASE_URL ?? "https://api.football-data.org/v4";
const FOOTBALL_DATA_API_KEY = process.env.FOOTBALL_DATA_API_KEY;
const USE_MOCK_SCOUT_DATA = process.env.USE_MOCK_SCOUT_DATA !== "false";
const SCOUT_TEAM_ID = Number(process.env.SCOUT_TEAM_ID ?? "64");

function mapFootballDataToScoutDashboardData(): ScoutDashboardData {
  // Placeholder mapper for future integration.
  // Once endpoint contract is confirmed, map API responses to ScoutDashboardData.
  return {
    ...mockScoutData,
    team: {
      ...mockScoutData.team,
      id: SCOUT_TEAM_ID,
      lastUpdated: new Date().toISOString(),
    },
    dataSource: "football-data",
  };
}

export async function getScoutDashboardData(): Promise<ScoutDashboardData> {
  if (USE_MOCK_SCOUT_DATA) {
    return {
      ...mockScoutData,
      team: {
        ...mockScoutData.team,
        id: SCOUT_TEAM_ID,
        lastUpdated: new Date().toISOString(),
      },
    };
  }

  if (!FOOTBALL_DATA_API_KEY) {
    throw new Error(
      "FOOTBALL_DATA_API_KEY is required when USE_MOCK_SCOUT_DATA is false.",
    );
  }

  // Warm-up request to validate credentials and prepare future endpoint extension.
  await fetch(`${FOOTBALL_DATA_BASE_URL}/teams/${SCOUT_TEAM_ID}`, {
    headers: {
      "X-Auth-Token": FOOTBALL_DATA_API_KEY,
    },
    cache: "no-store",
  });

  return mapFootballDataToScoutDashboardData();
}
