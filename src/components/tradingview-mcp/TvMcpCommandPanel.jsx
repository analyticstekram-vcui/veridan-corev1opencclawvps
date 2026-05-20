import React from 'react';
import { Loader2 } from 'lucide-react';
import { COMMANDS, RISK_META } from './tvMcpContracts';

export default function TvMcpCommandPanel({ onCommand, loading, activeCommand }) {
  return (
    <div className="bg-card border border-border/40 rounded-sm overflow-hidden">
      <div className="px-4 py-2.5 border-b border-border/40 bg-secondary/20">
        <span className="text-[9px] font-bold uppercase text-slate-300">Command Test Panel — READ_ONLY</span>
        <span className="ml-3 text-[7px] text-destructive font-mono">EXECUTION: DISABLED</span>
      </div>
      <div className="p-3 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
        {COMMANDS.map(cmd => {
          const rm = RISK_META[cmd.risk];
          const isActive = activeCommand === cmd.id && loading;
          return (
            <button key={cmd.id} type="button"
              onClick={() => onCommand(cmd)}
              disabled={loading}
              className={`flex flex-col items-start gap-1.5 p-3 border rounded-sm text-left transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:bg-secondary/40 ${
                cmd.risk === 'REVIEW_REQUIRED'
                  ? 'bg-amber-400/5 border-amber-400/20 hover:border-amber-400/40'
                  : 'bg-secondary/20 border-border/30 hover:border-border/60'
              }`}>
              <div className="flex items-center gap-1.5 w-full">
                {isActive
                  ? <Loader2 className="w-3 h-3 animate-spin text-amber-400 shrink-0" />
                  : <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${cmd.risk === 'SAFE_READ' ? 'bg-primary' : 'bg-amber-400'}`} />
                }
                <span className="text-[9px] font-bold text-foreground flex-1">{cmd.label}</span>
              </div>
              <span className={`text-[7px] font-bold px-1.5 py-0.5 rounded-sm border ${rm.text} ${rm.bg} ${rm.border}`}>
                {rm.label}
              </span>
              <span className="text-[7px] text-slate-500 leading-relaxed line-clamp-2">{cmd.description}</span>
              {cmd.knownIssue && (
                <span className="text-[6px] text-amber-400/70 italic leading-relaxed">{cmd.knownIssue}</span>
              )}
              <span className="text-[6px] font-mono text-slate-600">{cmd.cli}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}