/**
 * HealthScoreEngine — Phase 4 Read-Only
 * Composite health score with category breakdown. No mutations.
 */
import React from 'react';
import { Activity } from 'lucide-react';

function ScoreBar({ label, score }) {
  const color = score >= 90 ? 'bg-primary' : score >= 70 ? 'bg-amber-400' : 'bg-destructive';
  const textColor = score >= 90 ? 'text-primary' : score >= 70 ? 'text-amber-400' : 'text-destructive';
  return (
    <div className="space-y-0.5">
      <div className="flex items-center justify-between">
        <span className="text-[7px] font-mono text-slate-500">{label}</span>
        <span className={`text-[8px] font-mono font-bold ${textColor}`}>{score}</span>
      </div>
      <div className="h-1 bg-border/40 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${score}%` }} />
      </div>
    </div>
  );
}

export default function HealthScoreEngine({ healthScore, breakdown }) {
  const mainColor = healthScore >= 90 ? 'text-primary' : healthScore >= 70 ? 'text-amber-400' : 'text-destructive';

  return (
    <div className="border border-border/40 bg-card rounded-sm overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2 border-b border-border/30 bg-card/80">
        <Activity className="w-3 h-3 text-accent" />
        <span className="text-[8px] font-bold uppercase tracking-widest text-slate-300">Health Score Engine</span>
        <span className={`ml-auto text-[10px] font-mono font-bold ${mainColor}`}>{healthScore}/100</span>
      </div>
      <div className="p-3 space-y-2">
        {/* Ring-style display */}
        <div className="flex items-center justify-center py-2">
          <div className={`w-16 h-16 rounded-full border-4 flex items-center justify-center ${
            healthScore >= 90 ? 'border-primary' : healthScore >= 70 ? 'border-amber-400' : 'border-destructive'
          }`}>
            <span className={`text-xl font-mono font-bold ${mainColor}`}>{healthScore}</span>
          </div>
        </div>
        {/* Breakdown */}
        <div className="space-y-1.5">
          <ScoreBar label="Governance"  score={breakdown.governance} />
          <ScoreBar label="Coverage"    score={breakdown.coverage} />
          <ScoreBar label="Approvals"   score={breakdown.approvals} />
          <ScoreBar label="Exceptions"  score={breakdown.exceptions} />
          <ScoreBar label="Boundary"    score={breakdown.boundary} />
        </div>
      </div>
    </div>
  );
}