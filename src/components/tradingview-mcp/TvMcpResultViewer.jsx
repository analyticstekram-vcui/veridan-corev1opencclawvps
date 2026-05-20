import React, { useState } from 'react';
import { Copy, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import { RISK_META } from './tvMcpContracts';

export default function TvMcpResultViewer({ result }) {
  const [copied, setCopied] = useState(false);

  if (!result) {
    return (
      <div className="bg-card border border-border/40 rounded-sm p-6 text-center">
        <div className="text-[8px] text-slate-500 font-mono">No result yet. Run a command from the panel above.</div>
      </div>
    );
  }

  const rm = RISK_META[result.risk] || RISK_META.SAFE_READ;

  const handleCopy = () => {
    navigator.clipboard.writeText(JSON.stringify(result, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-card border border-border/40 rounded-sm overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border/40 bg-secondary/20 flex-wrap">
        {result.ok
          ? <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />
          : <XCircle className="w-3.5 h-3.5 text-destructive shrink-0" />}
        <span className="text-[9px] font-bold text-foreground">
          {result.command?.toUpperCase()}
        </span>
        <span className={`px-1.5 py-0.5 text-[7px] font-bold border rounded-sm ${rm.text} ${rm.bg} ${rm.border}`}>
          {rm.label}
        </span>
        {result.isDryRun && (
          <span className="px-1.5 py-0.5 text-[7px] font-bold border border-amber-400/30 bg-amber-400/10 text-amber-400 rounded-sm">
            DRY_RUN
          </span>
        )}
        <span className="text-[7px] text-slate-500 font-mono ml-auto">{result.timestamp?.slice(0,19).replace('T',' ')}</span>
        <button type="button" onClick={handleCopy}
          className="px-2 py-1 bg-secondary/30 border border-border/40 text-slate-400 text-[7px] rounded-sm hover:text-slate-200 transition-colors">
          {copied ? 'Copied!' : <Copy className="w-3 h-3" />}
        </button>
      </div>

      {/* Meta row */}
      <div className="flex gap-2 px-4 py-2 border-b border-border/20 flex-wrap text-[7px] font-mono">
        <span className="text-slate-500">success: <span className={result.ok ? 'text-primary font-bold' : 'text-destructive font-bold'}>{String(result.ok)}</span></span>
        <span className="text-slate-500">execution: <span className="text-destructive font-bold">NOT_EXECUTED</span></span>
        <span className="text-slate-500">dispatch: <span className="text-destructive font-bold">NOT_DISPATCHED</span></span>
        <span className="text-slate-500">mode: <span className="text-amber-400 font-bold">READ_ONLY</span></span>
      </div>

      {/* Known issue banner */}
      {result.knownIssue && (
        <div className="flex items-start gap-2 px-4 py-2 bg-amber-400/5 border-b border-amber-400/20">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
          <span className="text-[7px] text-amber-400 font-mono">{result.knownIssue}</span>
        </div>
      )}

      {/* Error */}
      {result.error && (
        <div className="px-4 py-2 border-b border-destructive/20 bg-destructive/5">
          <div className="text-[7px] uppercase text-slate-500 mb-0.5">Error</div>
          <div className="text-[8px] text-destructive font-mono">{result.error}</div>
        </div>
      )}

      {/* JSON result */}
      <div className="p-3">
        <div className="text-[7px] uppercase text-slate-500 mb-1.5 font-bold">Response Data</div>
        <pre className="text-[8px] font-mono text-slate-300 bg-secondary/30 border border-border/30 rounded-sm p-3 overflow-x-auto whitespace-pre-wrap max-h-64">
          {JSON.stringify(result.data || result, null, 2)}
        </pre>
      </div>
    </div>
  );
}