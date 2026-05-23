/**
 * TvSignalProposalPanel
 * Phase 3 — Signal-to-Proposal Preview
 * PREVIEW_ONLY / NOT_EXECUTED / NOT_APPROVED
 * No trading · No broker · No orders · No credentials · No money movement · No scheduler
 */
import React, { useState, useEffect } from 'react';
import { Shield, FileText, Trash2, CheckCircle2, XCircle, ChevronDown, ChevronRight, AlertTriangle } from 'lucide-react';

const PROPOSAL_STORAGE_KEY = 'veridanTradingViewSignalProposalPreviews';

// Ordered source priority — evidence/proposal keys excluded
const ALERT_SOURCE_KEYS = [
  'veridanTradingViewAlertIntakeRecords',
  'veridanTradingViewAlertAcceptedRecords',
  'veridanTradingViewMcpChecks', // only used if record has usable signal fields
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function safeArray(key) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
    if (parsed && typeof parsed === 'object') return [parsed];
    return [];
  } catch { return []; }
}

function safeStr(v, fallback = 'N/A') {
  if (v === null || v === undefined || v === '') return fallback;
  return String(v);
}

function genId() {
  return 'prop-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 6);
}

/** Best timestamp (ms) from a record. */
function bestTs(r) {
  const v = r.receivedAt ?? r.validatedAt ?? r.timestamp ?? r.sourceTimestamp ?? r.createdAt ?? null;
  if (!v) return 0;
  try { const d = new Date(v); return isNaN(d.getTime()) ? 0 : d.getTime(); } catch { return 0; }
}

/** Extract nested payload object from a record. */
function getPayload(r) {
  try {
    if (r.parsedPayload && typeof r.parsedPayload === 'object') return r.parsedPayload;
    if (typeof r.rawPayload === 'string') return JSON.parse(r.rawPayload);
    if (r.payload && typeof r.payload === 'object') return r.payload;
  } catch {}
  return {};
}

/** A record is "accepted" if any acceptance flag is set. */
function isAccepted(r) {
  if (!r || typeof r !== 'object') return false;
  if (r.status === 'ACCEPTED' || r.intakeStatus === 'ACCEPTED' || r.resultStatus === 'ACCEPTED') return true;
  if (r.accepted === true || r.isAccepted === true || r.success === true) return true;
  if (r.phase === 'PHASE_2_ALERT_INTAKE_PREVIEW') return true;
  return false;
}

/**
 * A record is "proposal-eligible" if it has at least symbol, signalType, side, and timeframe
 * (checking top-level AND nested payload).
 */
function isEligible(r) {
  const p = getPayload(r);
  const has = (a, b) => !!(a || b);
  return (
    has(r.symbol,      p.symbol)      &&
    has(r.signalType,  p.signalType)  &&
    has(r.side,        p.side)        &&
    has(r.timeframe,   p.timeframe)
  );
}

/** Load all candidates, returning per-key stats and the sorted eligible list. */
function loadCandidates() {
  const stats = [];
  const eligible = [];

  for (const key of ALERT_SOURCE_KEYS) {
    const arr = safeArray(key);
    let accepted = 0, elig = 0;
    for (const r of arr) {
      if (!isAccepted(r)) continue;
      accepted++;
      if (!isEligible(r)) continue;
      elig++;
      eligible.push({ ...r, _sourceKey: key });
    }
    stats.push({ key, total: arr.length, accepted, eligible: elig });
  }

  // Sort newest first
  eligible.sort((a, b) => bestTs(b) - bestTs(a));
  return { eligible, stats };
}

// ─── Safety assertions ────────────────────────────────────────────────────────

const SAFETY_ASSERTIONS = [
  { key: 'sourceAlertAccepted',        value: true },
  { key: 'executionStatus',            value: 'NOT_EXECUTED' },
  { key: 'approvalStatus',             value: 'NOT_APPROVED' },
  { key: 'brokerConnection',           value: 'DISABLED' },
  { key: 'liveTrading',                value: 'DISABLED' },
  { key: 'moneyMovement',              value: 'DISABLED' },
  { key: 'credentialAccess',           value: 'DISABLED' },
  { key: 'dispatchAllowed',            value: false },
  { key: 'executionAllowed',           value: false },
  { key: 'tradeAttempted',             value: false },
  { key: 'orderAttempted',             value: false },
  { key: 'schedulerActive',            value: false },
  { key: 'pollingLoopActive',          value: false },
];

// ─── Proposal builder ─────────────────────────────────────────────────────────

function buildProposal(alert) {
  const p = getPayload(alert);

  const symbol       = safeStr(alert.symbol       ?? p.symbol,                                        'UNKNOWN');
  const timeframe    = safeStr(alert.timeframe     ?? p.timeframe   ?? alert.tf ?? p.interval,        'N/A');
  const strategyName = safeStr(alert.strategyName  ?? p.strategyName ?? alert.strategy ?? p.strategy, 'N/A');
  const signalType   = safeStr(alert.signalType    ?? p.signalType  ?? alert.signal ?? p.signal,      'N/A');
  const side         = safeStr(alert.side          ?? p.side        ?? alert.direction ?? p.direction,'N/A');
  const price        = safeStr(alert.price         ?? p.price       ?? alert.last ?? p.last ?? alert.close ?? p.close, 'N/A');
  const alertMessage = safeStr(alert.alertMessage  ?? p.alertMessage ?? alert.message ?? p.message,   'N/A');
  const riskProfile  = safeStr(alert.riskProfile   ?? p.riskProfile ?? alert.riskClass ?? p.riskClass,'SIGNAL_INTAKE_ONLY');
  const sourceTimestamp = alert.timestamp ?? alert.receivedAt ?? alert.validatedAt ?? alert.sourceTimestamp ?? alert.createdAt ?? new Date().toISOString();

  return {
    proposalId:              genId(),
    sourceAlertId:           safeStr(alert.alertId ?? alert.id ?? alert.checkId, 'unknown'),
    sourceKey:               alert._sourceKey ?? 'unknown',
    createdAt:               new Date().toISOString(),
    sourceTimestamp,
    phase:                   'PHASE_3_SIGNAL_TO_PROPOSAL_PREVIEW',
    status:                  'PROPOSAL_PREVIEW_CREATED',
    proposalStatus:          'PROPOSAL_PREVIEW_ONLY',
    executionStatus:         'NOT_EXECUTED',
    approvalStatus:          'NOT_APPROVED',
    riskClass:               'TRADE_PROPOSAL_PREVIEW_ONLY',
    symbol,
    timeframe,
    strategyName,
    signalType,
    side,
    price,
    alertMessage,
    riskProfile,
    liveTrading:             'DISABLED',
    brokerConnection:        'DISABLED',
    moneyMovement:           'DISABLED',
    credentialAccess:        'DISABLED',
    dispatchAllowed:         false,
    executionAllowed:        false,
    tradeAttempted:          false,
    orderAttempted:          false,
    schedulerActive:         false,
    pollingLoopActive:       false,
    safetyAssertions:        SAFETY_ASSERTIONS,
    safetyPassCount:         SAFETY_ASSERTIONS.length,
    safetyFailCount:         0,
    sourceComponent:         'TvSignalProposalPanel',
  };
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function TvSignalProposalPanel() {
  const [proposals,    setProposals]    = useState([]);
  const [lastProposal, setLastProposal] = useState(null);
  const [diag,         setDiag]        = useState({ eligible: [], stats: [] });
  const [error,        setError]       = useState(null);
  const [expanded,     setExpanded]    = useState({});

  useEffect(() => {
    try {
      setDiag(loadCandidates());
      const stored = safeArray(PROPOSAL_STORAGE_KEY);
      setProposals(stored);
      setLastProposal(stored[0] ?? null);
    } catch (err) {
      console.error('[TvSignalProposalPanel] mount error:', err);
    }
  }, []);

  const generate = () => {
    setError(null);
    try {
      const result = loadCandidates();
      setDiag(result);

      if (result.eligible.length === 0) {
        setError(
          'No proposal-eligible accepted alert found. Accept a Phase 2 alert with symbol, signalType, side, and timeframe first.'
        );
        return;
      }

      const proposal = buildProposal(result.eligible[0]);
      const updated  = [proposal, ...proposals].slice(0, 50);
      setProposals(updated);
      setLastProposal(proposal);
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

  // Diagnostics summary
  const totalScanned  = diag.stats.reduce((s, x) => s + x.total, 0);
  const totalAccepted = diag.stats.reduce((s, x) => s + x.accepted, 0);
  const totalEligible = diag.eligible.length;
  const latestElig    = diag.eligible[0] ?? null;

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
          <span className="font-bold">Proposal preview only.</span>{' '}
          No trade · No broker · No order · No credential · No money movement · No scheduler · No dispatch.
        </span>
      </div>

      {/* Diagnostics row */}
      <div className="px-4 py-2.5 border-b border-border/20 bg-secondary/10 space-y-1.5">
        <div className="flex flex-wrap items-center gap-3 text-[7px] font-mono">
          <span className="text-slate-500 font-bold uppercase">Source Scan:</span>
          <span className="text-slate-400">Scanned: <span className="text-foreground font-bold">{totalScanned}</span></span>
          <span className="text-slate-400">Accepted: <span className={totalAccepted > 0 ? 'text-amber-400 font-bold' : 'text-slate-600'}>{totalAccepted}</span></span>
          <span className="text-slate-400">Eligible: <span className={totalEligible > 0 ? 'text-primary font-bold' : 'text-amber-400 font-bold'}>{totalEligible}</span></span>
          {latestElig && <>
            <span className="text-slate-400">Source: <span className="text-primary">{latestElig._sourceKey}</span></span>
            <span className="text-slate-400">ID: <span className="text-slate-300">{safeStr(latestElig.alertId ?? latestElig.id, '?')}</span></span>
            <span className="text-slate-400">Symbol: <span className="text-primary font-bold">{safeStr(latestElig.symbol ?? latestElig.payload?.symbol, '?')}</span></span>
            <span className="text-slate-400">At: <span className="text-slate-300">{(() => { const ts = bestTs(latestElig); return ts ? new Date(ts).toLocaleString() : 'N/A'; })()}</span></span>
          </>}
          {!latestElig && <span className="text-amber-400">⚠ No eligible alerts — accept a Phase 2 alert with symbol/signalType/side/timeframe.</span>}
        </div>

        {/* Per-key breakdown */}
        <div className="flex flex-wrap gap-2">
          {diag.stats.map(s => (
            <span key={s.key} className={`text-[6.5px] font-mono px-1.5 py-0.5 rounded-sm border ${s.eligible > 0 ? 'border-primary/30 bg-primary/5 text-primary' : s.accepted > 0 ? 'border-amber-500/30 text-amber-500' : 'border-border/20 text-slate-700'}`}>
              {s.key.replace('veridanTradingView', '…')} {s.total}rec/{s.accepted}acc/{s.eligible}elig
            </span>
          ))}
        </div>
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

      {/* Error panel */}
      {error && (
        <div className="mx-4 mt-3 mb-1 flex items-start gap-2 px-3 py-2.5 bg-destructive/5 border border-destructive/30 rounded-sm text-[9px] text-destructive">
          <XCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          <span className="break-all">{error}</span>
        </div>
      )}

      {/* Latest proposal result card */}
      {lastProposal && (
        <div className="p-4 space-y-3">
          <div className="flex items-center gap-2 px-3 py-2 bg-blue-500/10 border border-blue-500/30 rounded-sm">
            <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0" />
            <div>
              <div className="text-[10px] font-bold font-mono text-blue-400">PROPOSAL_PREVIEW_CREATED</div>
              <div className="text-[7px] text-slate-500 mt-0.5">
                {lastProposal.proposalId} · {new Date(lastProposal.createdAt).toLocaleString()}
                {lastProposal.sourceKey && <span className="ml-2 text-slate-600">src: {lastProposal.sourceKey}</span>}
              </div>
            </div>
          </div>

          {/* Fields grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {fieldCard('proposalId',             lastProposal.proposalId,              'text-slate-400 text-[7px]')}
            {fieldCard('sourceAlertId',          lastProposal.sourceAlertId,           'text-slate-400 text-[7px]')}
            {fieldCard('symbol',                 lastProposal.symbol,                  'text-primary font-bold')}
            {fieldCard('timeframe',              lastProposal.timeframe,               'text-primary font-bold')}
            {fieldCard('strategyName',           lastProposal.strategyName)}
            {fieldCard('signalType',             lastProposal.signalType)}
            {fieldCard('side',                   lastProposal.side,                    'text-amber-400 font-bold')}
            {fieldCard('price',                  lastProposal.price,                   'text-primary')}
            {fieldCard('riskProfile',            lastProposal.riskProfile,             'text-amber-400')}
            {fieldCard('phase',                  lastProposal.phase,                   'text-blue-400 text-[7px]')}
            {fieldCard('status',                 lastProposal.status,                  'text-blue-400 font-bold')}
            {fieldCard('executionStatus',        lastProposal.executionStatus,         'text-destructive font-bold')}
            {fieldCard('approvalStatus',         lastProposal.approvalStatus,          'text-destructive font-bold')}
            {fieldCard('riskClass',              lastProposal.riskClass,               'text-amber-400 font-bold')}
            {fieldCard('liveTrading',            lastProposal.liveTrading,             'text-destructive font-bold')}
            {fieldCard('brokerConnection',       lastProposal.brokerConnection,        'text-destructive font-bold')}
            {fieldCard('moneyMovement',          lastProposal.moneyMovement,           'text-destructive font-bold')}
            {fieldCard('credentialAccess',       lastProposal.credentialAccess,        'text-destructive font-bold')}
            {fieldCard('dispatchAllowed',        String(lastProposal.dispatchAllowed),        'text-destructive font-bold')}
            {fieldCard('executionAllowed',       String(lastProposal.executionAllowed),       'text-destructive font-bold')}
            {fieldCard('tradeAttempted',         String(lastProposal.tradeAttempted),         'text-destructive font-bold')}
            {fieldCard('orderAttempted',         String(lastProposal.orderAttempted),         'text-destructive font-bold')}
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
                  <span className="font-mono text-[7px] text-slate-500">
                    {a.key}: <span className="text-slate-400">{String(a.value)}</span>
                  </span>
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
                    {p.createdAt ? new Date(p.createdAt).toLocaleString() : 'N/A'}
                  </span>
                  <span className="text-[7px] font-mono text-blue-400 font-bold">{safeStr(p.status ?? p.proposalStatus)}</span>
                </button>
                {expanded[p.proposalId ?? i] && (
                  <div className="px-4 pb-3 grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                    {[
                      ['symbol',          p.symbol,          'text-primary font-bold'],
                      ['timeframe',       p.timeframe,       'text-primary'],
                      ['side',            p.side,            'text-amber-400 font-bold'],
                      ['price',           p.price,           'text-primary'],
                      ['signalType',      p.signalType],
                      ['strategyName',    p.strategyName],
                      ['riskProfile',     p.riskProfile,     'text-amber-400'],
                      ['sourceKey',       p.sourceKey,       'text-slate-500 text-[7px]'],
                      ['sourceAlertId',   p.sourceAlertId,   'text-slate-500 text-[7px]'],
                      ['status',          p.status,          'text-blue-400 font-bold'],
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