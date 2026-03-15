"use client";

import {
  MatchIntelligenceSnapshot,
  PredictionRecord,
  ScoutMatch,
  ScoutMatchesResponse,
  ScoutPredictionMetrics,
  TeamFormSnapshot,
  TeamSeasonStatsSnapshot,
} from "@/lib/types";
import { useEffect, useMemo, useState } from "react";

interface ScoutHistoryResponse {
  history: PredictionRecord[];
  error?: string;
}

function formatForm(form?: TeamFormSnapshot): string {
  if (!form?.last_5_form?.length) {
    return "N/A";
  }

  return form.last_5_form.join(" ");
}

function statValue(value: number | null | undefined): string {
  if (value === null || value === undefined) {
    return "N/A";
  }

  return String(value);
}

function formatSeasonStats(stats?: TeamSeasonStatsSnapshot) {
  return {
    position: statValue(stats?.position),
    points: statValue(stats?.points),
    goalsScoredSeason: statValue(stats?.goals_scored_season),
    goalsConcededSeason: statValue(stats?.goals_conceded_season),
  };
}

function formatDate(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Unknown date";
  }

  return date.toLocaleString();
}

function formatMetric(value: number | null | undefined, suffix = ""): string {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "N/A";
  }

  return `${value}${suffix}`;
}

function formatPercent(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "N/A";
  }

  return `${value.toFixed(2)}%`;
}

function getGoalEnvironmentClass(intelligence?: MatchIntelligenceSnapshot): string {
  const goalEnvironment = intelligence?.goal_environment;

  if (goalEnvironment === "high") {
    return "env-high";
  }

  if (goalEnvironment === "medium") {
    return "env-medium";
  }

  return "env-low";
}

function getPredictabilityBand(score?: number): "low" | "medium" | "high" {
  if (score === undefined || score === null || Number.isNaN(score)) {
    return "low";
  }

  if (score >= 70) {
    return "high";
  }

  if (score >= 40) {
    return "medium";
  }

  return "low";
}

function getPredictabilityClass(score?: number): string {
  const band = getPredictabilityBand(score);

  if (band === "high") {
    return "predictability-high";
  }

  if (band === "medium") {
    return "predictability-medium";
  }

  return "predictability-low";
}

function boolCell(value: boolean | null): string {
  if (value === null) {
    return "N/A";
  }

  return value ? "Yes" : "No";
}

function MatchCard({ match }: { match: ScoutMatch }) {
  const homeStats = formatSeasonStats(match.home_season_stats);
  const awayStats = formatSeasonStats(match.away_season_stats);

  return (
    <article className="match-card">
      <header className="match-header">
        <div>
          <h3>
            {match.home_team} vs {match.away_team}
          </h3>
          <p className="meta-line">
            {match.league} ({match.competition_code})
          </p>
        </div>
        <div className="badge">{formatDate(match.match_date)}</div>
      </header>

      <div className="intelligence-compact" aria-label="compact-intelligence-summary">
        <span className="compact-pill">
          xG: {formatMetric(match.intelligence?.expected_goals)}
        </span>
        <span className="compact-pill">
          BTTS: {formatMetric(match.intelligence?.btts_probability, "%")}
        </span>
        <span className={`compact-pill ${getGoalEnvironmentClass(match.intelligence)}`}>
          Env: {match.intelligence?.goal_environment?.toUpperCase() ?? "N/A"}
        </span>
        <span
          className={`compact-pill ${getPredictabilityClass(
            match.intelligence?.predictability_score,
          )}`}
        >
          Predictability: {formatMetric(match.intelligence?.predictability_score)}
        </span>
      </div>

      <p className="meta-line">Venue: {match.venue ?? "TBD"}</p>

      <div className="enrichment-grid">
        <section className="enrichment-card">
          <h4>Recent Form</h4>
          <p>
            <strong>{match.home_team}:</strong> {formatForm(match.home_form)}
          </p>
          <p>
            <strong>{match.away_team}:</strong> {formatForm(match.away_form)}
          </p>
        </section>

        <section className="enrichment-card">
          <h4>Season Stats</h4>
          <div className="stat-row">
            <span>{match.home_team} Pos</span>
            <strong>{homeStats.position}</strong>
          </div>
          <div className="stat-row">
            <span>{match.away_team} Pos</span>
            <strong>{awayStats.position}</strong>
          </div>
          <div className="stat-row">
            <span>{match.home_team} Pts</span>
            <strong>{homeStats.points}</strong>
          </div>
          <div className="stat-row">
            <span>{match.away_team} Pts</span>
            <strong>{awayStats.points}</strong>
          </div>
          <div className="stat-row">
            <span>{match.home_team} GF</span>
            <strong>{homeStats.goalsScoredSeason}</strong>
          </div>
          <div className="stat-row">
            <span>{match.away_team} GF</span>
            <strong>{awayStats.goalsScoredSeason}</strong>
          </div>
          <div className="stat-row">
            <span>{match.home_team} GA</span>
            <strong>{homeStats.goalsConcededSeason}</strong>
          </div>
          <div className="stat-row">
            <span>{match.away_team} GA</span>
            <strong>{awayStats.goalsConcededSeason}</strong>
          </div>
        </section>

        <section className="enrichment-card">
          <h4>Head-to-Head Summary</h4>
          <div className="stat-row">
            <span>Home wins</span>
            <strong>{match.head_to_head?.home_wins ?? "N/A"}</strong>
          </div>
          <div className="stat-row">
            <span>Away wins</span>
            <strong>{match.head_to_head?.away_wins ?? "N/A"}</strong>
          </div>
          <div className="stat-row">
            <span>Draws</span>
            <strong>{match.head_to_head?.draws ?? "N/A"}</strong>
          </div>
          <div className="stat-row">
            <span>Avg goals (H2H)</span>
            <strong>{formatMetric(match.head_to_head?.avg_goals_h2h)}</strong>
          </div>
        </section>

        <section className="enrichment-card">
          <h4>Match Intelligence</h4>
          <div className="stat-row">
            <span>Expected Goals</span>
            <strong>{formatMetric(match.intelligence?.expected_goals)}</strong>
          </div>
          <div className="stat-row">
            <span>BTTS Probability</span>
            <strong>{formatMetric(match.intelligence?.btts_probability, "%")}</strong>
          </div>
          <div className="stat-row">
            <span>Goal Environment</span>
            <strong className={getGoalEnvironmentClass(match.intelligence)}>
              {match.intelligence?.goal_environment?.toUpperCase() ?? "N/A"}
            </strong>
          </div>
          <div className="stat-row">
            <span>Predictability Score</span>
            <strong className={getPredictabilityClass(match.intelligence?.predictability_score)}>
              {formatMetric(match.intelligence?.predictability_score)}
            </strong>
          </div>
        </section>
      </div>
    </article>
  );
}

export default function HomePage() {
  const [matches, setMatches] = useState<ScoutMatch[]>([]);
  const [metrics, setMetrics] = useState<ScoutPredictionMetrics | null>(null);
  const [history, setHistory] = useState<PredictionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadDashboard() {
      setLoading(true);
      setError(null);

      try {
        const [matchesResponse, metricsResponse, historyResponse] = await Promise.all([
          fetch("/api/scout", { cache: "no-store" }),
          fetch("/api/scout/metrics", { cache: "no-store" }),
          fetch("/api/scout/history", { cache: "no-store" }),
        ]);

        const matchesPayload = (await matchesResponse.json()) as ScoutMatchesResponse & {
          error?: string;
        };
        const metricsPayload = (await metricsResponse.json()) as ScoutPredictionMetrics & {
          error?: string;
        };
        const historyPayload = (await historyResponse.json()) as ScoutHistoryResponse;

        if (!matchesResponse.ok) {
          throw new Error(matchesPayload.error ?? "Unable to load scouting data.");
        }

        if (!metricsResponse.ok) {
          throw new Error(metricsPayload.error ?? "Unable to load scouting metrics.");
        }

        if (!historyResponse.ok) {
          throw new Error(historyPayload.error ?? "Unable to load prediction history.");
        }

        if (!active) {
          return;
        }

        setMatches(matchesPayload.matches ?? []);
        setMetrics(metricsPayload);
        setHistory(historyPayload.history ?? []);
      } catch (loadError) {
        if (!active) {
          return;
        }

        setError(
          loadError instanceof Error
            ? loadError.message
            : "Unable to load dashboard data.",
        );
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadDashboard();

    return () => {
      active = false;
    };
  }, []);

  const completedHistory = useMemo(
    () => history.filter((record) => record.correct_result !== null),
    [history],
  );

  const confidenceCounts = useMemo(() => {
    const high = completedHistory.filter(
      (record) => record.confidence_band === "high",
    ).length;
    const medium = completedHistory.filter(
      (record) => record.confidence_band === "medium",
    ).length;
    const low = completedHistory.filter((record) => record.confidence_band === "low").length;

    return { high, medium, low };
  }, [completedHistory]);

  const historyRows = useMemo(() => [...history].reverse().slice(0, 50), [history]);

  const titleText = useMemo(() => {
    if (loading) return "Loading scouting data...";
    if (error) return "Scouting data unavailable";
    return "Upcoming Match Scout Board";
  }, [loading, error]);

  const calibrationStatus = useMemo(() => {
    const high = metrics?.high_confidence_accuracy;
    const medium = metrics?.medium_confidence_accuracy;

    if (high === null || high === undefined || medium === null || medium === undefined) {
      return {
        label: "Calibration check unavailable",
        tone: "calibration-neutral",
      };
    }

    if (high > medium) {
      return {
        label: "High confidence is outperforming medium confidence",
        tone: "calibration-good",
      };
    }

    return {
      label: "Warning: High confidence accuracy is not better than medium confidence",
      tone: "calibration-warning",
    };
  }, [metrics?.high_confidence_accuracy, metrics?.medium_confidence_accuracy]);

  return (
    <main className="page">
      <section className="panel header-panel">
        <h1>Private Football Scouting Dashboard</h1>
        <p>{titleText}</p>
      </section>

      {loading ? (
        <section className="panel state-panel">Loading matches, metrics and history…</section>
      ) : null}

      {!loading && error ? (
        <section className="panel state-panel error-panel">
          Failed to load dashboard data: {error}
        </section>
      ) : null}

      {!loading && !error ? (
        <section className="panel metrics-panel">
          <h2>Prediction Metrics</h2>
          <div className="metrics-grid">
            <article className="metric-card">
              <h3>Overall Accuracy</h3>
              <p>{formatPercent(metrics?.overall_accuracy)}</p>
            </article>
            <article className="metric-card">
              <h3>Sample Size</h3>
              <p>{statValue(metrics?.sample_size)}</p>
            </article>
            <article className="metric-card">
              <h3>Last 20 Accuracy</h3>
              <p>{formatPercent(metrics?.last_20_accuracy)}</p>
            </article>
            <article className="metric-card">
              <h3>High Confidence Accuracy</h3>
              <p>{formatPercent(metrics?.high_confidence_accuracy)}</p>
              <span className="metric-sub">Sample: {confidenceCounts.high}</span>
            </article>
            <article className="metric-card">
              <h3>Medium Confidence Accuracy</h3>
              <p>{formatPercent(metrics?.medium_confidence_accuracy)}</p>
              <span className="metric-sub">Sample: {confidenceCounts.medium}</span>
            </article>
            <article className="metric-card">
              <h3>Low Confidence Accuracy</h3>
              <p>{formatPercent(metrics?.low_confidence_accuracy)}</p>
              <span className="metric-sub">Sample: {confidenceCounts.low}</span>
            </article>
          </div>
        </section>
      ) : null}


      {!loading && !error ? (
        <section className="panel calibration-panel">
          <h2>Calibration Summary</h2>
          <div className="calibration-grid">
            <div className="calibration-row">
              <span>High Confidence Accuracy</span>
              <strong>{formatPercent(metrics?.high_confidence_accuracy)}</strong>
              <span className="metric-sub">Samples: {confidenceCounts.high}</span>
            </div>
            <div className="calibration-row">
              <span>Medium Confidence Accuracy</span>
              <strong>{formatPercent(metrics?.medium_confidence_accuracy)}</strong>
              <span className="metric-sub">Samples: {confidenceCounts.medium}</span>
            </div>
            <div className="calibration-row">
              <span>Low Confidence Accuracy</span>
              <strong>{formatPercent(metrics?.low_confidence_accuracy)}</strong>
              <span className="metric-sub">Samples: {confidenceCounts.low}</span>
            </div>
          </div>
          <p className={`calibration-indicator ${calibrationStatus.tone}`}>
            {calibrationStatus.label}
          </p>
        </section>
      ) : null}

      {!loading && !error ? (
        <section className="panel history-panel">
          <h2>Prediction History</h2>
          {historyRows.length === 0 ? (
            <p className="state-panel">No prediction history available yet.</p>
          ) : (
            <div className="table-wrap">
              <table className="history-table">
                <thead>
                  <tr>
                    <th>Match</th>
                    <th>League</th>
                    <th>Match Date</th>
                    <th>Predicted Result</th>
                    <th>Confidence Band</th>
                    <th>Expected Goals</th>
                    <th>BTTS Probability</th>
                    <th>Final Score</th>
                    <th>Correct Result</th>
                    <th>Correct BTTS Signal</th>
                    <th>Correct Goal Environment</th>
                  </tr>
                </thead>
                <tbody>
                  {historyRows.map((record) => (
                    <tr key={record.match_id}>
                      <td>{record.home_team} vs {record.away_team}</td>
                      <td>{record.league}</td>
                      <td>{formatDate(record.match_date)}</td>
                      <td>{record.predicted_result ?? "N/A"}</td>
                      <td>{record.confidence_band ?? "N/A"}</td>
                      <td>{formatMetric(record.expected_goals)}</td>
                      <td>{formatMetric(record.btts_probability, "%")}</td>
                      <td>
                        {record.final_home_goals === null || record.final_away_goals === null
                          ? "N/A"
                          : `${record.final_home_goals}-${record.final_away_goals}`}
                      </td>
                      <td>{boolCell(record.correct_result)}</td>
                      <td>{boolCell(record.correct_btts_signal)}</td>
                      <td>{boolCell(record.correct_goal_environment)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      ) : null}

      {!loading && !error && matches.length === 0 ? (
        <section className="panel state-panel">No upcoming scheduled matches in the next 48 hours.</section>
      ) : null}

      {!loading && !error && matches.length > 0 ? (
        <section className="panel players-panel">
          <h2>Upcoming Matches ({matches.length})</h2>
          <div className="cards-grid">
            {matches.map((match) => (
              <MatchCard
                key={`${match.competition_code}-${match.home_team_id}-${match.away_team_id}-${match.match_date}`}
                match={match}
              />
            ))}
          </div>
        </section>
      ) : null}
    </main>
  );
}
