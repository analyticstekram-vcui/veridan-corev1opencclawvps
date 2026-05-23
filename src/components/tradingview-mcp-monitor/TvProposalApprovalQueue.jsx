/**
 * TvProposalApprovalQueue
 * Phase 4 — Trading Proposal Approval Queue
 * OPERATOR_GOVERNANCE_ONLY / NOT_EXECUTED / NO_TRADING / NO_BROKER / NO_CREDENTIALS
 * localStorage only — no API calls, no broker calls, no order creation, no money movement.
 */
import React, { useState, useEffect, useCallback } from 'react';
import { Shield, CheckCircle2, XCircle, AlertTriangle, ChevronDown, ChevronRight, ClipboardCheck } from 'lucide-react';

const PROPOSAL_KEY  = 'veridanTradingViewSignalProposalPreviews';
const APPROVAL_KEY  = 'veridanTradingViewProposalApprovalRecords';

const SAFETY_ASSERTIONS = [
  { key: 'executionStatus',            value: 'NOT_EXECUTED' },
  { key: 'liveTrading',                value: 'DISABLED' },
  { key: 'brokerConnection',           value: 'DISABLED' },
  { key: 'moneyMovement',              value: 'DISABLED' },
  { key: 'credentialAccess',           value: 'DISABLED' },
  { key: 'dispatchAllowed',            value: false },
  { key: 'executionAllowed',           value: false },
  { key: 'tradeAttempted',             value: false },
  { key: 'orderAttempted',             value: false },
  { key: 'schedulerActive',            value: false },
  { key: 'pollingLoopActive',          value: false },
  { key: 'apiCallMade',                value: false },
  { key: 'brokerCallMade',             value: false },
];

function readArray(key) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch { return []; }
}

function writeArray(key, arr) {
  try { localStorage.setItem(key, JSON.stringify(arr.slice(0, 200))); } catch {}
}

function safeStr(v, fallback = 'N/A') {
  if (v === null || v === undefined || v === '') return fallback;
  return String(v);
}

function genId() {
  return 'appr-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 6);
}

function buildApproval({ proposal, approvalStatus, operatorNote }) {
  const now = new Date().toISOString();
  const isApproved = approvalStatus === 'APPROVED_FOR_PAPER_TRADE_PREVIEW';

  return {
    approvalId:                genId(),
    proposalId:                safeStr(proposal.proposalId, 'unknown'),
    sourceAlertId:             safeStr(proposal.sourceAlertId, 'unknown'),
    symbol:                    safeStr(proposal.symbol, 'UNKNOWN'),
    timeframe:                 safeStr(proposal.timeframe, 'N/A'),
    side:                      safeStr(proposal.side, 'N/A'),
    price:                     safeStr(proposal.price, 'N/A'),
    signalType:                safeStr(proposal.signalType, 'N/A'),
    strategyName:              safeStr(proposal.strategyName, 'N/A'),
    riskProfile:               safeStr(proposal.riskProfile, 'N/A'),
    operatorNote:              operatorNote.trim() || null,
    createdAt:                 now,
    approvedAt:                isApproved ? now : null,
    reviewedAt:                !isApproved ? now : null,
    approvalStatus,
    executionStatus:           'NOT_EXECUTED',
    paperTradePreviewAllowed:  isApproved,
    liveTrading:               'DISABLED',
    brokerConnection:          'DISABLED',
    moneyMovement:             'DISABLED',
    credentialAccess:          'DISABLED',
    dispatchAllowed:           false,
    executionAllowed:          false,
    tradeAttempted:            false,
    orderAttempted:            false,
    schedulerActive:           false,
    pollingLoopActive:         false,
    apiCallMade:               false,
    brokerCallMade:            false,
    riskClass:                 'PAPER_TRADE_PREVIEW_ONLY',
    phase:                     'PHASE_4_PROPOSAL_APPROVAL_QUEUE',
    safetyAssertions:          SAFETY_ASSERTIONS,
    safetyPassCount:           SAFETY_ASSERTIONS.length,
    safetyFailCount:           0,
    sourceComponent:           'TvProposalApprovalQueue',
  };
}

const STATUS_STYLE = {
  APPROVED_FOR_PAPER_TRADE_PREVIEW: { cls: 'text-primary font-bold',     border: 'border-primary/30 bg-primary/5'      },
  REJECTED_BY_OPERATOR:             { cls: 'text-destructive font-bold', border: 'border-destructive/30 bg-destructive/5' },
  NEEDS_REVIEW:                     { cls: 'text-amber-400 font-bold',   border: 'border-amber-400/30 bg-amber-400/5'   },
};

export default function TvProposalApprovalQueue() {
  const [proposals,  setProposals]  = useState([]);
  const [approvals,  setApprovals]  = useState([]);
  const [selected,   setSelected]   = useState(null); // proposalId
  const [note,       setNote]       = useState('');
  const [lastResult, setLastResult] = useState(null);
  const [expanded,   setExpanded]   = useState({});

  const load = useCallback(() => {
    setProposals(readArray(PROPOSAL_KEY));
    setApprovals(readArray(APPROVAL_KEY));
  }, []);

  useEffect(() => {
    load();
    window.addEventListener('veridanTradingViewSignalProposalPreviews', load);
    window.addEventListener('veridanTradingViewAlertRecordsUpdated', load);
    window.addEventListener('storage', load);
    return () => {
      window.removeEventListener('veridanTradingViewSignalProposalPreviews', load);
      window.removeEventListener('veridanTradingViewAlertRecordsUpdated', load);
      window.removeEventListener('storage', load);
    };
  }, [load]);

  // Auto-select the latest proposal
  useEffect(() => {
    if (proposals.length > 0 && !selected) {
      setSelected(proposals[0].proposalId);
    }
  }, [proposals, selected]);

  const activeProposal = proposals.find(p => p.proposalId === selected) ?? proposals[0] ?? null;

  const submitApproval = (approvalStatus) => {
    if (!activeProposal) return;
    const record = buildApproval({ proposal: activeProposal, approvalStatus, operatorNote: note });
    const updated = [record, ...approvals].slice(0, 200);
    setApprovals(updated);
    writeArray(APPROVAL_KEY, updated);
    setLastResult(record);
    setNote('');
    try { window.dispatchEvent(new CustomEvent('veridanTradingViewProposalApprovalRecordsUpdated')); } catch {}
  };

  const toggle = (id) => setExpanded(prev => ({ ...prev, [id]: !prev[id] }));

  const fieldCard = (label, value, cls = 'text-slate-300') => (
    <div key={label} className="bg-secondary/20 border border-border/20 rounded-sm px-2.5 py-2">
      <div className="text-[7px] uppercase text-slate-500 font-bold mb-0.5">{label}</div>
      <div className={`text-[8px] font-mono break-all ${cls}`}>{safeStr(value)}</div>
    </div>
  );

  return (
    <div className="bg-card border border-purple-500/20 rounded-sm overflow-hidden">

      {/* Header */}
      <div className="px-4 py-2.5 bg-purple-500/5 border-b border-purple-500/20 flex items-center gap-2">
        <ClipboardCheck className="w-3.5 h-3.5 text-purple-400 shrink-0" />
        <span className="text-[9px] font-bold uppercase text-purple-400">Phase 4 — Proposal Approval Queue</span>
        <span className="ml-auto text-[7px] font-mono text-destructive font-bold">GOVERNANCE_ONLY · NOT_EXECUTED · NO_TRADING</span>
      </div>

      {/* Safety banner */}
      <div className="px-4 py-2.5 border-b border-border/20 flex items-start gap-2 bg-amber-500/5 text-[8px] text-amber-400">
        <Shield className="w-3.5 h-3.5 shrink-0 mt-0.5" />
        <span>
          <span className="font-bold">Operator governance only.</span>{' '}
          No trade · No broker · No order · No API call · No credential · No money movement · No scheduler · No dispatch.
          Approval = paper trade preview permission only — does NOT place any order.
        </span>
      </div>

      {/* Stats strip */}
      <div className="px-4 py-2.5 border-b border-border/20 grid grid-cols-3 sm:grid-cols-6 gap-2">
        {[
          { label: 'Proposals',  value: proposals.length,  cls: 'text-foreground font-bold' },
          { label: 'Approvals',  value: approvals.length,  cls: 'text-primary font-bold' },
          { label: 'Approved',   value: approvals.filter(a => a.approvalStatus === 'APPROVED_FOR_PAPER_TRADE_PREVIEW').length, cls: 'text-primary font-bold' },
          { label: 'Rejected',   value: approvals.filter(a => a.approvalStatus === 'REJECTED_BY_OPERATOR').length,             cls: 'text-destructive font-bold' },
          { label: 'Needs Review', value: approvals.filter(a => a.approvalStatus === 'NEEDS_REVIEW').length,                   cls: 'text-amber-400 font-bold' },
          { label: 'Live Trading', value: 'DISABLED', cls: 'text-destructive font-bold' },
        ].map(c => (
          <div key={c.label} className="bg-secondary/20 border border-border/20 rounded-sm px-2.5 py-2">
            <div className="text-[7px] uppercase text-slate-500 font-bold mb-0.5">{c.label}</div>
            <div className={`text-[9px] font-mono ${c.cls}`}>{String(c.value)}</div>
          </div>
        ))}
      </div>

      {/* No proposals */}
      {proposals.length === 0 && (
        <div className="flex items-center gap-2 px-4 py-4 text-[9px] text-slate-500">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
          No proposal previews found. Generate a proposal in Phase 3 first.
        </div>
      )}

      {/* Active proposal review */}
      {activeProposal && (
        <div className="p-4 space-y-3">

          {/* Proposal selector */}
          {proposals.length > 1 && (
            <div>
              <div className="text-[7px] uppercase text-slate-500 font-bold mb-1">Select Proposal</div>
              <select
                value={selected ?? ''}
                onChange={e => setSelected(e.target.value)}
                className="w-full px-3 py-2 bg-secondary/20 border border-border/40 text-foreground text-[9px] font-mono rounded-sm focus:outline-none focus:border-primary/50"
              >
                {proposals.map(p => (
                  <option key={p.proposalId} value={p.proposalId}>
                    {safeStr(p.symbol)} {safeStr(p.side)} @ {safeStr(p.price)} — {safeStr(p.signalType)} — {p.createdAt ? new Date(p.createdAt).toLocaleString() : 'N/A'}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Proposal fields */}
          <div className="text-[8px] font-bold uppercase text-slate-400">Proposal Under Review</div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {fieldCard('symbol',           activeProposal.symbol,          'text-primary font-bold')}
            {fieldCard('timeframe',        activeProposal.timeframe,       'text-primary font-bold')}
            {fieldCard('side',             activeProposal.side,            'text-amber-400 font-bold')}
            {fieldCard('price',            activeProposal.price,           'text-primary')}
            {fieldCard('signalType',       activeProposal.signalType)}
            {fieldCard('strategyName',     activeProposal.strategyName)}
            {fieldCard('riskProfile',      activeProposal.riskProfile,     'text-amber-400')}
            {fieldCard('executionStatus',  activeProposal.executionStatus, 'text-destructive font-bold')}
            {fieldCard('approvalStatus',   activeProposal.approvalStatus,  'text-destructive font-bold')}
            {fieldCard('liveTrading',      activeProposal.liveTrading,     'text-destructive font-bold')}
            {fieldCard('brokerConnection', activeProposal.brokerConnection,'text-destructive font-bold')}
            {fieldCard('moneyMovement',    activeProposal.moneyMovement,   'text-destructive font-bold')}
            {fieldCard('dispatchAllowed',  String(activeProposal.dispatchAllowed),  'text-destructive font-bold')}
            {fieldCard('executionAllowed', String(activeProposal.executionAllowed), 'text-destructive font-bold')}
            {fieldCard('tradeAttempted',   String(activeProposal.tradeAttempted),   'text-destructive font-bold')}
            {fieldCard('orderAttempted',   String(activeProposal.orderAttempted),   'text-destructive font-bold')}
            {fieldCard('proposalId',       activeProposal.proposalId,      'text-slate-500 text-[7px]')}
            {fieldCard('sourceAlertId',    activeProposal.sourceAlertId,   'text-slate-500 text-[7px]')}
            {fieldCard('createdAt',        activeProposal.createdAt ? new Date(activeProposal.createdAt).toLocaleString() : 'N/A')}
            {fieldCard('phase',            activeProposal.phase,           'text-blue-400 text-[7px]')}
          </div>

          {/* Operator note */}
          <div>
            <label className="text-[7px] uppercase tracking-widest text-slate-500 font-bold mb-1 block">
              Operator Note (optional)
            </label>
            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              rows={3}
              placeholder="Add governance rationale, risk notes, or review comments..."
              className="w-full px-3 py-2 bg-secondary/20 border border-border/40 text-foreground text-[9px] font-mono rounded-sm focus:outline-none focus:border-primary/50 resize-y"
            />
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => submitApproval('APPROVED_FOR_PAPER_TRADE_PREVIEW')}
              className="flex items-center gap-1.5 px-4 py-2 bg-primary/10 border border-primary/30 text-primary text-[9px] font-bold rounded-sm hover:bg-primary/20 transition-colors">
              <CheckCircle2 className="w-3 h-3" /> Approve For Paper Trade Preview
            </button>
            <button type="button" onClick={() => submitApproval('REJECTED_BY_OPERATOR')}
              className="flex items-center gap-1.5 px-4 py-2 bg-destructive/10 border border-destructive/30 text-destructive text-[9px] font-bold rounded-sm hover:bg-destructive/20 transition-colors">
              <XCircle className="w-3 h-3" /> Reject Proposal
            </button>
            <button type="button" onClick={() => submitApproval('NEEDS_REVIEW')}
              className="flex items-center gap-1.5 px-4 py-2 bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[9px] font-bold rounded-sm hover:bg-amber-500/20 transition-colors">
              <AlertTriangle className="w-3 h-3" /> Mark Needs Review
            </button>
          </div>

          {/* Paper trade preview note */}
          <div className="flex items-start gap-2 px-3 py-2 bg-secondary/20 border border-border/20 rounded-sm text-[7px] text-slate-500">
            <Shield className="w-3 h-3 shrink-0 mt-0.5 text-primary/40" />
            <span>
              "Approve For Paper Trade Preview" grants <span className="text-primary font-bold">paperTradePreviewAllowed=true</span> only.
              It does NOT place an order, connect a broker, access credentials, or enable live trading.
              executionStatus remains <span className="text-destructive font-bold">NOT_EXECUTED</span>.
            </span>
          </div>
        </div>
      )}

      {/* Last action result */}
      {lastResult && (() => {
        const s = STATUS_STYLE[lastResult.approvalStatus] ?? STATUS_STYLE.NEEDS_REVIEW;
        return (
          <div className={`mx-4 mb-4 border rounded-sm p-3 space-y-2 ${s.border}`}>
            <div className="flex items-center gap-2">
              {lastResult.approvalStatus === 'APPROVED_FOR_PAPER_TRADE_PREVIEW'
                ? <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                : lastResult.approvalStatus === 'REJECTED_BY_OPERATOR'
                ? <XCircle className="w-4 h-4 text-destructive shrink-0" />
                : <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />}
              <span className={`text-[10px] font-bold font-mono ${s.cls}`}>{lastResult.approvalStatus}</span>
              <span className="ml-auto text-[7px] font-mono text-slate-500">{lastResult.approvalId}</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-[7px] font-mono">
              {[
                ['symbol',           lastResult.symbol,          'text-primary'],
                ['side',             lastResult.side,            'text-amber-400'],
                ['paperTradePreview',String(lastResult.paperTradePreviewAllowed), lastResult.paperTradePreviewAllowed ? 'text-primary' : 'text-destructive'],
                ['executionStatus',  lastResult.executionStatus, 'text-destructive'],
                ['liveTrading',      lastResult.liveTrading,     'text-destructive'],
                ['brokerConnection', lastResult.brokerConnection,'text-destructive'],
                ['dispatchAllowed',  String(lastResult.dispatchAllowed),  'text-destructive'],
                ['executionAllowed', String(lastResult.executionAllowed), 'text-destructive'],
              ].map(([lbl, val, cls]) => (
                <div key={lbl} className="bg-secondary/20 border border-border/10 rounded-sm px-2 py-1">
                  <div className="text-[6px] uppercase text-slate-600 font-bold mb-0.5">{lbl}</div>
                  <div className={`font-bold break-all ${cls}`}>{safeStr(val)}</div>
                </div>
              ))}
            </div>
            {lastResult.operatorNote && (
              <div className="text-[8px] text-slate-400 italic px-2 py-1.5 bg-secondary/20 border border-border/20 rounded-sm">
                Note: {lastResult.operatorNote}
              </div>
            )}
          </div>
        );
      })()}

      {/* Approval history accordion */}
      {approvals.length > 0 && (
        <div className="border-t border-border/20">
          <div className="px-4 py-2 bg-secondary/10">
            <span className="text-[8px] font-bold uppercase text-slate-400">Approval History ({approvals.length})</span>
            <span className="ml-2 text-[7px] font-mono text-slate-600">key: {APPROVAL_KEY}</span>
          </div>
          <div className="divide-y divide-border/20 max-h-80 overflow-y-auto">
            {approvals.map((a, i) => {
              const s = STATUS_STYLE[a.approvalStatus] ?? STATUS_STYLE.NEEDS_REVIEW;
              const rowId = a.approvalId ?? i;
              return (
                <div key={rowId}>
                  <button type="button" onClick={() => toggle(rowId)}
                    className="w-full flex items-center gap-2 px-4 py-2 hover:bg-secondary/20 transition-colors text-left">
                    {expanded[rowId]
                      ? <ChevronDown className="w-3 h-3 text-slate-500 shrink-0" />
                      : <ChevronRight className="w-3 h-3 text-slate-500 shrink-0" />}
                    <span className="text-[8px] font-mono text-primary font-bold">{safeStr(a.symbol)}</span>
                    <span className="text-[7px] font-mono text-amber-400">{safeStr(a.side)}</span>
                    <span className={`text-[7px] font-mono font-bold ${s.cls}`}>{safeStr(a.approvalStatus)}</span>
                    <span className="ml-auto text-[7px] font-mono text-slate-600">
                      {a.createdAt ? new Date(a.createdAt).toLocaleString() : 'N/A'}
                    </span>
                  </button>
                  {expanded[rowId] && (
                    <div className="px-4 pb-3 grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                      {[
                        ['symbol',          a.symbol,          'text-primary font-bold'],
                        ['side',            a.side,            'text-amber-400 font-bold'],
                        ['price',           a.price,           'text-primary'],
                        ['signalType',      a.signalType],
                        ['approvalStatus',  a.approvalStatus,  s.cls],
                        ['executionStatus', a.executionStatus, 'text-destructive font-bold'],
                        ['paperTradePreview', String(a.paperTradePreviewAllowed), a.paperTradePreviewAllowed ? 'text-primary font-bold' : 'text-destructive font-bold'],
                        ['liveTrading',     a.liveTrading,     'text-destructive font-bold'],
                        ['dispatchAllowed', String(a.dispatchAllowed),  'text-destructive font-bold'],
                        ['executionAllowed',String(a.executionAllowed), 'text-destructive font-bold'],
                        ['approvalId',      a.approvalId,      'text-slate-500 text-[7px]'],
                        ['proposalId',      a.proposalId,      'text-slate-500 text-[7px]'],
                      ].map(([lbl, val, cls]) => (
                        <div key={lbl} className="bg-secondary/20 border border-border/20 rounded-sm px-2 py-1.5">
                          <div className="text-[6px] uppercase text-slate-600 font-bold mb-0.5">{lbl}</div>
                          <div className={`text-[7px] font-mono break-all ${cls || 'text-slate-400'}`}>{safeStr(val)}</div>
                        </div>
                      ))}
                      {a.operatorNote && (
                        <div className="col-span-2 sm:col-span-4 bg-secondary/20 border border-border/20 rounded-sm px-2 py-1.5">
                          <div className="text-[6px] uppercase text-slate-600 font-bold mb-0.5">operatorNote</div>
                          <div className="text-[7px] text-slate-400 italic">{a.operatorNote}</div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="px-4 py-2 border-t border-border/20 flex items-center gap-2 text-[7px] text-slate-600 font-mono">
        <Shield className="w-2.5 h-2.5 text-purple-500/60 shrink-0" />
        GOVERNANCE_ONLY · phase: PHASE_4_PROPOSAL_APPROVAL_QUEUE · riskClass: PAPER_TRADE_PREVIEW_ONLY · No trade · No broker · No API · No credential · No money movement
      </div>
    </div>
  );
}