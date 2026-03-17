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

export interface HeadToHeadResult {
  home_team: string;
  away_team: string;
  score: string;
  date: string;
}

export interface HeadToHeadSnapshot {
  last_5_results: HeadToHeadResult[];
  home_wins: number;
  away_wins: number;
  draws: number;
  avg_goals_h2h: number | null;
}

export type PredictedResult = "home" | "draw" | "away";
export type ConfidenceBand = "low" | "medium" | "high";
export type ActualResult = "home" | "draw" | "away";

export interface MatchIntelligenceSnapshot {
  expected_goals: number;
  btts_probability: number;
  goal_environment: "low" | "medium" | "high";
  predictability_score: number;
  predicted_result: PredictedResult;
  confidence_band: ConfidenceBand;
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
  home_form?: TeamFormSnapshot;
  away_form?: TeamFormSnapshot;
  home_season_stats?: TeamSeasonStatsSnapshot;
  away_season_stats?: TeamSeasonStatsSnapshot;
  head_to_head?: HeadToHeadSnapshot;
  intelligence?: MatchIntelligenceSnapshot;
}

export interface ScoutMatchesResponse {
  matches: ScoutMatch[];
}

export type LeagueCode = "PL" | "PD" | "BL1" | "SA" | "CL";

export interface ScoutLeagueResponse {
  league_code: LeagueCode;
  league_name: string;
  last_updated: string;
  matches: ScoutMatch[];
}

export interface PredictionRecord {
  match_id: string;
  league: string;
  competition_code: string;
  home_team: string;
  away_team: string;
  home_team_id: number;
  away_team_id: number;
  match_date: string;
  generated_at: string;
  model_version: string;
  expected_goals: number;
  btts_probability: number;
  goal_environment: "low" | "medium" | "high";
  predictability_score: number;
  predicted_result: PredictedResult | null;
  confidence_band: ConfidenceBand | null;
  final_home_goals: number | null;
  final_away_goals: number | null;
  actual_result: ActualResult | null;
  btts: boolean | null;
  total_goals: number | null;
  completed_at: string | null;
  correct_result: boolean | null;
  correct_btts_signal: boolean | null;
  correct_goal_environment: boolean | null;
}

export interface ScoutPredictionMetrics {
  overall_accuracy: number | null;
  sample_size: number;
  high_confidence_accuracy: number | null;
  medium_confidence_accuracy: number | null;
  low_confidence_accuracy: number | null;
  last_20_accuracy: number | null;
}

export interface UpcomingPredictionRefreshSummary {
  generated_at: string;
  model_version: string;
  upcoming_matches: number;
  new_predictions_stored: number;
}

export interface PredictionEvaluationRefreshSummary {
  refreshed_at: string;
  newly_completed_predictions: number;
  evaluated_sample_size: number;
}
