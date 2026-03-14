export interface PlayerReport {
  id: number;
  name: string;
  position: string;
  age: number;
  nationality: string;
  marketValueEur: number;
  scoutingNotes: string;
  confidence: "low" | "medium" | "high";
}

export interface ScoutDashboardData {
  team: {
    id: number;
    name: string;
    competition: string;
    lastUpdated: string;
  };
  priorityNeeds: string[];
  players: PlayerReport[];
  dataSource: "mock" | "football-data";
}

export interface TeamFormSnapshot {
  last_5_form: Array<"W" | "D" | "L">;
  recent_goals_scored: number[];
  recent_goals_conceded: number[];
}

export interface TeamSeasonStatsSnapshot {
  position: number | null;
  points: number | null;
  goals_scored_season: number | null;
  goals_conceded_season: number | null;
}

export interface ScoutMatch {
  league: string;
  competition_code: string;
  home_team: string;
  away_team: string;
  home_team_id: number;
  away_team_id: number;
  match_date: string;
  venue: string | null;
  home_form: TeamFormSnapshot;
  away_form: TeamFormSnapshot;
  home_season_stats: TeamSeasonStatsSnapshot;
  away_season_stats: TeamSeasonStatsSnapshot;
}

export interface ScoutMatchesResponse {
  matches: ScoutMatch[];
}
