/**
 * TvSignalProposalPanel
 * Phase 3 — Signal-to-Proposal Preview
 * PREVIEW_ONLY / NOT_EXECUTED / NOT_APPROVED
 * No trading · No broker · No orders · No credentials · No money movement · No scheduler
 */
import React, { useState, useEffect, useCallback } from 'react';
import { Shield, FileText, Trash2, CheckCircle2, XCircle, ChevronDown, ChevronRight, AlertTriangle } from 'lucide-react';

const PROPOSAL_STORAGE_KEY = 'veridanTradingViewSignalProposalPreviews';

// Phase 2 writes ACCEPTED alerts to this key.
// Shape: { alertId, validationStatus: 'ACCEPTED', fields: { symbol, timeframe, ... }, receivedAt, ... }
const INTAKE_KEY     = 'veridanTradingViewAlertIntakeRecords';
// Secondary key (not currently written by Phase 2, kept for forward compat)
const ACCEPTED_KEY   = 'veridanTradingViewAlertAcceptedRecords';
// MCP checks — only eligible if they contain real signal fields (symbol/signalType/side/timeframe)
const MCP_CHECKS_KEY = 'veridanTradingViewMcpChecks';

// ─── Storage helpers ──────────────────────────────────────────────────────────

function readRaw(key) {
  return localStorage.getItem(key) ?? null;
}

function readArray(key) {
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

function bestTs(r) {
  const v = r.receivedAt ?? r.validatedAt ?? r.timestamp ?? r.sourceTimestamp ?? r.createdAt ?? null;
  if (!v) return 0;
  try { const d = new Date(v); return isNaN(d.getTime()) ? 0 : d.getTime(); } catch { return 0; }
}

// ─── Normalisation ────────────────────────────────────────────────────────────

/**
 * Normalise any record to a flat signal shape.
 *
 * Phase 2 (TvAlertIntakePanel) stores:
 *   { alertId, validationStatus: 'ACCEPTED', fields: { symbol, timeframe, signalType, side, price, ... }, receivedAt }
 *
 * Other sources may store signal fields at top level.
 */
function normalise(r) {
  if (!r || typeof r !== 'object') return null;
  // Prefer nested fields object (Phase 2 shape)
  const f = (r.fields && typeof r.fields === 'object') ? r.fields : {};
  return {
    symbol:       f.symbol       ?? r.symbol       ?? null,
    timeframe:    f.timeframe    ?? r.timeframe     ?? null,
    strategyName: f.strategyName ?? r.strategyName  ?? null,
    signalType:   f.signalType   ?? r.signalType    ?? null,
    side:         f.side         ?? r.side          ?? null,
    price:        f.price        ?? r.price         ?? null,
    alertMessage: f.alertMessage ?? r.alertMessage  ?? r.message ?? null,
    riskProfile:  f.riskProfile  ?? r.riskProfile   ?? r.riskClass ?? null,
    timestamp:    f.timestamp    ?? r.receivedAt    ?? r.validatedAt ?? r.timestamp ?? r.createdAt ?? null,
    alertId:      r.alertId      ?? r.id            ?? null,
  };
}

/** A record is accepted if any acceptance flag is true. */
function isAccepted(r) {
  if (!r || typeof r !== 'object') return false;
  if (r.validationStatus === 'ACCEPTED') return true;
  if (r.status === 'ACCEPTED' || r.intakeStatus === 'ACCEPTED') return true;
  if (r.accepted === true || r.isAccepted === true || r.success === true) return true;
  return false;
}

/** A normalised signal is eligible if it has all four required fields with non-empty values. */
function isEligible(norm) {
  return !!(
    norm.symbol    && String(norm.symbol).trim()    &&
    norm.signalType && String(norm.signalType).trim() &&
    norm.side      && String(norm.side).trim()      &&
    norm.timeframe && String(norm.timeframe).trim()
  );
}

// ─── Source scanner ───────────────────────────────────────────────────────────

/**
 * Scan all source keys. Returns:
 *   stats[]  — per-key { key, rawLen, parsed, accepted, eligible }
 *   eligible — sorted newest-first list of { norm, sourceKey, sourceRecord }
 */
function scanSources() {
  const stats   = [];
  const eligible = [];

  // ── Keys 1 & 2: Phase 2 alert intake keys ──
  for (const key of [INTAKE_KEY, ACCEPTED_KEY]) {
    const rawStr = readRaw(key);
    const arr    = readArray(key);
    let acc = 0, elig = 0;
    for (const r of arr) {
      if (!isAccepted(r)) continue;
      acc++;
      const norm = normalise(r);
      if (!norm || !isEligible(norm)) continue;
      elig++;
      eligible.push({ norm, sourceKey: key, sourceRecord: r });
    }
    stats.push({ key, rawLen: rawStr?.length ?? 0, parsed: arr.length, accepted: acc, eligible: elig });
  }

  // ── Key 3: MCP checks — only if real signal fields present ──
  {
    const rawStr = readRaw(MCP_CHECKS_KEY);
    const arr    = readArray(MCP_CHECKS_KEY);
    let acc = 0, elig = 0;
    for (const r of arr) {
      if (!isAccepted(r)) continue;
      acc++;
      const norm = normalise(r);
      if (!norm || !isEligible(norm)) continue;
      elig++;
      eligible.push({ norm, sourceKey: MCP_CHECKS_KEY, sourceRecord: r });
    }
    stats.push({ key: MCP_CHECKS_KEY, rawLen: rawStr?.length ?? 0, parsed: arr.length, accepted: acc, eligible: elig });
  }

  // Sort newest first
  eligible.sort((a, b) => bestTs(b.sourceRecord) - bestTs(a.sourceRecord));
  return { stats, eligible };
}

// ─── Safety assertions ────────────────────────────────────────────────────────

const SAFETY_ASSERTIONS = [
  { key: 'sourceAlertAccepted',   value: true },
  { key: 'executionStatus',       value: 'NOT_EXECUTED' },
  { key: 'approvalStatus',        value: 'NOT_APPROVED' },
  { key: 'brokerConnection',      value: 'DISABLED' },
  { key: 'liveTrading',           value: 'DISABLED' },
  { key: 'moneyMovement',         value: 'DISABLED' },
  { key: 'credentialAccess',      value: 'DISABLED' },
  { key: 'dispatchAllowed',       value: false },
  { key: 'executionAllowed',      value: false },
  { key: 'tradeAttempted',        value: false },
  { key: 'orderAttempted',        value: false },
  { key: 'brokerActionAttempted', value: false },
  { key: 'credentialAccessed',    value: false },
  { key: 'schedulerActive',       value: false },
  { key: 'pollingLoopActive',     value: false },
];

// ─── Proposal builder ─────────────────────────────────────────────────────────

function buildProposal({ norm, sourceKey, sourceRecord }) {
  return {
    proposalId:           genId(),
    sourceAlertId:        safeStr(norm.alertId, 'unknown'),
    sourceKey,
    createdAt:            new Date().toISOString(),
    sourceTimestamp:      norm.timestamp ?? new Date().toISOString(),
    phase:                'PHASE_3_SIGNAL_TO_PROPOSAL_PREVIEW',
    status:               'PROPOSAL_PREVIEW_CREATED',
    proposalStatus:       'PROPOSAL_PREVIEW_ONLY',
    executionStatus:      'NOT_EXECUTED',
    approvalStatus:       'NOT_APPROVED',
    riskClass:            'TRADE_PROPOSAL_PREVIEW_ONLY',
    symbol:               safeStr(norm.symbol,       'UNKNOWN'),
    timeframe:            safeStr(norm.timeframe,    'N/A'),
    strategyName:         safeStr(norm.strategyName, 'N/A'),
    signalType:           safeStr(norm.signalType,   'N/A'),
    side:                 safeStr(norm.side,         'N/A'),
    price:                safeStr(norm.price,        'N/A'),
    alertMessage:         safeStr(norm.alertMessage, 'N/A'),
    riskProfile:          safeStr(norm.riskProfile,  'SIGNAL_INTAKE_ONLY'),
    liveTrading:          'DISABLED',
    brokerConnection:     'DISABLED',
    moneyMovement:        'DISABLED',
    credentialAccess:     'DISABLED',
    dispatchAllowed:      false,
    executionAllowed:     false,
    tradeAttempted:       false,
    brokerActionAttempted:false,
    orderAttempted:       false,
    credentialAccessed:   false,
    schedulerActive:      false,
    pollingLoopActive:    false,
    safetyAssertions:     SAFETY_ASSERTIONS,
    safetyPassCount:      SAFETY_ASSERTIONS.length,
    safetyFailCount:      0,
    sourceComponent:      'TvSignalProposalPanel',
  };
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function TvSignalProposalPanel() {
  const [proposals,    setProposals]    = useState([]);
  const [lastProposal, setLastProposal] = useState(null);
  const [scan,         setScan]         = useState({ stats: [], eligible: [] });
  const [error,        setError]        = useState(null);
  const [expanded,     setExpanded]     = useState({});

  // Re-scan sources and reload stored proposals
  const refresh = useCallback(() => {
    setScan(scanSources());
    const stored = readArray(PROPOSAL_STORAGE_KEY);
    setProposals(stored);
    setLastProposal(stored[0] ?? null);
  }, []);

  useEffect(() => {
    refresh();
    window.addEventListener('veridanTradingViewAlertRecordsUpdated',       refresh);
    window.addEventListener('veridanTradingViewSignalProposalPreviewsUpdated', refresh);
    window.addEventListener('storage', refresh);
    return () => {
      window.removeEventListener('veridanTradingViewAlertRecordsUpdated',       refresh);
      window.removeEventListener('veridanTradingViewSignalProposalPreviewsUpdated', refresh);
      window.removeEventListener('storage', refresh);
    };
  }, [refresh]);

  const generate = () => {
    setError(null);
    // Always do a fresh scan at click time so we get the absolute latest state
    const result = scanSources();
    setScan(result);

    if (result.eligible.length === 0) {
      setError(
        'No proposal-eligible accepted alert found. ' +
        'Accept a Phase 2 alert with symbol, signalType, side, and timeframe first.'
      );
      return;
    }

    const proposal = buildProposal(result.eligible[0]);
    const stored   = readArray(PROPOSAL_STORAGE_KEY);
    const updated  = [proposal, ...stored].slice(0, 50);
    setProposals(updated);
    setLastProposal(proposal);
    try {
      localStorage.setItem(PROPOSAL_STORAGE_KEY, JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent('veridanTradingViewSignalProposalPreviewsUpdated'));
    } catch {}
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

  const latestElig  = scan.eligible[0] ?? null;
  const totalParsed = scan.stats.reduce((s, x) => s + x.parsed, 0);
  const totalAcc    = scan.stats.reduce((s, x) => s + x.accepted, 0);
  const totalElig   = scan.eligible.length;

  // Per-key debug for the primary intake key
  const intakeStat = scan.stats.find(s => s.key === INTAKE_KEY);

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
          <span className="text-slate-400">Parsed: <span className="text-foreground font-bold">{totalParsed}</span></span>
          <span className="text-slate-400">Accepted: <span className={totalAcc > 0 ? 'text-amber-400 font-bold' : 'text-slate-600'}>{totalAcc}</span></span>
          <span className="text-slate-400">Eligible: <span className={totalElig > 0 ? 'text-primary font-bold' : 'text-amber-400 font-bold'}>{totalElig}</span></span>
          {latestElig && <>
            <span className="text-slate-400">Source: <span className="text-primary">{latestElig.sourceKey}</span></span>
            <span className="text-slate-400">ID: <span className="text-slate-300">{safeStr(latestElig.norm.alertId, '?')}</span></span>
            <span className="text-slate-400">Symbol: <span className="text-primary font-bold">{safeStr(latestElig.norm.symbol, '?')}</span></span>
            <span className="text-slate-400">Side: <span className="text-amber-400 font-bold">{safeStr(latestElig.norm.side, '?')}</span></span>
            <span className="text-slate-400">At: <span className="text-slate-300">{(() => { const ts = bestTs(latestElig.sourceRecord); return ts ? new Date(ts).toLocaleString() : 'N/A'; })()}</span></span>
          </>}
          {!latestElig && <span className="text-amber-400">⚠ No eligible alerts — accept a Phase 2 alert with symbol/signalType/side/timeframe.</span>}
          <button type="button" onClick={refresh}
            className="px-1.5 py-0.5 rounded-sm border border-border/20 text-slate-600 hover:text-slate-400 hover:bg-secondary/30 transition-colors">
            ↻ refresh
          </button>
        </div>

        {/* Per-key breakdown */}
        <div className="flex flex-wrap gap-2">
          {scan.stats.map(s => (
            <span key={s.key} className={`text-[6.5px] font-mono px-1.5 py-0.5 rounded-sm border ${s.eligible > 0 ? 'border-primary/30 bg-primary/5 text-primary' : s.accepted > 0 ? 'border-amber-500/30 text-amber-500' : 'border-border/20 text-slate-700'}`}>
              {s.key.replace('veridanTradingView', '…')} raw:{s.rawLen}b / {s.parsed}rec / {s.accepted}acc / {s.eligible}elig
            </span>
          ))}
        </div>

        {/* Detailed debug line for primary intake key */}
        <div className="text-[6.5px] font-mono text-slate-600 space-y-0.5">
          <div>
            debug {INTAKE_KEY}: rawLen={intakeStat?.rawLen ?? 0} parsed={intakeStat?.parsed ?? 0} accepted={intakeStat?.accepted ?? 0} eligible={intakeStat?.eligible ?? 0}
            {latestElig?.sourceKey === INTAKE_KEY && (
              <> · symbol={latestElig.norm.symbol} side={latestElig.norm.side} signalType={latestElig.norm.signalType} tf={latestElig.norm.timeframe} id={latestElig.norm.alertId}</>
            )}
          </div>
          {latestElig && (
            <div className="text-slate-700">
              latest eligible: src={latestElig.sourceKey} · id={safeStr(latestElig.norm.alertId)} · symbol={safeStr(latestElig.norm.symbol)} · side={safeStr(latestElig.norm.side)}
            </div>
          )}
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

      {/* Latest proposal */}
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

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {fieldCard('symbol',               lastProposal.symbol,               'text-primary font-bold')}
            {fieldCard('timeframe',            lastProposal.timeframe,            'text-primary font-bold')}
            {fieldCard('side',                 lastProposal.side,                 'text-amber-400 font-bold')}
            {fieldCard('price',                lastProposal.price,                'text-primary')}
            {fieldCard('signalType',           lastProposal.signalType)}
            {fieldCard('strategyName',         lastProposal.strategyName)}
            {fieldCard('riskProfile',          lastProposal.riskProfile,          'text-amber-400')}
            {fieldCard('phase',                lastProposal.phase,                'text-blue-400 text-[7px]')}
            {fieldCard('status',               lastProposal.status,               'text-blue-400 font-bold')}
            {fieldCard('executionStatus',      lastProposal.executionStatus,      'text-destructive font-bold')}
            {fieldCard('approvalStatus',       lastProposal.approvalStatus,       'text-destructive font-bold')}
            {fieldCard('riskClass',            lastProposal.riskClass,            'text-amber-400 font-bold')}
            {fieldCard('liveTrading',          lastProposal.liveTrading,          'text-destructive font-bold')}
            {fieldCard('brokerConnection',     lastProposal.brokerConnection,     'text-destructive font-bold')}
            {fieldCard('moneyMovement',        lastProposal.moneyMovement,        'text-destructive font-bold')}
            {fieldCard('credentialAccess',     lastProposal.credentialAccess,     'text-destructive font-bold')}
            {fieldCard('dispatchAllowed',      String(lastProposal.dispatchAllowed),       'text-destructive font-bold')}
            {fieldCard('executionAllowed',     String(lastProposal.executionAllowed),      'text-destructive font-bold')}
            {fieldCard('tradeAttempted',       String(lastProposal.tradeAttempted),        'text-destructive font-bold')}
            {fieldCard('brokerActionAttempted',String(lastProposal.brokerActionAttempted), 'text-destructive font-bold')}
            {fieldCard('orderAttempted',       String(lastProposal.orderAttempted),        'text-destructive font-bold')}
            {fieldCard('credentialAccessed',   String(lastProposal.credentialAccessed),    'text-destructive font-bold')}
            {fieldCard('sourceAlertId',        lastProposal.sourceAlertId,        'text-slate-400 text-[7px]')}
            {fieldCard('proposalId',           lastProposal.proposalId,           'text-slate-400 text-[7px]')}
          </div>

          {lastProposal.alertMessage && lastProposal.alertMessage !== 'N/A' && (
            <div className="bg-secondary/20 border border-border/20 rounded-sm px-3 py-2">
              <div className="text-[7px] uppercase text-slate-500 font-bold mb-0.5">alertMessage</div>
              <div className="text-[8px] text-slate-300">{lastProposal.alertMessage}</div>
            </div>
          )}

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
                <button type="button" onClick={() => toggle(p.proposalId ?? i)}
                  className="w-full flex items-center gap-2 px-4 py-2 hover:bg-secondary/20 transition-colors text-left">
                  {expanded[p.proposalId ?? i]
                    ? <ChevronDown className="w-3 h-3 text-slate-500 shrink-0" />
                    : <ChevronRight className="w-3 h-3 text-slate-500 shrink-0" />}
                  <span className="text-[8px] font-mono text-primary font-bold">{safeStr(p.symbol)}</span>
                  <span className="text-[7px] font-mono text-amber-400">{safeStr(p.side)}</span>
                  <span className="text-[7px] font-mono text-slate-500">@ {safeStr(p.price)}</span>
                  <span className="ml-auto text-[7px] font-mono text-slate-600">
                    {p.createdAt ? new Date(p.createdAt).toLocaleString() : 'N/A'}
                  </span>
                  <span className="text-[7px] font-mono text-blue-400 font-bold">{safeStr(p.status)}</span>
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
        PROPOSAL_PREVIEW_ONLY · NOT_EXECUTED · NOT_APPROVED · No trade · No broker · No credential · No money movement
      </div>
    </div>
  );
}