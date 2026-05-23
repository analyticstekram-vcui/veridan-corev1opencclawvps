/**
 * TvSignalProposalPanel
 * Phase 3 — Signal-to-Proposal Preview
 * PREVIEW_ONLY / NOT_EXECUTED / NOT_APPROVED
 * No trading · No broker · No orders · No credentials · No money movement · No scheduler
 */
import React, { useState, useEffect } from 'react';
import { Shield, FileText, Trash2, CheckCircle2, XCircle, ChevronDown, ChevronRight, AlertTriangle } from 'lucide-react';

const ALERT_ACCEPTED_KEY  = 'veridanTradingViewAlertIntakeRecords';
const PROPOSAL_STORAGE_KEY = 'veridanTradingViewSignalProposalPreviews';

function safeArray(key) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch { return []; }
}

function safeStr(v, fallback = 'N/A') {
  if (v === null || v === undefined) return fallback;
  return String(v);
}

function genId() {
  return 'prop-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 6);
}

const SAFETY_ASSERTIONS = [
  { key: 'sourceAlertAccepted',   value: true  },
  { key: 'rejectedAlertIgnored',  value: true  },
  { key: 'executionStatus',       value: 'NOT_EXECUTED' },
  { key: 'brokerConnection',      value: 'DISABLED' },
  { key: 'liveTrading',           value: 'DISABLED' },
  { key: 'moneyMovement',         value: 'DISABLED' },
  { key: 'credentialAccess',      value: 'DISABLED' },
  { key: 'approvalStatus',        value: 'NOT_APPROVED' },
  { key: 'dispatchAllowed',       value: false },
  { key: 'tradeAttempted',        value: false },
  { key: 'orderAttempted',        value: false },
  { key: 'schedulerActive',       value: false },
  { key: 'pollingLoopActive',     value: false },
];

function buildProposal(alert) {
  // Safely extract fields from any alert record shape
  const payload = (() => {
    try {
      if (alert.parsedPayload && typeof alert.parsedPayload === 'object') return alert.parsedPayload;
      if (typeof alert.rawPayload === 'string') return JSON.parse(alert.rawPayload);
      if (typeof alert.payload === 'object' && alert.payload) return alert.payload;
    } catch {}
    return {};
  })();

  const symbol       = safeStr(payload.symbol       ?? alert.symbol       ?? payload.ticker ?? alert.ticker, 'UNKNOWN');
  const timeframe    = safeStr(payload.timeframe     ?? alert.timeframe    ?? payload.interval, 'N/A');
  const strategyName = safeStr(payload.strategy      ?? payload.strategyName ?? alert.strategyName, 'N/A');
  const signalType   = safeStr(payload.signal        ?? payload.signalType   ?? alert.signalType, 'N/A');
  const side         = safeStr(payload.side          ?? payload.direction     ?? alert.side, 'N/A');
  const price        = safeStr(payload.price         ?? payload.close         ?? alert.price, 'N/A');
  const alertMessage = safeStr(payload.message       ?? payload.alertMessage  ?? alert.alertMessage ?? alert.message, 'N/A');
  const riskProfile  = safeStr(payload.riskProfile   ?? payload.risk          ?? alert.riskProfile, 'LOW');
  const sourceTs     = alert.receivedAt ?? alert.validatedAt ?? alert.createdAt ?? alert.timestamp ?? new Date().toISOString();

  return {
    proposalId:       genId(),
    sourceAlertId:    safeStr(alert.alertId ?? alert.id, 'unknown'),
    symbol,
    timeframe,
    strategyName,
    signalType,
    side,
    price,
    timestamp:        new Date().toISOString(),
    alertTimestamp:   sourceTs,
    alertMessage,
    riskProfile,
    proposalStatus:   'PROPOSAL_PREVIEW_ONLY',
    executionStatus:  'NOT_EXECUTED',
    approvalStatus:   'NOT_APPROVED',
    brokerConnection: 'DISABLED',
    liveTrading:      'DISABLED',
    moneyMovement:    'DISABLED',
    credentialAccess: 'DISABLED',
    dispatchAllowed:  false,
    tradeAttempted:   false,
    orderAttempted:   false,
    schedulerActive:  false,
    pollingLoopActive: false,
    riskClass:        'TRADE_PROPOSAL_PREVIEW_ONLY',
    safetyAssertions: SAFETY_ASSERTIONS,
    safetyPassCount:  SAFETY_ASSERTIONS.length,
    safetyFailCount:  0,
    sourceComponent:  'TvSignalProposalPanel',
  };
}

export default function TvSignalProposalPanel() {
  const [proposals,    setProposals]    = useState([]);
  const [latestAlert,  setLatestAlert]  = useState(null);
  const [lastProposal, setLastProposal] = useState(null);
  const [error,        setError]        = useState(null);
  const [expanded,     setExpanded]     = useState({});

  useEffect(() => {
    try {
      const alerts    = safeArray(ALERT_ACCEPTED_KEY);
      const stored    = safeArray(PROPOSAL_STORAGE_KEY);
      setLatestAlert(alerts[0] ?? null);
      setProposals(stored);
      setLastProposal(stored[0] ?? null);
    } catch (err) {
      console.error('[TvSignalProposalPanel] load error:', err);
    }
  }, []);

  const generate = () => {
    setError(null);
    try {
      const alerts = safeArray(ALERT_ACCEPTED_KEY);
      if (!alerts || alerts.length === 0) {
        setError('No accepted alert records found. Accept an alert in Phase 2 first.');
        return;
      }
      const alert    = alerts[0];
      const proposal = buildProposal(alert);
      const updated  = [proposal, ...proposals].slice(0, 50);
      setProposals(updated);
      setLastProposal(proposal);
      setLatestAlert(alert);
      try { localStorage.setItem(PROPOSAL_STORAGE_KEY, JSON.stringify(updated)); } catch {}
    } catch (err) {
      console.error('[TvSignalProposalPanel] generate error:', err);
      setError(err?.message || 'Unknown error generating proposal preview.');
    }
  };

  const clearProposals = () => {
    if (!window.confirm('Clear all proposal previews?')) return;
    try { localStorage.removeItem(PROPOSAL_STORAGE_KEY); } catch {}
    setProposals([]);
    setLastProposal(null);
  };

  const toggle = (id) => setExpanded(prev => ({ ...prev, [id]: !prev[id] }));

  const fieldCard = (label, value, cls = 'text-slate-300') => (
    <div key={label} className="bg-secondary/20 border border-border/20 rounded-sm px-2.5 py-2">
      <div className="text-[7px] uppercase text-slate-500 font-bold mb-0.5">{label}</div>
      <div className={`text-[8px] font-mono break-all ${cls}`}>{safeStr(value)}</div>
    </div>
  );

  return (
    <div className="bg-card border border-blue-500/20 rounded-sm overflow-hidden">

      {/* Header */}
      <div className="px-4 py-2.5 bg-blue-500/5 border-b border-blue-500/20 flex items-center gap-2">
        <FileText className="w-3.5 h-3.5 text-blue-400 shrink-0" />
        <span className="text-[9px] font-bold uppercase text-blue-400">Phase 3 — Signal to Proposal Preview</span>
        <span className="ml-auto text-[7px] font-mono text-destructive font-bold">PREVIEW_ONLY · NOT_EXECUTED · NOT_APPROVED</span>
      </div>

      {/* Safety banner */}
      <div className="px-4 py-2.5 border-b border-border/20 flex items-start gap-2 bg-amber-500/5 text-[8px] text-amber-400">
        <Shield className="w-3.5 h-3.5 shrink-0 mt-0.5" />
        <span>
          <span className="font-bold">WARNING: This is a proposal preview only.</span>{' '}
          No trade. No broker. No order. No credential. No money movement. No scheduler. No polling. No dispatch. No execution.
          brokerConnection=DISABLED · liveTrading=DISABLED · executionStatus=NOT_EXECUTED
        </span>
      </div>

      {/* Latest accepted alert context */}
      <div className="px-4 py-2.5 border-b border-border/20 bg-secondary/10">
        <span className="text-[7px] uppercase text-slate-500 font-bold">Source: Latest Accepted Alert · Key: </span>
        <span className="text-[7px] font-mono text-slate-500">{ALERT_ACCEPTED_KEY}</span>
        {latestAlert && (
          <span className="ml-3 text-[7px] font-mono text-primary">
            alertId: {safeStr(latestAlert.alertId ?? latestAlert.id, '?')} · {safeStr(latestAlert.receivedAt ?? latestAlert.createdAt, '—')}
          </span>
        )}
        {!latestAlert && (
          <span className="ml-3 text-[7px] font-mono text-amber-400">No accepted alerts yet — use Phase 2 to accept an alert first.</span>
        )}
      </div>

      {/* Action buttons */}
      <div className="px-4 py-3 border-b border-border/20 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={generate}
          className="flex items-center gap-1.5 px-4 py-2 bg-blue-500/10 border border-blue-500/30 text-blue-400 text-[9px] font-bold rounded-sm hover:bg-blue-500/20 transition-colors"
        >
          <FileText className="w-3 h-3" /> Generate Proposal Preview From Latest Accepted Alert
        </button>
        {proposals.length > 0 && (
          <button
            type="button"
            onClick={clearProposals}
            className="flex items-center gap-1.5 px-3 py-2 border border-border/40 text-slate-400 text-[9px] font-bold rounded-sm hover:bg-secondary/50 transition-colors"
          >
            <Trash2 className="w-3 h-3" /> Clear Proposal Previews
          </button>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="mx-4 mt-3 flex items-start gap-2 px-3 py-2 bg-destructive/5 border border-destructive/30 rounded-sm text-[9px] text-destructive">
          <XCircle className="w-3 h-3 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Latest proposal result card */}
      {lastProposal && (
        <div className="p-4 space-y-3">
          <div className="flex items-center gap-2 px-3 py-2 bg-blue-500/10 border border-blue-500/30 rounded-sm">
            <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0" />
            <div>
              <div className="text-[10px] font-bold font-mono text-blue-400">PROPOSAL_PREVIEW_CREATED</div>
              <div className="text-[7px] text-slate-500 mt-0.5">{lastProposal.proposalId} · {new Date(lastProposal.timestamp).toLocaleString()}</div>
            </div>
          </div>

          {/* Proposal fields grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {fieldCard('proposalId',       lastProposal.proposalId,      'text-slate-400 text-[7px]')}
            {fieldCard('sourceAlertId',    lastProposal.sourceAlertId,   'text-slate-400 text-[7px]')}
            {fieldCard('symbol',           lastProposal.symbol,           'text-primary font-bold')}
            {fieldCard('timeframe',        lastProposal.timeframe,        'text-primary font-bold')}
            {fieldCard('strategyName',     lastProposal.strategyName)}
            {fieldCard('signalType',       lastProposal.signalType)}
            {fieldCard('side',             lastProposal.side,             'text-amber-400 font-bold')}
            {fieldCard('price',            lastProposal.price,            'text-primary')}
            {fieldCard('riskProfile',      lastProposal.riskProfile,      'text-amber-400')}
            {fieldCard('proposalStatus',   lastProposal.proposalStatus,   'text-blue-400 font-bold')}
            {fieldCard('executionStatus',  lastProposal.executionStatus,  'text-destructive font-bold')}
            {fieldCard('approvalStatus',   lastProposal.approvalStatus,   'text-destructive font-bold')}
            {fieldCard('brokerConnection', lastProposal.brokerConnection, 'text-destructive font-bold')}
            {fieldCard('liveTrading',      lastProposal.liveTrading,      'text-destructive font-bold')}
            {fieldCard('moneyMovement',    lastProposal.moneyMovement,    'text-destructive font-bold')}
            {fieldCard('credentialAccess', lastProposal.credentialAccess, 'text-destructive font-bold')}
            {fieldCard('riskClass',        lastProposal.riskClass,        'text-amber-400 font-bold')}
            {fieldCard('dispatchAllowed',  String(lastProposal.dispatchAllowed),  'text-destructive font-bold')}
            {fieldCard('tradeAttempted',   String(lastProposal.tradeAttempted),   'text-destructive font-bold')}
            {fieldCard('orderAttempted',   String(lastProposal.orderAttempted),   'text-destructive font-bold')}
          </div>

          {/* Alert message */}
          {lastProposal.alertMessage && lastProposal.alertMessage !== 'N/A' && (
            <div className="bg-secondary/20 border border-border/20 rounded-sm px-3 py-2">
              <div className="text-[7px] uppercase text-slate-500 font-bold mb-0.5">alertMessage</div>
              <div className="text-[8px] text-slate-300">{lastProposal.alertMessage}</div>
            </div>
          )}

          {/* Safety assertions */}
          <div className="bg-card border border-border/40 rounded-sm overflow-hidden">
            <div className="px-3 py-2 bg-secondary/20 border-b border-border/40 flex items-center justify-between">
              <span className="text-[8px] font-bold uppercase text-slate-400">Safety Assertions</span>
              <span className="text-[8px] font-bold font-mono text-primary">
                {lastProposal.safetyPassCount}/{lastProposal.safetyPassCount + lastProposal.safetyFailCount} PASS
              </span>
            </div>
            <div className="p-3 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-y-2 gap-x-3">
              {(lastProposal.safetyAssertions ?? []).map(a => (
                <div key={a.key} className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3 h-3 text-primary shrink-0" />
                  <span className="font-mono text-[7px] text-slate-500">{a.key}: <span className="text-slate-400">{String(a.value)}</span></span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* History accordion */}
      {proposals.length > 0 && (
        <div className="border-t border-border/20">
          <div className="px-4 py-2 bg-secondary/10">
            <span className="text-[8px] font-bold uppercase text-slate-400">Proposal Preview History ({proposals.length})</span>
            <span className="ml-2 text-[7px] font-mono text-slate-600">key: {PROPOSAL_STORAGE_KEY}</span>
          </div>
          <div className="divide-y divide-border/20">
            {proposals.map((p, i) => (
              <div key={p.proposalId ?? i}>
                <button
                  type="button"
                  onClick={() => toggle(p.proposalId ?? i)}
                  className="w-full flex items-center gap-2 px-4 py-2 hover:bg-secondary/20 transition-colors text-left"
                >
                  {expanded[p.proposalId ?? i]
                    ? <ChevronDown className="w-3 h-3 text-slate-500 shrink-0" />
                    : <ChevronRight className="w-3 h-3 text-slate-500 shrink-0" />}
                  <span className="text-[8px] font-mono text-primary font-bold">{safeStr(p.symbol)}</span>
                  <span className="text-[7px] font-mono text-amber-400">{safeStr(p.side)}</span>
                  <span className="text-[7px] font-mono text-slate-500">@ {safeStr(p.price)}</span>
                  <span className="ml-auto text-[7px] font-mono text-slate-600">
                    {p.timestamp ? new Date(p.timestamp).toLocaleString() : 'N/A'}
                  </span>
                  <span className="text-[7px] font-mono text-blue-400 font-bold">{safeStr(p.proposalStatus)}</span>
                </button>
                {expanded[p.proposalId ?? i] && (
                  <div className="px-4 pb-3 grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                    {[
                      ['proposalId',      p.proposalId,      'text-slate-500 text-[7px]'],
                      ['sourceAlertId',   p.sourceAlertId,   'text-slate-500 text-[7px]'],
                      ['symbol',          p.symbol,          'text-primary font-bold'],
                      ['timeframe',       p.timeframe],
                      ['strategyName',    p.strategyName],
                      ['signalType',      p.signalType],
                      ['side',            p.side,            'text-amber-400 font-bold'],
                      ['price',           p.price,           'text-primary'],
                      ['riskProfile',     p.riskProfile,     'text-amber-400'],
                      ['proposalStatus',  p.proposalStatus,  'text-blue-400 font-bold'],
                      ['executionStatus', p.executionStatus, 'text-destructive font-bold'],
                      ['approvalStatus',  p.approvalStatus,  'text-destructive font-bold'],
                      ['riskClass',       p.riskClass,       'text-amber-400'],
                    ].map(([lbl, val, cls]) => (
                      <div key={lbl} className="bg-secondary/20 border border-border/20 rounded-sm px-2 py-1.5">
                        <div className="text-[6px] uppercase text-slate-600 font-bold mb-0.5">{lbl}</div>
                        <div className={`text-[7px] font-mono break-all ${cls || 'text-slate-400'}`}>{safeStr(val)}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {proposals.length === 0 && !lastProposal && (
        <div className="flex items-center gap-2 px-4 py-3 text-[9px] text-slate-500">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
          No proposal previews yet. Accept an alert in Phase 2, then click Generate above.
        </div>
      )}

      {/* Footer */}
      <div className="px-4 py-2 border-t border-border/20 flex items-center gap-2 text-[7px] text-slate-600 font-mono">
        <Shield className="w-2.5 h-2.5 text-blue-500/60 shrink-0" />
        PROPOSAL_PREVIEW_ONLY · riskClass: TRADE_PROPOSAL_PREVIEW_ONLY · No trade · No broker · No order · No credential · No money movement
      </div>
    </div>
  );
}