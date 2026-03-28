import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FileText, Download, Edit3, Save, X } from "lucide-react";
import type { AITeam } from "@/lib/teams";
import type { TournamentRound } from "@/lib/tournament";
import { generateTeamMarkdown } from "@/lib/objectives";

interface TeamDocPanelProps {
  team: AITeam;
  accent: string;
  tournamentRounds: TournamentRound[];
  savedNotes: string;
  onSaveNotes: (teamId: string, notes: string) => void;
}

export function TeamDocPanel({ team, accent, tournamentRounds, savedNotes, onSaveNotes }: TeamDocPanelProps) {
  const [editing, setEditing] = useState(false);
  const [notes, setNotes] = useState(savedNotes);

  const roundHistory = tournamentRounds
    .map(r => {
      const sorted = [...r.teams].sort((a, b) => b.result.score - a.result.score);
      const idx = sorted.findIndex(t => t.id === team.id);
      if (idx < 0) return null;
      return { round: r.roundNumber, score: sorted[idx].result.score, rank: idx + 1 };
    })
    .filter((r): r is { round: number; score: number; rank: number } => r !== null);

  const handleExport = () => {
    const md = generateTeamMarkdown(
      team.name,
      team.philosophy,
      team.reasoning,
      team.roles.map(r => ({ label: r.label, focus: r.focus, suggestion: r.suggestion })),
      team.result,
      savedNotes,
      roundHistory,
    );
    const blob = new Blob([md], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${team.name.toLowerCase().replace(/\s+/g, "-")}-report.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSave = () => {
    onSaveNotes(team.id, notes);
    setEditing(false);
  };

  return (
    <div className="bg-secondary/50 rounded-md p-3 space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          <FileText className="w-3 h-3 text-primary" />
          Team Documentation
        </p>
        <div className="flex items-center gap-1">
          {!editing && (
            <Button variant="ghost" size="sm" onClick={() => setEditing(true)} className="h-5 px-1.5 text-[8px] font-mono gap-1">
              <Edit3 className="w-2.5 h-2.5" /> Edit Notes
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={handleExport} className="h-5 px-1.5 text-[8px] font-mono gap-1">
            <Download className="w-2.5 h-2.5" /> Export MD
          </Button>
        </div>
      </div>

      {/* Auto-generated strategy log */}
      <div className="bg-card/50 rounded p-2">
        <p className="text-[8px] font-mono text-muted-foreground uppercase tracking-wider mb-1">Auto-Generated Log</p>
        <div className="space-y-0.5 max-h-24 overflow-y-auto">
          {team.reasoning.map((r, i) => (
            <p key={i} className="text-[9px] font-mono text-muted-foreground">
              <span className={`${accent} mr-1`}>{i + 1}.</span> {r}
            </p>
          ))}
        </div>
      </div>

      {/* Round history if tournament data exists */}
      {roundHistory.length > 0 && (
        <div className="bg-card/50 rounded p-2">
          <p className="text-[8px] font-mono text-muted-foreground uppercase tracking-wider mb-1">Tournament Results</p>
          <div className="flex gap-1">
            {roundHistory.map(r => (
              <div key={r.round} className={`flex flex-col items-center px-1.5 py-1 rounded text-[8px] font-mono ${r.rank === 1 ? "bg-primary/10 text-primary" : "text-muted-foreground"}`}>
                <span>R{r.round}</span>
                <span className="font-bold">{r.score}</span>
                <span>#{r.rank}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Editable notes */}
      {editing ? (
        <div className="space-y-1.5">
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Add strategy notes, observations, or instructions for this team..."
            className="w-full h-20 bg-background border border-border rounded-md p-2 text-[10px] font-mono text-foreground placeholder:text-muted-foreground/50 resize-none focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <div className="flex gap-1.5">
            <Button size="sm" onClick={handleSave} className="h-6 px-2 text-[9px] font-mono gap-1">
              <Save className="w-2.5 h-2.5" /> Save
            </Button>
            <Button size="sm" variant="ghost" onClick={() => { setNotes(savedNotes); setEditing(false); }} className="h-6 px-2 text-[9px] font-mono gap-1">
              <X className="w-2.5 h-2.5" /> Cancel
            </Button>
          </div>
        </div>
      ) : savedNotes ? (
        <div className="bg-card/50 rounded p-2">
          <p className="text-[8px] font-mono text-muted-foreground uppercase tracking-wider mb-1">Notes</p>
          <p className="text-[9px] font-mono text-foreground whitespace-pre-wrap">{savedNotes}</p>
        </div>
      ) : null}
    </div>
  );
}
