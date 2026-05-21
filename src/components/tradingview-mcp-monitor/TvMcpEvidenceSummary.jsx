/**
 * TvMcpEvidenceSummary
 * Read-only evidence summary panel for the TradingView MCP Monitoring Console.
 * Derived from localStorage only. No polling. No execution. No secrets exposed.
 */
import React from 'react';
import { Download, CheckCircle2, XCircle, Shield } from 'lucide-react';

export default function TvMcpEvidenceSummary({ checks }) {
  if (!checks || checks.length === 0) return null;

  const lastStatus  = checks.find(c => c.command === 'status' && c.status === 'SUCCESS') ?? null;
  const lastQuote   = checks.find(c => c.command === 'quote'  && c.status === 'SUCCESS') ?? null;
  const latest      = checks[0];

  const cdpConnected    = lastStatus?.cdpConnected ?? null;
  const chartSymbol     = lastStatus?.chartSymbol ?? lastQuote?.chartSymbol ?? null;
  const chartResolution = lastStatus?.chartResolution ?? null;

  const exportEvidence = () => {
    const payload = {
      exportedAt:                 new Date().toISOString(),
      storedCheckCount:           checks.length,
      latestAuditId:              latest?.checkId ?? null,
      lastSuccessfulStatusCheck:  lastStatus?.createdAt ?? null,
      lastSuccessfulQuoteCheck:   lastQuote?.createdAt ?? null,
      cdpConnected,
      chartSymbol,
      chartResolution,
      relayUrlExposed:            false,
      executionLock:              'LOCKED',
      brokerDisabled:             true,
      moneyMovementDisabled:      true,
      credentialAccessDisabled:   true,
      liveTrading:                'DISABLED',
      safetyLocks: {
        executionStatus:  'NOT_EXECUTED',
        dispatchAllowed:  false,
        brokerConnection: 'DISABLED',
        moneyMovement:    'DISABLED',
        credentialAccess: 'DISABLED',
        executionLock:    'LOCKED',
        liveTrading:      'DISABLED',
      },
      latestCheck: latest ?? null,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `tvmcp-evidence-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const rows = [
    { label: 'Relay URL Exposed',         value: 'NO — server-side only',          cls: 'text-primary font-bold' },
    { label: 'Last Successful Status',    value: lastStatus ? new Date(lastStatus.createdAt).toLocaleString() : 'None yet',    cls: lastStatus ? 'text-primary' : 'text-amber-400' },
    { label: 'Last Successful Quote',     value: lastQuote  ? new Date(lastQuote.createdAt).toLocaleString()  : 'None yet',    cls: lastQuote  ? 'text-primary' : 'text-amber-400' },
    { label: 'CDP Connected',             value: cdpConnected == null ? 'N/A' : String(cdpConnected),         cls: cdpConnected ? 'text-primary font-bold' : 'text-amber-400' },
    { label: 'Chart Symbol',             value: chartSymbol ?? 'N/A',              cls: 'text-slate-300 font-mono' },
    { label: 'Chart Resolution',         value: chartResolution ?? 'N/A',          cls: 'text-slate-300' },
    { label: 'Execution Lock',           value: 'LOCKED',                           cls: 'text-destructive font-bold' },
    { label: 'Broker Disabled',          value: 'TRUE',                             cls: 'text-destructive font-bold' },
    { label: 'Money Movement Disabled',  value: 'TRUE',                             cls: 'text-destructive font-bold' },
    { label: 'Stored Checks',            value: String(checks.length),             cls: 'text-slate-300 font-bold' },
    { label: 'Latest Audit ID',          value: latest?.checkId ?? 'N/A',          cls: 'text-slate-400 font-mono text-[7px]' },
  ];

  return (
    <div className="bg-card border border-primary/20 rounded-sm overflow-hidden">
      <div className="px-4 py-2.5 bg-primary/5 border-b border-primary/20 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Shield className="w-3.5 h-3.5 text-primary shrink-0" />
          <span className="text-[9px] font-bold uppercase text-primary">MCP Evidence Summary</span>
          <span className="text-[7px] text-slate-500 font-mono ml-1">read-only · no URL exposed</span>
        </div>
        <button
          type="button"
          onClick={exportEvidence}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 border border-primary/30 text-primary text-[8px] font-bold rounded-sm hover:bg-primary/20 transition-colors"
        >
          <Download className="w-3 h-3" />
          Export Latest MCP Evidence JSON
        </button>
      </div>

      <div className="p-3 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
        {rows.map(r => (
          <div key={r.label} className="bg-secondary/20 border border-border/20 rounded-sm px-2.5 py-2">
            <div className="text-[7px] uppercase text-slate-500 font-bold mb-0.5 leading-tight">{r.label}</div>
            <div className={`text-[8px] break-all leading-snug ${r.cls}`}>{r.value}</div>
          </div>
        ))}
      </div>

      <div className="px-4 py-2 border-t border-border/20 flex flex-wrap gap-3 text-[7px] font-mono">
        <span className="flex items-center gap-1 text-primary"><CheckCircle2 className="w-2.5 h-2.5" /> executionStatus: NOT_EXECUTED</span>
        <span className="flex items-center gap-1 text-primary"><CheckCircle2 className="w-2.5 h-2.5" /> dispatchAllowed: false</span>
        <span className="flex items-center gap-1 text-destructive"><XCircle className="w-2.5 h-2.5" /> liveTrading: DISABLED</span>
        <span className="flex items-center gap-1 text-destructive"><XCircle className="w-2.5 h-2.5" /> brokerConnection: DISABLED</span>
        <span className="flex items-center gap-1 text-destructive"><XCircle className="w-2.5 h-2.5" /> credentialAccess: DISABLED</span>
      </div>
    </div>
  );
}