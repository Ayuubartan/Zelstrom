import { useState } from "react";
import { Trophy, Play, RotateCcw, Crown, Medal, Award, Star, ChevronDown, ChevronUp, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import type { TournamentState, TournamentRound } from "@/lib/tournament";

interface TournamentPanelProps {
  tournament: TournamentState;
  isRunning: boolean;
  onStart: () => void;
  onReset: () => void;
}

const RANK_ICONS = [Crown, Medal, Award, Star];
const RANK_COLORS = [
  "text-yellow-400",
  "text-zinc-300",
  "text-amber-600",
  "text-muted-foreground",
];
const POINTS_MAP = [10, 6, 3, 1];

export function TournamentPanel({ tournament, isRunning, onStart, onReset }: TournamentPanelProps) {
  const [showHistory, setShowHistory] = useState(false);
  const { isActive, totalRounds, completedRounds, standings } = tournament;
  const progress = (completedRounds.length / totalRounds) * 100;
  const isComplete = completedRounds.length >= totalRounds;
  const champion = isComplete && standings.length > 0 ? standings[0] : null;

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Trophy className="w-4 h-4 text-primary" />
          <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-foreground">
            Tournament Mode
          </h3>
          {isActive && (
            <Badge variant="secondary" className="text-[8px] font-mono h-4 px-1.5">
              {completedRounds.length}/{totalRounds} rounds
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          {!isActive && (
            <Button onClick={onStart} disabled={isRunning} size="sm" className="gap-1.5 font-mono text-xs">
              <Play className="w-3.5 h-3.5" />
              {isRunning ? "Starting..." : "Start Tournament (5 rounds)"}
            </Button>
          )}
          {isActive && !isComplete && (
            <span className="text-[9px] font-mono text-primary animate-pulse">
              {isRunning ? `Running round ${completedRounds.length + 1}...` : "Waiting..."}
            </span>
          )}
          {completedRounds.length > 0 && (
            <Button
              onClick={() => setShowHistory(h => !h)}
              variant="outline"
              size="sm"
              className="gap-1 font-mono text-xs"
            >
              <History className="w-3 h-3" />
              History
              {showHistory ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </Button>
          )}
          {isActive && (
            <Button onClick={onReset} variant="ghost" size="sm" className="gap-1 font-mono text-xs text-muted-foreground">
              <RotateCcw className="w-3 h-3" />
              Reset
            </Button>
          )}
        </div>
      </div>

      {/* Progress bar */}
      {isActive && (
        <div className="px-4 pt-3">
          <Progress value={progress} className="h-1.5" />
        </div>
      )}

      {/* Champion banner */}
      {champion && (
        <div className="mx-4 mt-3 p-3 rounded-lg bg-primary/10 border border-primary/30 glow-cyan text-center">
          <Crown className="w-5 h-5 text-primary mx-auto mb-1" />
          <p className="text-xs font-mono font-bold text-foreground">{champion.teamName} wins the tournament!</p>
          <p className="text-[9px] font-mono text-muted-foreground">
            {champion.totalPoints} pts · {champion.wins} wins · avg {Math.round(champion.avgScore)}/100
          </p>
        </div>
      )}

      {/* Standings table */}
      {standings.length > 0 && (
        <div className="p-4">
          <table className="w-full text-[10px] font-mono">
            <thead>
              <tr className="text-muted-foreground uppercase tracking-wider">
                <th className="text-left pb-2 pr-2">#</th>
                <th className="text-left pb-2">Team</th>
                <th className="text-right pb-2 px-2">Pts</th>
                <th className="text-right pb-2 px-2">Wins</th>
                <th className="text-right pb-2 px-2">Avg</th>
                <th className="text-right pb-2 px-2">Best</th>
                <th className="text-left pb-2 pl-2">Rounds</th>
              </tr>
            </thead>
            <tbody>
              {standings.map((s, i) => {
                const RankIcon = RANK_ICONS[i] || Star;
                return (
                  <tr key={s.teamId} className={`border-t border-border/50 ${i === 0 && isComplete ? "bg-primary/5" : ""}`}>
                    <td className="py-2 pr-2">
                      <RankIcon className={`w-3.5 h-3.5 ${RANK_COLORS[i] || "text-muted-foreground"}`} />
                    </td>
                    <td className="py-2 font-semibold text-foreground">{s.teamName}</td>
                    <td className="py-2 px-2 text-right text-foreground font-bold">{s.totalPoints}</td>
                    <td className="py-2 px-2 text-right text-muted-foreground">{s.wins}</td>
                    <td className="py-2 px-2 text-right text-muted-foreground">{Math.round(s.avgScore)}</td>
                    <td className="py-2 px-2 text-right text-muted-foreground">{s.bestScore}</td>
                    <td className="py-2 pl-2">
                      <div className="flex items-end gap-px h-4">
                        {s.roundScores.map((score, ri) => (
                          <div
                            key={ri}
                            className="w-2 bg-primary/60 rounded-t-sm"
                            style={{ height: `${Math.max(15, (score / 100) * 100)}%` }}
                            title={`Round ${ri + 1}: ${score}`}
                          />
                        ))}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Round-by-round history */}
      {showHistory && completedRounds.length > 0 && (
        <div className="border-t border-border">
          <div className="px-4 py-3">
            <p className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
              <History className="w-3 h-3 text-primary" />
              Round-by-Round Breakdown
            </p>
            <div className="space-y-3">
              {completedRounds.map(round => (
                <RoundBreakdown key={round.roundNumber} round={round} />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Not started state */}
      {!isActive && (
        <div className="p-6 text-center">
          <p className="text-[10px] font-mono text-muted-foreground">
            Teams compete across 5 different scenarios. Points: 1st=10, 2nd=6, 3rd=3, 4th=1.
            <br />Best team across all rounds wins the tournament.
          </p>
        </div>
      )}
    </div>
  );
}

function RoundBreakdown({ round }: { round: TournamentRound }) {
  const sorted = [...round.teams].sort((a, b) => b.result.score - a.result.score);
  const winner = sorted[0];
  const margin = sorted.length >= 2 ? sorted[0].result.score - sorted[1].result.score : 0;

  return (
    <div className="bg-secondary/40 rounded-md p-3">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-[8px] font-mono h-4 px-1.5">
            Round {round.roundNumber}
          </Badge>
          <span className="text-[9px] font-mono text-muted-foreground">{round.scenarioLabel}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Crown className="w-3 h-3 text-yellow-400" />
          <span className="text-[9px] font-mono font-semibold text-foreground">
            {winner.name}
          </span>
          {margin > 0 && (
            <span className="text-[8px] font-mono text-primary">
              +{margin} margin
            </span>
          )}
        </div>
      </div>

      {/* All teams ranked */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
        {sorted.map((team, rank) => {
          const RankIcon = RANK_ICONS[rank] || Star;
          const pts = POINTS_MAP[rank] ?? 0;
          return (
            <div
              key={team.id}
              className={`flex items-center gap-2 px-2 py-1.5 rounded text-[9px] font-mono ${
                rank === 0
                  ? "bg-primary/10 border border-primary/20"
                  : "bg-card border border-border/50"
              }`}
            >
              <RankIcon className={`w-3 h-3 flex-shrink-0 ${RANK_COLORS[rank]}`} />
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-foreground truncate">{team.name}</p>
                <p className="text-muted-foreground">
                  {team.result.score}/100 · <span className="text-primary">+{pts}pts</span>
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}