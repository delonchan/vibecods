import { ScoutDashboardData } from "@/lib/types";

async function getDashboardData(): Promise<ScoutDashboardData> {
  const response = await fetch("http://localhost:3000/api/scout", {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Unable to load scouting dashboard data.");
  }

  return response.json();
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(value);
}

export default async function HomePage() {
  const data = await getDashboardData();

  return (
    <main className="page">
      <section className="panel header-panel">
        <h1>Private Football Scouting Dashboard</h1>
        <p>
          Team: <strong>{data.team.name}</strong> · Competition: {data.team.competition}
        </p>
        <p>
          Data source: <span className="badge">{data.dataSource}</span> · Last sync:{" "}
          {new Date(data.team.lastUpdated).toLocaleString()}
        </p>
      </section>

      <section className="panel needs-panel">
        <h2>Priority Recruitment Needs</h2>
        <ul>
          {data.priorityNeeds.map((need) => (
            <li key={need}>{need}</li>
          ))}
        </ul>
      </section>

      <section className="panel players-panel">
        <h2>Scouting Shortlist</h2>
        <div className="cards-grid">
          {data.players.map((player) => (
            <article key={player.id} className="player-card">
              <header>
                <h3>{player.name}</h3>
                <span className="position">{player.position}</span>
              </header>
              <p>
                {player.age} · {player.nationality}
              </p>
              <p className="value">{formatCurrency(player.marketValueEur)}</p>
              <p>{player.scoutingNotes}</p>
              <p>
                Confidence: <strong>{player.confidence}</strong>
              </p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
