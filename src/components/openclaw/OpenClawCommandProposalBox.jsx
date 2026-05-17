/**
 * OpenClawCommandProposalBox
 * Local-only command proposal interface. Classifies operator intent and stores
 * a proposal record. Never executes, calls OpenClaw, calls backend, dispatches,
 * trades, moves money, exposes secrets, or uses browser automation.
 */
import React, { useState, useCallback } from 'react';
import { ShieldCheck, Copy, CheckCircle2, Trash2, ChevronDown, XCircle, AlertCircle, HelpCircle } from 'lucide-react';

// ── Storage keys ──────────────────────────────────────────────────────────────
const PROPOSALS_KEY   = 'openclawCommandProposals';
const POLICY_KEY      = 'openclawPhase56ReadOnlyCapabilityPolicyMaps';
const HEALTH50_KEY    = 'openclawPhase50OpenClawReadOnlyHealthCheckResults';
const SVC54_KEY       = 'openclawPhase54StatusVersionCapabilitiesReadOnlyResults';

// ── Safe JSON loader ──────────────────────────────────────────────────────────
function loadJSON(key, fallback = null) {
  try { const r = localStorage.getItem(key); return r ? JSON.parse(r) : fallback; }
  catch { return fallback; }
}

function saveJSON(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
}

// ── Policy loader ─────────────────────────────────────────────────────────────
function loadLatestPolicyMap() {
  const raw = loadJSON(POLICY_KEY, []);
  if (!Array.isArray(raw) || raw.length === 0) return null;
  const maps = raw.flatMap(b => b.policyMaps || []);
  return maps.length > 0 ? maps[0] : null;
}

// ── Classification ────────────────────────────────────────────────────────────
const BLOCK_PATTERNS = [
  'execute','dispatch','trade','buy','sell','order','broker','wallet',
  'transfer','send money','withdraw','deposit','credential','password',
  'secret','token','automate browser','schedule','poll continuously',
];

const ALLOW_PATTERNS = [
  { re: /health\s*check|health\s*status|alive|reachable/i,  intent: 'READ_ONLY_HEALTH',         allowed: ['HEALTH_CHECK'] },
  { re: /\bstatus\b/i,                                       intent: 'READ_ONLY_STATUS',         allowed: ['STATUS_READ'] },
  { re: /\bversion\b/i,                                      intent: 'READ_ONLY_VERSION',        allowed: ['VERSION_READ'] },
  { re: /\bcapabilit/i,                                      intent: 'READ_ONLY_CAPABILITIES',   allowed: ['CAPABILITIES_READ'] },
  { re: /summarize\s*(safety|read.only\s*observability|current\s*safety)/i, intent: 'READ_ONLY_SAFETY_SUMMARY', allowed: ['HEALTH_CHECK','STATUS_READ','VERSION_READ','CAPABILITIES_READ'] },
];

function classifyRequest(text, policyMap) {
  const lower = text.toLowerCase().trim();

  if (!policyMap) {
    return {
      classifiedIntent: 'NEEDS_REVIEW',
      decision: 'NEEDS_REVIEW',
      reason: 'No read-only policy map found. Run Phase 56 policy map generation first.',
      allowedActions: [],
      blockedReasons: [],
      nextStep: 'OPERATOR_REVIEW_REQUIRED',
    };
  }

  // Check blocked patterns first
  const hitBlocked = BLOCK_PATTERNS.filter(p => lower.includes(p));
  if (hitBlocked.length > 0) {
    return {
      classifiedIntent: 'BLOCKED_HIGH_RISK',
      decision: 'BLOCKED_PROPOSAL',
      reason: `Request matches blocked policy pattern(s): ${hitBlocked.join(', ')}`,
      allowedActions: [],
      blockedReasons: hitBlocked,
      nextStep: 'REQUEST_BLOCKED_BY_POLICY',
    };
  }

  // Check allowed patterns
  for (const { re, intent, allowed } of ALLOW_PATTERNS) {
    if (re.test(lower)) {
      // Constrain to policy map allowed caps
      const policyAllowed = policyMap.allowedReadOnlyCapabilities ?? [];
      const filteredAllowed = allowed.filter(a => policyAllowed.includes(a));
      return {
        classifiedIntent: intent,
        decision: 'ALLOW_READ_ONLY_PROPOSAL',
        reason: `Request matches allowed read-only observability pattern. Constrained to policy map capabilities: ${filteredAllowed.join(', ')}.`,
        allowedActions: filteredAllowed,
        blockedReasons: [],
        nextStep: 'OPERATOR_CAN_RUN_EXISTING_READ_ONLY_DASHBOARD_CHECKS',
      };
    }
  }

  // Ambiguous
  return {
    classifiedIntent: 'NEEDS_REVIEW',
    decision: 'NEEDS_REVIEW',
    reason: 'Request does not clearly match any allowed read-only observability pattern. Operator review required.',
    allowedActions: [],
    blockedReasons: [],
    nextStep: 'OPERATOR_REVIEW_REQUIRED',
  };
}

function buildProposal(text, policyMap) {
  const classification = classifyRequest(text, policyMap);
  return {
    proposalId: `prop-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    createdAt: new Date().toISOString(),
    requestText: text,
    ...classification,
    policySource: 'openclawPhase56ReadOnlyCapabilityPolicyMaps',
    safetyMode: 'PROPOSAL_ONLY_NOT_EXECUTED',
    executionStatus: 'NOT_EXECUTED',
    openClawCalled: false,
    backendCalled: false,
    apiCalled: false,
    dispatchPerformed: false,
    executionPerformed: false,
    tradingPerformed: false,
    moneyMovementPerformed: false,
    browserAutomationPerformed: false,
    schedulerPerformed: false,
    pollingPerformed: false,
    secretValueAccessed: false,
    rawResponseBodyAccessed: false,
  };
}

// ── Decision badge ────────────────────────────────────────────────────────────
function DecisionBadge({ decision }) {
  if (decision === 'ALLOW_READ_ONLY_PROPOSAL')
    return <span className="text-[7px] font-bold px-1.5 py-0.5 rounded border text-primary border-primary/30 bg-primary/5">ALLOW_READ_ONLY</span>;
  if (decision === 'BLOCKED_PROPOSAL')
    return <span className="text-[7px] font-bold px-1.5 py-0.5 rounded border text-destructive border-destructive/30 bg-destructive/5">BLOCKED</span>;
  return <span className="text-[7px] font-bold px-1.5 py-0.5 rounded border text-amber-500 border-amber-500/30 bg-amber-500/5">NEEDS_REVIEW</span>;
}

const PLACEHOLDER = `Examples:
• Check OpenClaw status
• Summarize current OpenClaw safety state
• Show current OpenClaw version
• Review read-only capabilities`;

// ── Component ─────────────────────────────────────────────────────────────────
export default function OpenClawCommandProposalBox() {
  const [input, setInput]             = useState('');
  const [proposals, setProposals]     = useState(() => loadJSON(PROPOSALS_KEY, []));
  const [expanded, setExpanded]       = useState(null);
  const [copied, setCopied]           = useState(null); // proposalId or 'latest'
  const [lastAction, setLastAction]   = useState(null);

  const handleCreate = useCallback(() => {
    const text = input.trim();
    if (!text) { setLastAction('Please enter a request before creating a proposal.'); return; }

    const policyMap = loadLatestPolicyMap();
    const proposal  = buildProposal(text, policyMap);

    const updated = [proposal, ...(proposals || [])].slice(0, 100);
    saveJSON(PROPOSALS_KEY, updated);
    setProposals(updated);
    setInput('');
    setLastAction(`Proposal created — decision: ${proposal.decision}`);
  }, [input, proposals]);

  const handleClearInput = () => { setInput(''); setLastAction('Input cleared.'); };

  const handleClearHistory = () => {
    saveJSON(PROPOSALS_KEY, []);
    setProposals([]);
    setLastAction('Proposal history cleared.');
  };

  const handleCopy = (proposal) => {
    try {
      navigator.clipboard.writeText(JSON.stringify(proposal, null, 2));
      setCopied(proposal.proposalId);
      setTimeout(() => setCopied(null), 2000);
      setLastAction('Proposal JSON copied to clipboard.');
    } catch { setLastAction('Copy failed.'); }
  };

  return (
    <div className="space-y-4">

      {/* ── Header ── */}
      <div>
        <div className="text-[11px] uppercase tracking-widest text-slate-400 font-semibold mb-0.5">Operator Tool</div>
        <div className="text-[13px] font-bold text-foreground flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-primary" /> OpenClaw Command Proposal Box
        </div>
        <div className="text-[9px] text-slate-500 mt-0.5">
          Describe what you want Veridan/OpenClaw to do. This creates a proposal only — it does not execute.
        </div>
      </div>

      {/* ── Input area ── */}
      <div className="space-y-2">
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder={PLACEHOLDER}
          rows={4}
          className="w-full px-3 py-2.5 bg-secondary/20 border border-border rounded text-[10px] text-foreground placeholder:text-slate-600 font-mono resize-y focus:outline-none focus:border-primary/50 transition-colors"
        />
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={handleCreate}
            className="flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary text-primary text-[10px] font-bold hover:bg-primary/20 transition-colors rounded">
            <ShieldCheck className="w-3.5 h-3.5" /> Create Safe Proposal
          </button>
          <button type="button" onClick={handleClearInput}
            className="flex items-center gap-1.5 px-3 py-2 text-[10px] border border-border text-slate-400 hover:text-foreground hover:bg-secondary/50 rounded font-bold transition-colors">
            <XCircle className="w-3.5 h-3.5" /> Clear Input
          </button>
        </div>
      </div>

      {/* ── Last action feedback ── */}
      {lastAction && (
        <div className="text-[9px] text-primary bg-primary/5 border border-primary/20 px-3 py-2 rounded">
          {lastAction}
        </div>
      )}

      {/* ── Proposal history ── */}
      {proposals && proposals.length > 0 && (
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="px-4 py-2 bg-secondary/20 border-b border-border flex items-center justify-between">
            <span className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold">Proposal History ({proposals.length})</span>
            <button type="button" onClick={handleClearHistory}
              className="flex items-center gap-1 text-[8px] text-destructive/70 border border-destructive/30 px-2 py-1 rounded hover:bg-destructive/5 transition-colors font-bold">
              <Trash2 className="w-3 h-3" /> Clear History
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-[8px]">
              <thead className="bg-secondary/10 border-b border-border/30">
                <tr>
                  {['Created', 'Request', 'Intent', 'Decision', 'Exec Status', 'Actions'].map(h => (
                    <th key={h} className="px-3 py-2 text-left font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/20">
                {proposals.map((p, i) => (
                  <React.Fragment key={p.proposalId}>
                    <tr className="hover:bg-secondary/10 transition-colors">
                      <td className="px-3 py-2.5 font-mono text-slate-400 whitespace-nowrap">
                        {new Date(p.createdAt).toLocaleTimeString()}
                      </td>
                      <td className="px-3 py-2.5 text-slate-200 max-w-[160px]">
                        <span className="truncate block" title={p.requestText}>{p.requestText}</span>
                      </td>
                      <td className="px-3 py-2.5 font-mono text-[7px] text-slate-300 whitespace-nowrap">{p.classifiedIntent}</td>
                      <td className="px-3 py-2.5"><DecisionBadge decision={p.decision} /></td>
                      <td className="px-3 py-2.5 text-[7px] font-bold text-amber-500 whitespace-nowrap">{p.executionStatus}</td>
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-1.5">
                          <button type="button" onClick={() => setExpanded(expanded === i ? null : i)}
                            className="flex items-center gap-0.5 text-primary hover:text-primary/80 transition-colors font-bold text-[7px]">
                            VIEW <ChevronDown className={`w-3 h-3 transition-transform ${expanded === i ? 'rotate-180' : ''}`} />
                          </button>
                          <button type="button" onClick={() => handleCopy(p)}
                            className="text-slate-400 hover:text-primary transition-colors">
                            {copied === p.proposalId
                              ? <CheckCircle2 className="w-3 h-3 text-primary" />
                              : <Copy className="w-3 h-3" />}
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* Expanded detail row */}
                    {expanded === i && (
                      <tr>
                        <td colSpan={6} className="px-4 py-3 bg-secondary/10 border-t border-border/30">
                          <div className="space-y-2">
                            {/* Reason */}
                            <div className="text-[8px] text-slate-300">
                              <span className="text-slate-500 font-semibold uppercase tracking-wider">Reason: </span>
                              {p.reason}
                            </div>
                            {/* Allowed actions */}
                            {p.allowedActions?.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                <span className="text-[7px] text-slate-500 font-semibold uppercase tracking-wider mr-1">Allowed:</span>
                                {p.allowedActions.map(a => (
                                  <span key={a} className="text-[7px] font-mono px-1.5 py-0.5 bg-primary/5 border border-primary/20 text-primary rounded">{a}</span>
                                ))}
                              </div>
                            )}
                            {/* Blocked reasons */}
                            {p.blockedReasons?.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                <span className="text-[7px] text-slate-500 font-semibold uppercase tracking-wider mr-1">Blocked by:</span>
                                {p.blockedReasons.map(b => (
                                  <span key={b} className="text-[7px] font-mono px-1.5 py-0.5 bg-destructive/5 border border-destructive/20 text-destructive rounded">{b}</span>
                                ))}
                              </div>
                            )}
                            {/* Next step */}
                            <div className="text-[7px] text-slate-400">
                              <span className="text-slate-500 font-semibold uppercase tracking-wider">Next step: </span>
                              {p.nextStep}
                            </div>
                            {/* Safety flags */}
                            <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-[7px] text-slate-500 pt-1 border-t border-border/20">
                              {['openClawCalled','backendCalled','apiCalled','dispatchPerformed','executionPerformed',
                                'tradingPerformed','moneyMovementPerformed','browserAutomationPerformed',
                                'schedulerPerformed','pollingPerformed','secretValueAccessed','rawResponseBodyAccessed'].map(k => (
                                <span key={k}>{k}: <span className="text-primary font-bold">{String(p[k])}</span></span>
                              ))}
                            </div>
                            {/* Raw JSON */}
                            <pre className="text-[7px] font-mono text-slate-400 bg-card rounded p-2 border border-border/40 overflow-auto max-h-40">
                              {JSON.stringify(p, null, 2)}
                            </pre>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Safety block ── */}
      <div className="bg-primary/5 border-2 border-primary/20 rounded-lg p-4 space-y-1.5">
        <div className="flex items-center gap-2 mb-1">
          <ShieldCheck className="w-4 h-4 text-primary shrink-0" />
          <div className="text-[10px] font-bold text-primary uppercase tracking-wider">Proposal-Only Safety Guarantee</div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-0.5 text-[8px] text-slate-400">
          {['Proposal only — no execution','No OpenClaw call','No backend call',
            'No dispatch','No execution','No trading',
            'No money movement','No secret access','No raw response body access',
            'No scheduler or polling','No browser automation','No API call'].map(item => (
            <div key={item} className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3 h-3 text-primary shrink-0" />
              <span>{item}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Safety footer ── */}
      <div className="flex items-center gap-2 px-3 py-2 bg-primary/5 border border-primary/20 rounded text-[8px] text-primary/80">
        <ShieldCheck className="w-3 h-3 shrink-0" />
        All classification is local string-only. No fetch, no axios, no SDK, no backend calls, no secrets, no dispatch.
      </div>
    </div>
  );
}