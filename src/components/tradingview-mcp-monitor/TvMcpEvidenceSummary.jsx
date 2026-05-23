/**
 * TvMcpEvidenceSummary
 * Read-only evidence summary panel for the TradingView MCP Monitoring Console.
 * Parses nested JSON from rawData.stdout for status and quote commands.
 * No polling. No execution. No secrets exposed. Relay URL never shown.
 */
import React from 'react';
import { Download, CheckCircle2, XCircle, Shield } from 'lucide-react';

/** Parse the nested stdout JSON from a check's rawData field */
function parseStdout(rawData) {
  if (!rawData) return null;
  // rawData may be the parsed object already, or may contain a stdout string
  const stdout = rawData?.stdout ?? rawData?.result?.stdout ?? null;
  if (!stdout) return rawData; // rawData itself might already be the parsed object
  if (typeof stdout === 'object') return stdout;
  try { return JSON.parse(stdout); } catch { return null; }
}

function extractStatus(check) {
  if (!check) return {};
  const parsed = parseStdout(check.rawData) ?? {};
  return {
    cdp_connected:    parsed.cdp_connected    ?? check.cdpConnected    ?? null,
    target_url:       parsed.target_url       ?? null,
    target_title:     parsed.target_title     ?? null,
    chart_symbol:     parsed.chart_symbol     ?? check.chartSymbol     ?? null,
    chart_resolution: parsed.chart_resolution ?? check.chartResolution ?? null,
    chart_type:       parsed.chart_type       ?? null,
    api_available:    parsed.api_available    ?? null,
  };
}

function extractQuote(check) {
  if (!check) return {};
  const parsed = parseStdout(check.rawData) ?? {};
  return {
    symbol:      parsed.symbol      ?? check.chartSymbol ?? null,
    last:        parsed.last        ?? parsed.price      ?? null,
    open:        parsed.open        ?? null,
    high:        parsed.high        ?? null,
    low:         parsed.low         ?? null,
    close:       parsed.close       ?? null,
    volume:      parsed.volume      ?? null,
    description: parsed.description ?? null,
    exchange:    parsed.exchange    ?? null,
    type:        parsed.type        ?? null,
  };
}

function val(v) {
  if (v === null || v === undefined) return 'N/A';
  if (typeof v === 'boolean') return v ? 'true' : 'false';
  return String(v);
}

function Cell({ label, value, cls = 'text-slate-300' }) {
  return (
    <div className="bg-secondary/20 border border-border/20 rounded-sm px-2.5 py-2">
      <div className="text-[7px] uppercase text-slate-500 font-bold mb-0.5 leading-tight">{label}</div>
      <div className={`text-[8px] break-all leading-snug font-mono ${cls}`}>{value}</div>
    </div>
  );
}

export default function TvMcpEvidenceSummary({ checks }) {
  if (!checks || checks.length === 0) return null;

  const lastStatusCheck = checks.find(c => c.command === 'status' && c.status === 'SUCCESS') ?? null;
  const lastQuoteCheck  = checks.find(c => c.command === 'quote'  && c.status === 'SUCCESS') ?? null;
  const latest          = checks[0];

  const statusData = extractStatus(lastStatusCheck);
  const quoteData  = extractQuote(lastQuoteCheck);

  const exportEvidence = () => {
    const payload = {
      exportedAt:                new Date().toISOString(),
      storedCheckCount:          checks.length,
      latestAuditId:             latest?.checkId ?? null,
      lastSuccessfulStatusCheck: lastStatusCheck?.createdAt ?? null,
      lastSuccessfulQuoteCheck:  lastQuoteCheck?.createdAt  ?? null,
      relayUrlExposed:           false,
      executionLock:             'LOCKED',
      brokerDisabled:            true,
      moneyMovementDisabled:     true,
      credentialAccessDisabled:  true,
      liveTrading:               'DISABLED',
      statusFields:              statusData,
      quoteFields:               quoteData,
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

  const cdpOk = statusData.cdp_connected === true || statusData.cdp_connected === 'true';

  return (
    <div className="bg-card border border-primary/20 rounded-sm overflow-hidden">
      {/* Header */}
      <div className="px-4 py-2.5 bg-primary/5 border-b border-primary/20 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Shield className="w-3.5 h-3.5 text-primary shrink-0" />
          <span className="text-[9px] font-bold uppercase text-primary">MCP Evidence Summary</span>
          <span className="text-[7px] text-slate-500 font-mono ml-1">read-only · relay URL hidden</span>
        </div>
        <button type="button" onClick={exportEvidence}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 border border-primary/30 text-primary text-[8px] font-bold rounded-sm hover:bg-primary/20 transition-colors">
          <Download className="w-3 h-3" />
          Export Evidence JSON
        </button>
      </div>

      {/* Top meta row */}
      <div className="p-3 grid grid-cols-2 sm:grid-cols-4 gap-2 border-b border-border/20">
        <Cell label="Relay URL Exposed"       value="NO — server-side only"  cls="text-primary font-bold" />
        <Cell label="Last Status Check"       value={lastStatusCheck ? new Date(lastStatusCheck.createdAt).toLocaleString() : 'None yet'} cls={lastStatusCheck ? 'text-primary' : 'text-amber-400'} />
        <Cell label="Last Quote Check"        value={lastQuoteCheck  ? new Date(lastQuoteCheck.createdAt).toLocaleString()  : 'None yet'} cls={lastQuoteCheck  ? 'text-primary' : 'text-amber-400'} />
        <Cell label="Stored Checks"           value={String(checks.length)} cls="text-slate-300 font-bold" />
      </div>

      {/* Status fields */}
      <div className="px-4 pt-3 pb-1">
        <div className="text-[7px] font-bold uppercase tracking-widest text-slate-500 mb-2">
          Status Command Fields{!lastStatusCheck && <span className="ml-2 text-amber-400 normal-case">(no successful status check yet)</span>}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <Cell label="CDP Connected"    value={val(statusData.cdp_connected)}    cls={cdpOk ? 'text-primary font-bold' : 'text-amber-400'} />
          <Cell label="API Available"    value={val(statusData.api_available)}    cls={statusData.api_available ? 'text-primary' : 'text-amber-400'} />
          <Cell label="Chart Symbol"     value={val(statusData.chart_symbol)}     cls="text-slate-300" />
          <Cell label="Chart Resolution" value={val(statusData.chart_resolution)} cls="text-slate-300" />
          <Cell label="Chart Type"       value={val(statusData.chart_type)}       cls="text-slate-300" />
          <Cell label="Target Title"     value={val(statusData.target_title)}     cls="text-slate-400" />
          <Cell label="Target URL"       value={val(statusData.target_url)}       cls="text-slate-400" />
          <Cell label="Execution Lock"   value="LOCKED"                            cls="text-destructive font-bold" />
        </div>
      </div>

      {/* Quote fields */}
      <div className="px-4 pt-3 pb-3">
        <div className="text-[7px] font-bold uppercase tracking-widest text-slate-500 mb-2">
          Quote Command Fields{!lastQuoteCheck && <span className="ml-2 text-amber-400 normal-case">(no successful quote check yet)</span>}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          <Cell label="Symbol"      value={val(quoteData.symbol)}      cls="text-slate-300" />
          <Cell label="Last"        value={val(quoteData.last)}        cls="text-primary font-bold" />
          <Cell label="Open"        value={val(quoteData.open)}        cls="text-slate-300" />
          <Cell label="High"        value={val(quoteData.high)}        cls="text-primary" />
          <Cell label="Low"         value={val(quoteData.low)}         cls="text-destructive" />
          <Cell label="Close"       value={val(quoteData.close)}       cls="text-slate-300" />
          <Cell label="Volume"      value={val(quoteData.volume)}      cls="text-slate-300" />
          <Cell label="Description" value={val(quoteData.description)} cls="text-slate-400" />
          <Cell label="Exchange"    value={val(quoteData.exchange)}    cls="text-slate-300" />
          <Cell label="Type"        value={val(quoteData.type)}        cls="text-slate-300" />
        </div>
      </div>

      {/* Safety footer */}
      <div className="px-4 py-2 border-t border-border/20 flex flex-wrap gap-3 text-[7px] font-mono">
        <span className="flex items-center gap-1 text-primary"><CheckCircle2 className="w-2.5 h-2.5" /> executionStatus: NOT_EXECUTED</span>
        <span className="flex items-center gap-1 text-primary"><CheckCircle2 className="w-2.5 h-2.5" /> dispatchAllowed: false</span>
        <span className="flex items-center gap-1 text-destructive"><XCircle className="w-2.5 h-2.5" /> liveTrading: DISABLED</span>
        <span className="flex items-center gap-1 text-destructive"><XCircle className="w-2.5 h-2.5" /> brokerConnection: DISABLED</span>
        <span className="flex items-center gap-1 text-destructive"><XCircle className="w-2.5 h-2.5" /> credentialAccess: DISABLED</span>
        <span className="flex items-center gap-1 text-destructive"><XCircle className="w-2.5 h-2.5" /> moneyMovement: DISABLED</span>
        <span className="ml-auto text-slate-600">auditId: {latest?.checkId ?? 'N/A'}</span>
      </div>
    </div>
  );
}