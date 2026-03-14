"use client";

import { ScoutMatch, ScoutMatchesResponse, TeamFormSnapshot, TeamSeasonStatsSnapshot } from "@/lib/types";
import { useEffect, useMemo, useState } from "react";

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
            <strong>{match.head_to_head?.avg_goals_h2h ?? "N/A"}</strong>
          </div>
        </section>
      </div>
    </article>
  );
}

export default function HomePage() {
  const [matches, setMatches] = useState<ScoutMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadMatches() {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/scout", { cache: "no-store" });
        const payload = (await response.json()) as ScoutMatchesResponse & {
          error?: string;
        };

        if (!response.ok) {
          throw new Error(payload.error ?? "Unable to load scouting data.");
        }

        if (!active) {
          return;
        }

        setMatches(payload.matches ?? []);
      } catch (loadError) {
        if (!active) {
          return;
        }

        setError(
          loadError instanceof Error
            ? loadError.message
            : "Unable to load scouting data.",
        );
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadMatches();

    return () => {
      active = false;
    };
  }, []);

  const titleText = useMemo(() => {
    if (loading) return "Loading scouting data...";
    if (error) return "Scouting data unavailable";
    return "Upcoming Match Scout Board";
  }, [loading, error]);

  return (
    <main className="page">
      <section className="panel header-panel">
        <h1>Private Football Scouting Dashboard</h1>
        <p>{titleText}</p>
      </section>

      {loading ? (
        <section className="panel state-panel">Loading matches from /api/scout…</section>
      ) : null}

      {!loading && error ? (
        <section className="panel state-panel error-panel">
          Failed to load scouting matches: {error}
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
