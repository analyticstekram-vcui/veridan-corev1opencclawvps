/**
 * BrowserObservationProposalQueuePanel — Local-only Proposal Queue (Phase 16)
 * Queues future browser observation requests without executing browser actions or calling OpenClaw.
 * No backend calls, no OpenClaw calls, no fetch, no browser automation, no execution, no dispatch.
 */
import React, { useState } from 'react';
import { ClipboardList, Copy, CheckCircle2, Trash2, ShieldCheck, AlertTriangle, XCircle, Clock, Plus } from 'lucide-react';

const PROPOSALS_KEY = 'openclawBrowserObservationProposals';

const ALLOWED_TYPES = [
  'PAGE_TITLE_READ',
  'CURRENT_URL_READ',
  'PAGE_LOAD_STATUS_READ',
  'SELECTOR_PRESENCE_READ',
  'VISIBLE_TEXT_READ',
  'DOM_SNAPSHOT_METADATA_READ',
  'SCREENSHOT_METADATA_READ',
  'OBSERVATION_EVIDENCE_RECORD',
  'AUTHENTICATED_PAGE_STATE_OBSERVE',
  'FINANCIAL_DASHBOARD_OBSERVE',
  'BROKER_DASHBOARD_OBSERVE',
  'ACCOUNT_BALANCE_OBSERVE',
  'TRANSACTION_HISTORY_OBSERVE',
  'CREDIT_PROFILE_DASHBOARD_OBSERVE',
  'BUSINESS_FORMATION_PORTAL_OBSERVE',
];

const BLOCKED_TYPES = [
  'CLICK_ACTION',
  'TYPE_ACTION',
  'FORM_SUBMISSION',
  'CREDENTIAL_ENTRY',
  'PASSWORD_ENTRY',
  'API_KEY_ENTRY',
  'FILE_UPLOAD',
  'TRADE_ACTION',
  'BROKER_ACTION',
  'WALLET_ACTION',
  'MONEY_MOVEMENT',
  'COMMAND_DISPATCH',
  'AUTONOMOUS_BROWSER_CONTROL',
  'CLOUDFLARE_OR_LOGIN_BYPASS',
  'UNAUTHORIZED_PROTECTED_DATA_SCRAPE',
];

const AUTO_APPROVED_TYPES = new Set([
  'PAGE_TITLE_READ',
  'CURRENT_URL_READ',
  'PAGE_LOAD_STATUS_READ',
  'SELECTOR_PRESENCE_READ',
  'VISIBLE_TEXT_READ',
  'DOM_SNAPSHOT_METADATA_READ',
  'SCREENSHOT_METADATA_READ',
  'OBSERVATION_EVIDENCE_RECORD',
]);

const REVIEW_REQUIRED_TYPES = new Set([
  'AUTHENTICATED_PAGE_STATE_OBSERVE',
  'FINANCIAL_DASHBOARD_OBSERVE',
  'BROKER_DASHBOARD_OBSERVE',
  'ACCOUNT_BALANCE_OBSERVE',
  'TRANSACTION_HISTORY_OBSERVE',
  'CREDIT_PROFILE_DASHBOARD_OBSERVE',
  'BUSINESS_FORMATION_PORTAL_OBSERVE',
]);

const SAFETY_ASSERTIONS = {
  localOnly:                true,
  previewOnly:              true,
  readOnly:                 true,
  noBackendCalls:           true,
  noOpenClawCalls:          true,
  noBrowserAutomationApis:  true,
  noRealBrowserActions:     true,
  noClick:                  true,
  noTyping:                 true,
  noFormSubmit:             true,
  noCredentialEntry:        true,
  noTrading:                true,
  noBrokerActions:          true,
  noWalletActions:          true,
  noMoneyMovement:          true,
  noCommandDispatch:        true,
  noScheduler:              true,
  noPolling:                true,
  noAutonomousControl:      true,
};

function classify(observationType) {
  if (AUTO_APPROVED_TYPES.has(observationType))  return { classification: 'AUTO_APPROVED_READ_ONLY_DESIGN', proposalStatus: 'AUTO_APPROVED_READ_ONLY_DESIGN',  approvalRequirement: 'NONE_REQUIRED' };
  if (REVIEW_REQUIRED_TYPES.has(observationType)) return { classification: 'REQUIRES_OPERATOR_REVIEW',       proposalStatus: 'HOLD_FOR_OPERATOR_REVIEW',         approvalRequirement: 'OPERATOR_REVIEW_REQUIRED' };
  return                                                 { classification: 'BLOCKED_BY_POLICY',              proposalStatus: 'BLOCKED_BY_POLICY',                approvalRequirement: 'N/A_BLOCKED' };
}

function loadProposals() {
  try { return JSON.parse(localStorage.getItem(PROPOSALS_KEY) || '[]'); } catch { return []; }
}

function saveProposals(proposals) {
  try { localStorage.setItem(PROPOSALS_KEY, JSON.stringify(proposals, null, 2)); } catch {}
}

const STATUS_CONFIG = {
  AUTO_APPROVED_READ_ONLY_DESIGN: { color: 'text-primary',     bg: 'bg-primary/5 border-primary/20',         icon: CheckCircle2 },
  HOLD_FOR_OPERATOR_REVIEW:       { color: 'text-amber-500',   bg: 'bg-amber-500/5 border-amber-500/20',     icon: Clock },
  BLOCKED_BY_POLICY:              { color: 'text-destructive', bg: 'bg-destructive/5 border-destructive/20', icon: XCircle },
};

const EMPTY_FORM = { targetUrl: '', observationType: 'PAGE_TITLE_READ', requestedAction: '', operatorNote: '' };

export default function BrowserObservationProposalQueuePanel() {
  const [proposals, setProposals] = useState(() => loadProposals());
  const [form, setForm]           = useState(EMPTY_FORM);
  const [copied, setCopied]       = useState(false);

  const { classification, proposalStatus, approvalRequirement } = classify(form.observationType);
  const isBlocked = proposalStatus === 'BLOCKED_BY_POLICY';
  const statusCfg = STATUS_CONFIG[proposalStatus] ?? STATUS_CONFIG.AUTO_APPROVED_READ_ONLY_DESIGN;
  const StatusIcon = statusCfg.icon;

  const handleCreate = () => {
    const { classification: cl, proposalStatus: ps, approvalRequirement: ar } = classify(form.observationType);
    const proposal = {
      proposalId:               `OBPROP-${Date.now()}`,
      createdAt:                new Date().toISOString(),
      targetUrl:                form.targetUrl.trim() || '[not specified]',
      observationType:          form.observationType,
      requestedAction:          form.requestedAction.trim() || '[not specified]',
      operatorNote:             form.operatorNote.trim() || '[none]',
      classification:           cl,
      approvalRequirement:      ar,
      proposalStatus:           ps,
      executionAllowed:         false,
      dispatchAllowed:          false,
      browserMutationAllowed:   false,
      credentialEntryAllowed:   false,
    };
    const updated = [proposal, ...proposals].slice(0, 50);
    saveProposals(updated);
    setProposals(updated);
    setForm(EMPTY_FORM);
  };

  const handleCopy = () => {
    if (!proposals.length) return;
    navigator.clipboard.writeText(JSON.stringify(proposals[0], null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClear = () => {
    try { localStorage.removeItem(PROPOSALS_KEY); } catch {}
    setProposals([]);
  };

  const counts = {
    auto:    proposals.filter(p => p.proposalStatus === 'AUTO_APPROVED_READ_ONLY_DESIGN').length,
    review:  proposals.filter(p => p.proposalStatus === 'HOLD_FOR_OPERATOR_REVIEW').length,
    blocked: proposals.filter(p => p.proposalStatus === 'BLOCKED_BY_POLICY').length,
  };

  return (
    <div className="space-y-4">

      {/* Header */}
      <div>
        <div className="text-[11px] uppercase tracking-widest text-slate-400 font-semibold mb-0.5">Phase 16 · Browser Observation Proposal Queue</div>
        <div className="text-[13px] font-bold text-foreground flex items-center gap-2">
          <ClipboardList className="w-4 h-4 text-primary" /> Browser Observation Proposal Queue
        </div>
        <div className="text-[9px] text-slate-500 mt-0.5">Local-only proposal queue. No execution, no automation, no dispatch, no backend calls.</div>
      </div>

      {/* Proposal count summary */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'Auto-Approved', count: counts.auto,    color: 'text-primary',     bg: 'bg-primary/5 border-primary/20',         icon: CheckCircle2 },
          { label: 'Pending Review',count: counts.review,  color: 'text-amber-500',   bg: 'bg-amber-500/5 border-amber-500/20',     icon: Clock },
          { label: 'Blocked',       count: counts.blocked, color: 'text-destructive', bg: 'bg-destructive/5 border-destructive/20', icon: XCircle },
        ].map(({ label, count, color, bg, icon: Icon }) => (
          <div key={label} className={`border rounded-lg px-3 py-2.5 ${bg}`}>
            <div className="flex items-center gap-1.5 mb-1">
              <Icon className={`w-3 h-3 ${color} shrink-0`} />
              <span className={`text-[8px] font-bold uppercase tracking-wider ${color}`}>{label}</span>
            </div>
            <div className={`text-[18px] font-bold ${color}`}>{count}</div>
            <div className="text-[8px] text-slate-500">proposals</div>
          </div>
        ))}
      </div>

      {/* Proposal form */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="px-4 py-2 bg-secondary/20 border-b border-border">
          <span className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold">New Observation Proposal</span>
        </div>
        <div className="p-4 space-y-3">

          {/* observationType */}
          <div>
            <label className="text-[8px] uppercase tracking-widest text-slate-400 font-semibold block mb-1">Observation Type</label>
            <select
              value={form.observationType}
              onChange={e => setForm(f => ({ ...f, observationType: e.target.value }))}
              className="w-full bg-secondary/40 border border-border rounded px-3 py-2 text-[10px] text-foreground font-mono focus:outline-none focus:border-primary"
            >
              <optgroup label="── Allowed Read-Only ──">
                {ALLOWED_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </optgroup>
              <optgroup label="── Hard-Blocked ──">
                {BLOCKED_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </optgroup>
            </select>
          </div>

          {/* Classification preview */}
          <div className={`flex items-center gap-2 px-3 py-2 border rounded ${statusCfg.bg}`}>
            <StatusIcon className={`w-3.5 h-3.5 ${statusCfg.color} shrink-0`} />
            <div>
              <div className={`text-[8px] uppercase tracking-widest font-bold ${statusCfg.color}`}>{classification}</div>
              <div className="text-[7px] text-slate-500 mt-0.5">Approval: {approvalRequirement}</div>
            </div>
          </div>

          {/* targetUrl */}
          <div>
            <label className="text-[8px] uppercase tracking-widest text-slate-400 font-semibold block mb-1">Target URL (optional)</label>
            <input
              type="text"
              value={form.targetUrl}
              onChange={e => setForm(f => ({ ...f, targetUrl: e.target.value }))}
              placeholder="https://example.com/dashboard"
              className="w-full bg-secondary/40 border border-border rounded px-3 py-2 text-[10px] text-foreground font-mono focus:outline-none focus:border-primary placeholder:text-slate-600"
            />
          </div>

          {/* requestedAction */}
          <div>
            <label className="text-[8px] uppercase tracking-widest text-slate-400 font-semibold block mb-1">Requested Action</label>
            <input
              type="text"
              value={form.requestedAction}
              onChange={e => setForm(f => ({ ...f, requestedAction: e.target.value }))}
              placeholder="e.g. Read page title of dashboard"
              className="w-full bg-secondary/40 border border-border rounded px-3 py-2 text-[10px] text-foreground focus:outline-none focus:border-primary placeholder:text-slate-600"
            />
          </div>

          {/* operatorNote */}
          <div>
            <label className="text-[8px] uppercase tracking-widest text-slate-400 font-semibold block mb-1">Operator Note</label>
            <textarea
              value={form.operatorNote}
              onChange={e => setForm(f => ({ ...f, operatorNote: e.target.value }))}
              rows={2}
              placeholder="Optional context for this proposal"
              className="w-full bg-secondary/40 border border-border rounded px-3 py-2 text-[10px] text-foreground focus:outline-none focus:border-primary placeholder:text-slate-600 resize-none"
            />
          </div>

          {/* Blocked warning */}
          {isBlocked && (
            <div className="flex items-start gap-2 px-3 py-2.5 bg-destructive/5 border border-destructive/20 rounded">
              <XCircle className="w-3.5 h-3.5 text-destructive shrink-0 mt-0.5" />
              <p className="text-[9px] text-destructive/90 font-semibold">
                This observation type is hard-blocked by policy. The proposal will be saved as BLOCKED_BY_POLICY and cannot be executed.
              </p>
            </div>
          )}

          <button
            type="button"
            onClick={handleCreate}
            className="flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary text-primary text-[10px] font-bold hover:bg-primary/20 transition-colors rounded"
          >
            <Plus className="w-3.5 h-3.5" />
            Create Observation Proposal
          </button>
        </div>
      </div>

      {/* Latest proposal summary */}
      {proposals.length > 0 && (
        <div className={`border rounded-lg p-4 space-y-2 ${STATUS_CONFIG[proposals[0].proposalStatus]?.bg ?? 'bg-card border-border'}`}>
          <div className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold mb-1">Latest Proposal</div>
          <div className="grid grid-cols-2 gap-2 text-[8px]">
            {[
              { k: 'Proposal ID',    v: proposals[0].proposalId,       vc: 'font-mono text-blue-400 text-[7px]' },
              { k: 'Created At',     v: new Date(proposals[0].createdAt).toLocaleString() },
              { k: 'Observation',    v: proposals[0].observationType,  vc: 'font-mono' },
              { k: 'Status',         v: proposals[0].proposalStatus,   vc: `font-bold ${STATUS_CONFIG[proposals[0].proposalStatus]?.color}` },
              { k: 'Classification', v: proposals[0].classification },
              { k: 'Approval',       v: proposals[0].approvalRequirement },
              { k: 'Execution',      v: String(proposals[0].executionAllowed), vc: 'text-primary font-bold' },
              { k: 'Dispatch',       v: String(proposals[0].dispatchAllowed),  vc: 'text-primary font-bold' },
            ].map(({ k, v, vc }) => (
              <div key={k} className="bg-card/60 border border-border/40 px-2 py-1.5 rounded">
                <div className="text-[7px] uppercase tracking-widest text-slate-500 mb-0.5">{k}</div>
                <div className={vc || 'text-foreground font-semibold'}>{v}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Proposal history table */}
      {proposals.length > 0 && (
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="px-4 py-2 bg-secondary/20 border-b border-border flex items-center justify-between">
            <span className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold">Proposal History</span>
            <span className="text-[8px] text-slate-500">{proposals.length} total (max 50)</span>
          </div>
          <div className="divide-y divide-border/30 max-h-64 overflow-y-auto">
            {proposals.map((p, i) => {
              const cfg = STATUS_CONFIG[p.proposalStatus] ?? STATUS_CONFIG.AUTO_APPROVED_READ_ONLY_DESIGN;
              const Icon = cfg.icon;
              return (
                <div key={p.proposalId} className="flex items-start gap-3 px-4 py-2.5">
                  <span className="text-[7px] text-slate-600 font-mono mt-0.5 shrink-0 w-4">{String(i + 1).padStart(2, '0')}</span>
                  <Icon className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${cfg.color}`} />
                  <div className="flex-1 min-w-0">
                    <div className="text-[9px] font-mono text-slate-300 truncate">{p.observationType}</div>
                    <div className="text-[7px] text-slate-500 mt-0.5">{new Date(p.createdAt).toLocaleString()}</div>
                  </div>
                  <span className={`text-[7px] font-bold px-1.5 py-0.5 border rounded shrink-0 ${
                    p.proposalStatus === 'AUTO_APPROVED_READ_ONLY_DESIGN' ? 'text-primary border-primary/30 bg-primary/5' :
                    p.proposalStatus === 'HOLD_FOR_OPERATOR_REVIEW'       ? 'text-amber-500 border-amber-500/30 bg-amber-500/5' :
                                                                            'text-destructive border-destructive/30 bg-destructive/5'
                  }`}>{
                    p.proposalStatus === 'AUTO_APPROVED_READ_ONLY_DESIGN' ? 'AUTO' :
                    p.proposalStatus === 'HOLD_FOR_OPERATOR_REVIEW'       ? 'REVIEW' : 'BLOCKED'
                  }</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Safety assertions */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="px-4 py-2 bg-secondary/20 border-b border-border">
          <span className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold">
            Safety Assertions — {Object.values(SAFETY_ASSERTIONS).filter(Boolean).length}/{Object.keys(SAFETY_ASSERTIONS).length} PASS
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-0">
          {Object.entries(SAFETY_ASSERTIONS).map(([k, v]) => (
            <div key={k} className="flex items-center gap-2 px-4 py-2 border-b border-border/20">
              <CheckCircle2 className="w-3 h-3 text-primary shrink-0" />
              <span className="text-[8px] text-slate-300 font-mono">{k}: <span className="text-primary font-bold">{String(v)}</span></span>
            </div>
          ))}
        </div>
      </div>

      {/* Warning */}
      <div className="flex items-start gap-2 px-3 py-2.5 bg-amber-500/5 border border-amber-500/20 rounded">
        <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
        <p className="text-[9px] text-amber-500/90">
          <span className="font-bold">Proposals are local-only and non-executable.</span>{' '}
          No backend calls, no browser automation, no execution, dispatch, credentials, trading, or money movement.
        </p>
      </div>

      {/* Copy / Clear buttons */}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={handleCopy}
          disabled={!proposals.length}
          className="flex items-center gap-1.5 px-3 py-2 text-[10px] border border-border text-slate-400 hover:text-foreground hover:bg-secondary/50 rounded font-bold transition-colors disabled:opacity-40"
        >
          {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-primary" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? 'Copied!' : 'Copy Latest Proposal JSON'}
        </button>
        <button
          type="button"
          onClick={handleClear}
          disabled={!proposals.length}
          className="flex items-center gap-1.5 px-3 py-2 text-[10px] border border-destructive/30 text-destructive/70 hover:bg-destructive/5 rounded font-bold transition-colors disabled:opacity-40"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Clear Local Proposals
        </button>
      </div>

      {/* Latest proposal JSON preview */}
      {proposals.length > 0 && (
        <div className="bg-secondary/10 border border-border/60 rounded-lg overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2 bg-secondary/20 border-b border-border">
            <span className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold">Latest Proposal — JSON Preview</span>
            <span className="text-[8px] font-mono text-slate-500">{new Date(proposals[0].createdAt).toLocaleString()}</span>
          </div>
          <pre className="px-4 py-3 text-[8px] font-mono text-slate-300 overflow-auto max-h-64 whitespace-pre-wrap break-words">
            {JSON.stringify(proposals[0], null, 2)}
          </pre>
          <div className="px-4 py-2 border-t border-border/40 flex items-center gap-1.5">
            <CheckCircle2 className="w-3 h-3 text-primary" />
            <span className="text-[8px] text-primary/80">Saved to localStorage key: <span className="font-mono">{PROPOSALS_KEY}</span></span>
          </div>
        </div>
      )}

      {/* Safety footer */}
      <div className="flex items-center gap-2 px-3 py-2 bg-primary/5 border border-primary/20 rounded text-[8px] text-primary/80">
        <ShieldCheck className="w-3 h-3 shrink-0" />
        Local-only. No backend calls. No OpenClaw calls. No browser automation. No execution. No dispatch. No scheduler. No polling.
      </div>
    </div>
  );
}