import React, { useState, useEffect } from 'react';
import {
  Shield, FileText, AlertTriangle, Ban, CheckCircle2,
  ScrollText, Clock, PlusCircle, XCircle
} from 'lucide-react';
import { createProposal, loadProposals, loadAudit, submitForApproval } from '@/lib/proposalStore';

// ── Constants ──────────────────────────────────────────────────────────────────
const COMMAND_TYPES = ['STATUS_CHECK', 'READ_PAGE', 'INSPECT_PAGE', 'SUMMARIZE_PAGE', 'CHECK_WEBHOOK'];
const RISK_TIERS    = ['LOW', 'MEDIUM', 'HIGH'];
const APPROVALS     = ['AUTO_BLOCKED', 'REVIEW_REQUIRED', 'APPROVAL_REQUIRED'];

// ── Validation ─────────────────────────────────────────────────────────────────
const BLOCK_PATTERNS = [
  { re: /^$|^\s*$/,                                     reason: 'Target URL is required' },
  { re: /localhost/i,                                   reason: 'Blocked: localhost not permitted' },
  { re: /127\.0\.0\.1/,                                 reason: 'Blocked: loopback IP not permitted' },
  { re: /0\.0\.0\.0/,                                   reason: 'Blocked: unroutable IP' },
  { re: /192\.168\./,                                   reason: 'Blocked: private IP range (192.168.x.x)' },
  { re: /^https?:\/\/10\./,                             reason: 'Blocked: private IP range (10.x.x.x)' },
  { re: /172\.(1[6-9]|2\d|3[01])\./,                   reason: 'Blocked: private IP range (172.16-31.x)' },
  { re: /^http:\/\//i,                                  reason: 'Blocked: http:// not permitted — use https://' },
  { re: /file:\/\//i,                                   reason: 'Blocked: file:// protocol not permitted' },
  { re: /javascript:/i,                                 reason: 'Blocked: javascript: protocol not permitted' },
  { re: /login|signin|sign-in/i,                        reason: 'Blocked: login/sign-in pages not permitted' },
  { re: /broker|tradovate|alpaca|blofin|binance|coinbase|kraken|bybit/i, reason: 'Blocked: broker/exchange pages not permitted' },
  { re: /bank|chase\.com|wellsfargo|citibank|bankofamerica/i,            reason: 'Blocked: bank login pages not permitted' },
  { re: /wallet|private.?key|seed.?phrase|metamask|ledger/i,             reason: 'Blocked: wallet/private key pages not permitted' },
  { re: /execute.?trade|place.?order|market.?order|limit.?order/i,       reason: 'Blocked: trading execution keywords detected' },
  { re: /credential|password|apikey|api.?key|secret.?key/i,              reason: 'Blocked: credential-entry keywords detected' },
];

function validateTarget(url) {
  if (!url || !url.trim()) return ['Target URL is required'];
  const reasons = [];
  for (const { re, reason } of BLOCK_PATTERNS) {
    if (re.test(url)) reasons.push(reason);
  }
  if (!url.startsWith('https://') && !reasons.some(r => r.includes('http://'))) {
    reasons.push('URL must start with https://');
  }
  return reasons;
}

function genId() {
  return 'prop-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 7);
}

// ── Sub-components ─────────────────────────────────────────────────────────────
function StatusSummaryCard() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
      {[
        { label: 'Execution',     value: 'DISABLED',      vc: 'text-destructive' },
        { label: 'Gateway Mode',  value: 'READ_ONLY',     vc: 'text-amber-500' },
        { label: 'Proposal Mode', value: 'ENABLED',       vc: 'text-primary' },
        { label: 'OpenClaw Call', value: 'NOT_ATTEMPTED', vc: 'text-slate-400' },
      ].map(({ label, value, vc }) => (
        <div key={label} className="bg-card border border-border/60 rounded px-3 py-2">
          <div className="text-[8px] uppercase tracking-widest text-slate-500 font-semibold mb-0.5">{label}</div>
          <div className={`text-[10px] font-bold ${vc}`}>{value}</div>
        </div>
      ))}
    </div>
  );
}

const STATUS_BADGE = {
  DRAFT:            'text-slate-400 border-slate-500/30 bg-slate-500/5',
  PENDING_APPROVAL: 'text-amber-500 border-amber-500/30 bg-amber-500/5',
  APPROVED:         'text-primary border-primary/30 bg-primary/5',
  DENIED:           'text-destructive border-destructive/30 bg-destructive/5',
  QUEUED_PREVIEW:   'text-blue-400 border-blue-400/30 bg-blue-400/5',
  BLOCKED_PREVIEW:  'text-destructive border-destructive/30 bg-destructive/5',
};

function ProposalCard({ proposal, onSubmit }) {
  const [expanded, setExpanded] = useState(false);
  const badgeCls = STATUS_BADGE[proposal.status] || STATUS_BADGE.DRAFT;
  const riskColor = proposal.riskTier === 'HIGH' ? 'text-destructive' : proposal.riskTier === 'MEDIUM' ? 'text-amber-500' : 'text-primary';

  return (
    <div className="bg-card border border-border/50 rounded-lg overflow-hidden">
      <div
        className="flex items-start gap-2 px-3 py-2.5 cursor-pointer hover:bg-secondary/20 transition-colors"
        onClick={() => setExpanded(e => !e)}
      >
        <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-bold text-foreground font-mono">{proposal.commandType}</span>
            <span className={`text-[7px] px-1.5 py-0.5 border rounded font-bold uppercase ${badgeCls}`}>{proposal.status}</span>
            <span className={`text-[7px] font-bold uppercase ${riskColor}`}>{proposal.riskTier}</span>
          </div>
          <div className="text-[9px] text-blue-400 font-mono truncate mt-0.5">{proposal.target}</div>
        </div>
        <span className="text-[8px] text-slate-600 font-mono shrink-0">{new Date(proposal.createdAt).toLocaleTimeString()}</span>
      </div>

      {expanded && (
        <div className="border-t border-border/30 px-3 py-3 space-y-2 bg-secondary/5">
          {proposal.blockedReasons?.length > 0 && (
            <div className="px-2 py-1.5 bg-destructive/5 border border-destructive/20 rounded space-y-0.5">
              {proposal.blockedReasons.map((r, i) => (
                <div key={i} className="flex items-center gap-1.5 text-[8px] text-destructive">
                  <XCircle className="w-2.5 h-2.5 shrink-0" /> {r}
                </div>
              ))}
            </div>
          )}
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[8px] text-slate-500">
            <span>ID: <span className="text-slate-300 font-mono">{proposal.id}</span></span>
            <span>Approval: <span className="text-slate-300">{proposal.requiredApproval}</span></span>
            <span>Purpose: <span className="text-slate-300">{proposal.purpose || '—'}</span></span>
            <span>Expected: <span className="text-slate-300">{proposal.expectedResult || '—'}</span></span>
            <span>Safety: <span className="text-primary font-semibold">{proposal.safetyMode}</span></span>
            <span>Executed: <span className="text-destructive font-semibold">{String(proposal.executionAttempted)}</span></span>
            {proposal.reviewedBy && <span>Reviewed by: <span className="text-slate-300">{proposal.reviewedBy}</span></span>}
            {proposal.reviewNote && <span className="col-span-2">Review note: <span className="text-slate-300">{proposal.reviewNote}</span></span>}
          </div>

          {proposal.status === 'DRAFT' && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onSubmit(proposal.id); }}
              className="px-3 py-1.5 text-[9px] border border-amber-500/40 text-amber-500 hover:bg-amber-500/10 rounded font-bold transition-colors"
            >
              Submit for Approval →
            </button>
          )}

          <details>
            <summary className="text-[8px] text-slate-500 cursor-pointer hover:text-slate-300 uppercase tracking-widest font-semibold">
              Full JSON
            </summary>
            <pre className="mt-1.5 bg-secondary/40 border border-border/30 rounded p-2 text-[7px] font-mono text-slate-400 overflow-auto max-h-40">
              {JSON.stringify(proposal, null, 2)}
            </pre>
          </details>
        </div>
      )}
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function SafeCommandBridge() {
  const [form, setForm] = useState({
    commandType:      'STATUS_CHECK',
    target:           '',
    purpose:          '',
    expectedResult:   '',
    riskTier:         'LOW',
    requiredApproval: 'REVIEW_REQUIRED',
  });
  const [proposals,   setProposals]   = useState(() => loadProposals());
  const [auditLog,    setAuditLog]    = useState(() => loadAudit());
  const [lastMessage, setLastMessage] = useState(null);
  const [submitted,   setSubmitted]   = useState(false);

  // Keep in sync when other tabs write to localStorage
  useEffect(() => {
    const onStorage = () => {
      setProposals(loadProposals());
      setAuditLog(loadAudit());
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const blockReasons = validateTarget(form.target);
  const hasBlocks    = form.target && blockReasons.length > 0;
  const purposeMissing = submitted && !form.purpose.trim();

  const handleCreate = () => {
    setSubmitted(true);
    if (!form.purpose.trim()) return;

    const blocked = validateTarget(form.target);
    const isBlocked = blocked.length > 0;
    const status = isBlocked ? 'DRAFT'
                 : form.requiredApproval === 'APPROVAL_REQUIRED' ? 'PENDING_APPROVAL'
                 : 'DRAFT';

    const proposal = {
      id:               genId(),
      createdAt:        new Date().toISOString(),
      commandType:      form.commandType,
      target:           form.target,
      purpose:          form.purpose,
      expectedResult:   form.expectedResult,
      riskTier:         form.riskTier,
      requiredApproval: form.requiredApproval,
      status,
      blockedReasons:   blocked,
      safetyMode:           'PREVIEW_ONLY',
      executionAttempted:   false,
    };

    const updated = createProposal(proposal);
    setProposals(updated);
    setAuditLog(loadAudit());
    setLastMessage(
      isBlocked
        ? `Proposal created as DRAFT — ${blocked.length} safety block(s) detected. No execution attempted.`
        : 'Proposal created — no execution attempted.'
    );
    setForm(f => ({ ...f, target: '', purpose: '', expectedResult: '' }));
    setSubmitted(false);
  };

  const handleSubmitForApproval = (id) => {
    const updated = submitForApproval(id);
    setProposals(updated);
    setAuditLog(loadAudit());
  };

  const inputCls = (err) =>
    `w-full px-3 py-2 bg-secondary/40 border text-[11px] font-mono text-foreground rounded outline-none transition-colors placeholder:text-slate-600 ${
      err ? 'border-destructive/50 focus:border-destructive' : 'border-border focus:border-primary/50'
    }`;

  return (
    <div className="p-6 max-w-2xl space-y-5 font-mono">

      {/* Header */}
      <div className="flex items-center gap-3 pb-2 border-b border-border">
        <div className="w-7 h-7 bg-primary/10 border border-primary/30 flex items-center justify-center">
          <Shield className="w-3.5 h-3.5 text-primary" />
        </div>
        <div>
          <h2 className="text-[13px] font-semibold tracking-wider text-foreground">SAFE COMMAND TEST</h2>
          <p className="text-[9px] text-slate-500 uppercase tracking-widest">Proposal-only · Read-only · No execution</p>
        </div>
        <div className="ml-auto flex items-center gap-1.5 px-2.5 py-1 border border-amber-500/30 bg-amber-500/5">
          <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
          <span className="text-[9px] text-amber-500 font-bold">PROPOSAL_ONLY</span>
        </div>
      </div>

      <StatusSummaryCard />

      {/* Safety Banner */}
      <div className="flex items-start gap-3 px-4 py-3 bg-amber-500/5 border border-amber-500/20 rounded-lg">
        <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
        <div className="text-[9px] text-amber-500/90 leading-relaxed">
          <span className="font-bold">No commands are executed here.</span> This form creates a read-only proposal record only.
          No OpenClaw calls, no browser tools, no trading, no credentials, no live actions.
        </div>
      </div>

      {/* Proposal Form */}
      <div className="bg-card border border-border rounded-lg p-4 space-y-4">
        <div className="text-[9px] uppercase tracking-widest text-slate-500 font-semibold">Draft Command Proposal</div>

        {/* Command Type */}
        <div>
          <label className="text-[9px] uppercase tracking-wider text-slate-400 font-semibold block mb-1">Command Type</label>
          <div className="flex flex-wrap gap-1.5">
            {COMMAND_TYPES.map(t => (
              <button key={t} type="button" onClick={() => setForm(f => ({ ...f, commandType: t }))}
                className={`px-2.5 py-1.5 border text-[9px] font-bold rounded transition-colors ${
                  form.commandType === t ? 'border-primary text-primary bg-primary/10' : 'border-border text-slate-400 hover:text-foreground hover:bg-secondary/50'
                }`}>{t}</button>
            ))}
          </div>
        </div>

        {/* Target */}
        <div>
          <label className="text-[9px] uppercase tracking-wider text-slate-400 font-semibold block mb-1">
            Target URL or Endpoint <span className="text-destructive">*</span>
          </label>
          <input type="text" value={form.target}
            onChange={e => setForm(f => ({ ...f, target: e.target.value }))}
            placeholder="https://example.com/api/status" className={inputCls(hasBlocks)} />
          {hasBlocks && (
            <div className="mt-1.5 space-y-0.5">
              {blockReasons.map((r, i) => (
                <div key={i} className="flex items-center gap-1.5 text-[9px] text-destructive">
                  <Ban className="w-3 h-3 shrink-0" /> {r}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Purpose */}
        <div>
          <label className="text-[9px] uppercase tracking-wider text-slate-400 font-semibold block mb-1">
            Purpose / Reason <span className="text-destructive">*</span>
          </label>
          <input type="text" value={form.purpose}
            onChange={e => setForm(f => ({ ...f, purpose: e.target.value }))}
            placeholder="e.g. Verify gateway health before proposal review"
            className={inputCls(purposeMissing)} />
          {purposeMissing && <div className="text-[9px] text-destructive mt-1">Purpose is required</div>}
        </div>

        {/* Expected Result */}
        <div>
          <label className="text-[9px] uppercase tracking-wider text-slate-400 font-semibold block mb-1">Expected Result</label>
          <input type="text" value={form.expectedResult}
            onChange={e => setForm(f => ({ ...f, expectedResult: e.target.value }))}
            placeholder="e.g. HTTP 200 with gateway metadata"
            className={inputCls(false)} />
        </div>

        {/* Risk + Approval */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-[9px] uppercase tracking-wider text-slate-400 font-semibold block mb-1">Risk Tier</label>
            <div className="flex gap-1.5">
              {RISK_TIERS.map(t => (
                <button key={t} type="button" onClick={() => setForm(f => ({ ...f, riskTier: t }))}
                  className={`flex-1 px-2 py-1.5 border text-[9px] font-bold rounded transition-colors ${
                    form.riskTier === t
                      ? t === 'HIGH' ? 'border-destructive text-destructive bg-destructive/10'
                      : t === 'MEDIUM' ? 'border-amber-500 text-amber-500 bg-amber-500/10'
                                       : 'border-primary text-primary bg-primary/10'
                      : 'border-border text-slate-400 hover:bg-secondary/50'
                  }`}>{t}</button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-[9px] uppercase tracking-wider text-slate-400 font-semibold block mb-1">Required Approval</label>
            <select value={form.requiredApproval} onChange={e => setForm(f => ({ ...f, requiredApproval: e.target.value }))}
              className="w-full px-3 py-2 bg-secondary/40 border border-border text-[10px] font-mono text-foreground rounded outline-none focus:border-primary/50">
              {APPROVALS.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
        </div>

        <button type="button" onClick={handleCreate}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary/10 border border-primary text-primary text-[11px] font-bold hover:bg-primary/20 transition-colors rounded">
          <PlusCircle className="w-4 h-4" /> Create Command Proposal
        </button>

        {lastMessage && (
          <div className="flex items-start gap-2 px-3 py-2.5 bg-primary/5 border border-primary/20 rounded text-[9px] text-primary">
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-0.5" /> {lastMessage}
          </div>
        )}
      </div>

      {/* Local Proposal Queue */}
      {proposals.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <FileText className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-300">Local Proposals ({proposals.length})</span>
            <span className="ml-auto text-[8px] text-slate-500">Persisted to localStorage</span>
          </div>
          <div className="space-y-1.5 max-h-80 overflow-y-auto">
            {proposals.map(p => (
              <ProposalCard key={p.id} proposal={p} onSubmit={handleSubmitForApproval} />
            ))}
          </div>
        </div>
      )}

      {/* Audit Log */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border bg-secondary/10">
          <ScrollText className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold">Audit Log</span>
          <span className="text-[8px] text-slate-600">({auditLog.length})</span>
        </div>
        {auditLog.length === 0 ? (
          <div className="flex items-center justify-center h-10 text-[10px] text-slate-600">No proposals created yet</div>
        ) : (
          <div className="divide-y divide-border/30 max-h-48 overflow-y-auto">
            {auditLog.map((e, i) => (
              <div key={i} className="px-4 py-2 text-[8px] space-y-0.5">
                <div className="flex items-center gap-2">
                  <Clock className="w-3 h-3 text-slate-500 shrink-0" />
                  <span className="text-slate-400 font-mono">{new Date(e.timestamp).toLocaleTimeString()}</span>
                  <span className="font-bold text-primary ml-1 uppercase">{e.event}</span>
                </div>
                <div className="text-slate-500">{e.note}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Safety Footer */}
      <div className="flex items-start gap-3 px-4 py-3 bg-primary/5 border border-primary/20 rounded-lg">
        <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
        <div className="text-[9px] text-primary/80">
          <span className="font-semibold">Proposal-only mode.</span> No OpenClaw calls, no browser tools, no command execution,
          no trading, no credentials. Proposals persist to localStorage and appear in the Approval Workflow tab.
        </div>
      </div>
    </div>
  );
}