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
