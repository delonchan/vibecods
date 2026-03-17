import { ScoutDashboardData } from "@/lib/types";

export const mockScoutData: ScoutDashboardData = {
  team: {
    id: 64,
    name: "Liverpool FC",
    competition: "Premier League",
    lastUpdated: new Date().toISOString(),
  },
  priorityNeeds: [
    "Defensive midfielder with progressive passing",
    "Left-footed center back for high line coverage",
    "Press-resistant right winger",
  ],
  players: [
    {
      id: 1001,
      name: "Mats Haldorsen",
      position: "DM",
      age: 23,
      nationality: "Norway",
      marketValueEur: 28000000,
      scoutingNotes:
        "Strong duel win-rate and elite switch-pass profile. Needs adaptation to faster tempo.",
      confidence: "high",
    },
    {
      id: 1002,
      name: "Tomás Velasco",
      position: "CB",
      age: 21,
      nationality: "Argentina",
      marketValueEur: 22000000,
      scoutingNotes:
        "Excellent recovery pace and aerial timing. Passing volume trending up over last 10 matches.",
      confidence: "medium",
    },
    {
      id: 1003,
      name: "Rayan El Idrissi",
      position: "RW",
      age: 20,
      nationality: "Morocco",
      marketValueEur: 18500000,
      scoutingNotes:
        "1v1 specialist with high carry distance. Final-third decision making still inconsistent.",
      confidence: "medium",
    },
  ],
  dataSource: "mock",
};
