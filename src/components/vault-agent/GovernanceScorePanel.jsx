import React from 'react';
import { TrendingUp, Info } from 'lucide-react';

function ScoreBar({ label, score, color }) {
  const barColor = score >= 90 ? 'bg-primary' : score >= 70 ? 'bg-amber-400' : 'bg-destructive';
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-[8px] font-mono text-slate-400">{label}</span>
        <span className={`text-[10px] font-bold font-mono ${color}`}>{score}</span>
      </div>
      <div className="h-1.5 bg-border/40 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${score}%` }} />
      </div>
    </div>
  );
}

export default function GovernanceScorePanel({ weeklyBrief }) {
  const { maturityScore, activationScore, readinessScore, openExceptions, weekSummary } = weeklyBrief;

  const readinessColor = readinessScore >= 90 ? 'text-primary' : readinessScore >= 70 ? 'text-amber-400' : 'text-destructive';

  return (
    <div className="border border-border/40 bg-card rounded-sm overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border/30 bg-card/80">
        <TrendingUp className="w-3.5 h-3.5 text-accent" />
        <span className="text-[9px] font-bold uppercase tracking-widest text-slate-300">Governance Readiness</span>
        <span className="text-[7px] font-mono text-slate-500 ml-1">— Weekly Governance Brief</span>
        <span className={`ml-auto text-[8px] font-bold font-mono px-2 py-0.5 border rounded-sm ${readinessColor} border-current/30 bg-current/5`}>
          Readiness: {readinessScore}/100
        </span>
      </div>

      <div className="p-4 space-y-3">
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Maturity Score',    value: maturityScore,    color: 'text-primary' },
            { label: 'Activation Score',  value: activationScore,  color: activationScore >= 90 ? 'text-primary' : 'text-amber-400' },
            { label: 'Readiness Score',   value: readinessScore,   color: readinessColor },
          ].map(({ label, value, color }) => (
            <div key={label} className="flex flex-col items-center px-3 py-3 bg-background/60 border border-border/30 rounded-sm">
              <span className={`text-2xl font-mono font-bold ${color}`}>{value}</span>
              <span className="text-[7px] font-mono text-slate-500 mt-1 text-center">{label}</span>
            </div>
          ))}
        </div>

        <div className="space-y-2.5">
          <ScoreBar label="Governance Maturity"    score={maturityScore}   />
          <ScoreBar label="Governance Activation"  score={activationScore} />
          <ScoreBar label="Governance Readiness"   score={readinessScore}  />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="flex flex-col items-center px-3 py-2.5 bg-background/60 border border-border/30 rounded-sm">
            <span className={`text-xl font-mono font-bold ${openExceptions > 0 ? 'text-destructive' : 'text-primary'}`}>
              {openExceptions}
            </span>
            <span className="text-[7px] font-mono text-slate-500 mt-0.5">Open Exceptions</span>
          </div>
          <div className="flex flex-col items-center px-3 py-2.5 bg-background/60 border border-border/30 rounded-sm">
            <span className="text-xl font-mono font-bold text-primary">ACTIVE</span>
            <span className="text-[7px] font-mono text-slate-500 mt-0.5">Governance Mode</span>
          </div>
        </div>

        {weekSummary && (
          <div className="flex items-start gap-2 px-3 py-2.5 bg-background/40 border border-border/30 rounded-sm">
            <Info className="w-3 h-3 text-slate-500 shrink-0 mt-0.5" />
            <p className="text-[7px] font-mono text-slate-400 leading-relaxed">{weekSummary}</p>
          </div>
        )}
      </div>
    </div>
  );
}