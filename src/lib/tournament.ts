// Tournament Mode — multi-round competition with point accumulation
import type { AITeam } from "./teams";

export interface TournamentRound {
  roundNumber: number;
  teams: AITeam[];
  scenarioLabel: string;
  timestamp: number;
}

export interface TournamentStanding {
  teamId: string;
  teamName: string;
  philosophy: string;
  totalPoints: number;
  wins: number;
  rounds: number;
  avgScore: number;
  bestScore: number;
  roundScores: number[]; // score per round
}

export interface TournamentState {
  isActive: boolean;
  totalRounds: number;
  completedRounds: TournamentRound[];
  standings: TournamentStanding[];
  isRunning: boolean;
  currentRoundIndex: number;
}

export const INITIAL_TOURNAMENT: TournamentState = {
  isActive: false,
  totalRounds: 5,
  completedRounds: [],
  standings: [],
  isRunning: false,
  currentRoundIndex: 0,
};

// Points: 1st=10, 2nd=6, 3rd=3, 4th=1
const POINTS = [10, 6, 3, 1];

export function scoreTournamentRound(
  round: TournamentRound,
  existingStandings: TournamentStanding[]
): TournamentStanding[] {
  const sorted = [...round.teams].sort((a, b) => b.result.score - a.result.score);

  // Clone or init standings
  const standingsMap = new Map<string, TournamentStanding>();
  existingStandings.forEach(s => standingsMap.set(s.teamId, { ...s }));

  sorted.forEach((team, rank) => {
    const pts = POINTS[rank] ?? 0;
    const existing = standingsMap.get(team.id);
    if (existing) {
      existing.totalPoints += pts;
      existing.wins += rank === 0 ? 1 : 0;
      existing.rounds += 1;
      existing.roundScores.push(team.result.score);
      existing.bestScore = Math.max(existing.bestScore, team.result.score);
      existing.avgScore = existing.roundScores.reduce((a, b) => a + b, 0) / existing.roundScores.length;
    } else {
      standingsMap.set(team.id, {
        teamId: team.id,
        teamName: team.name,
        philosophy: team.philosophy,
        totalPoints: pts,
        wins: rank === 0 ? 1 : 0,
        rounds: 1,
        avgScore: team.result.score,
        bestScore: team.result.score,
        roundScores: [team.result.score],
      });
    }
  });

  return [...standingsMap.values()].sort((a, b) => b.totalPoints - a.totalPoints);
}
