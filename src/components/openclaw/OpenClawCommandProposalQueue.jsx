import React, { useState, useEffect } from 'react';
import { AlertTriangle, Plus, CheckCircle2, XCircle, Clock, Trash2, Send, Shield } from 'lucide-react';

const COMMAND_TYPES = ['READ', 'CLICK', 'TYPE', 'NAVIGATE', 'EXTRACT', 'VERIFY'];
const RISK_TIERS = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
const STATUSES = ['DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'DENIED', 'EXPIRED', 'EXPIRED_APPROVAL'];

const EXPIRATION_HOURS = {
  LOW: 24,
  MEDIUM: 12,
  HIGH: 4,
  CRITICAL: 1,
};

const calculateExpirationTime = (riskTier) => {
  const hours = EXPIRATION_HOURS[riskTier] || 24;
  const expirationTime = new Date(Date.now() + hours * 60 * 60 * 1000);
  return expirationTime.toISOString();
};

const isProposalExpired = (proposal) => {
  if (!proposal.expirationAt) return false;
  return new Date() > new Date(proposal.expirationAt);
};

const getTimeRemaining = (expirationAt) => {
  if (!expirationAt) return null;
  const remaining = new Date(expirationAt) - new Date();
  if (remaining <= 0) return 'Expired';
  
  const hours = Math.floor(remaining / (1000 * 60 * 60));
  const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
  
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
};

const DOMAIN_ALLOWLIST = [
  'veridancore.com',
  'openclaw.veridancore.com',
  'base44.com',
  'tradingview.com',
  'tradovate.com',
];

const isDomainAllowlisted = (url) => {
  if (!url) return false;
  try {
    const domain = new URL(url).hostname;
    return DOMAIN_ALLOWLIST.some(allowed => domain === allowed || domain.endsWith('.' + allowed));
  } catch {
    return false;
  }
};

const calculateExecutionEligibility = (proposal, validation) => {
  const reasons = [];

  // NOT_ELIGIBLE checks
  if (validation.status === 'FAIL') {
    reasons.push('Validation failed');
    return { eligibility: 'NOT_ELIGIBLE', reasons };
  }

  if (proposal.status === 'DRAFT') {
    reasons.push('Proposal is still in draft');
    return { eligibility: 'NOT_ELIGIBLE', reasons };
  }

  if (proposal.status === 'DENIED') {
    reasons.push('Proposal was denied');
    return { eligibility: 'NOT_ELIGIBLE', reasons };
  }

  if (proposal.status === 'EXPIRED') {
    reasons.push('Proposal expired');
    return { eligibility: 'NOT_ELIGIBLE', reasons };
  }

  if (proposal.status === 'EXPIRED_APPROVAL') {
    reasons.push('Approval expired');
    return { eligibility: 'NOT_ELIGIBLE', reasons };
  }

  if (proposal.riskTier === 'CRITICAL') {
    reasons.push('CRITICAL risk proposals require manual review');
    return { eligibility: 'NOT_ELIGIBLE', reasons };
  }

  if (proposal.requiresApproval && proposal.status !== 'APPROVED') {
    reasons.push('Approval required but not approved');
    return { eligibility: 'NOT_ELIGIBLE', reasons };
  }

  // REVIEW_REQUIRED checks
  const reviewReasons = [];
  let needsReview = false;

  if (validation.status === 'WARNING') {
    reviewReasons.push('Validation has warnings');
    needsReview = true;
  }

  if (proposal.riskTier === 'HIGH') {
    reviewReasons.push('HIGH risk requires review');
    needsReview = true;
  }

  if (['CLICK', 'TYPE'].includes(proposal.commandType)) {
    reviewReasons.push(`${proposal.commandType} commands require review`);
    needsReview = true;
  }

  if (proposal.targetUrl && !isDomainAllowlisted(proposal.targetUrl)) {
    reviewReasons.push('Domain not allowlisted');
    needsReview = true;
  }

  if (proposal.status === 'PENDING_APPROVAL') {
    reviewReasons.push('Still pending approval');
    needsReview = true;
  }

  if (needsReview) {
    return { eligibility: 'REVIEW_REQUIRED', reasons: reviewReasons };
  }

  // ELIGIBLE_PREVIEW checks
  if (
    validation.status === 'PASS' &&
    proposal.status === 'APPROVED' &&
    ['LOW', 'MEDIUM'].includes(proposal.riskTier) &&
    !isProposalExpired(proposal) &&
    proposal.targetUrl?.toLowerCase().startsWith('https://') &&
    isDomainAllowlisted(proposal.targetUrl) &&
    ['READ', 'NAVIGATE', 'EXTRACT', 'VERIFY'].includes(proposal.commandType)
  ) {
    return { eligibility: 'ELIGIBLE_PREVIEW', reasons: ['Ready for execution'] };
  }

  // Default to review required
  return { eligibility: 'REVIEW_REQUIRED', reasons: ['Does not meet eligibility criteria'] };
};

const STATUS_CONFIG = {
  DRAFT: { icon: Clock, color: 'text-slate-400', bg: 'bg-slate-400/5 border-slate-400/20' },
  PENDING_APPROVAL: { icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-500/5 border-amber-500/20' },
  APPROVED: { icon: CheckCircle2, color: 'text-primary', bg: 'bg-primary/5 border-primary/20' },
  DENIED: { icon: XCircle, color: 'text-destructive', bg: 'bg-destructive/5 border-destructive/20' },
  EXPIRED: { icon: XCircle, color: 'text-destructive', bg: 'bg-destructive/5 border-destructive/20' },
  EXPIRED_APPROVAL: { icon: XCircle, color: 'text-destructive', bg: 'bg-destructive/5 border-destructive/20' },
};

const RISK_COLORS = {
  LOW: 'text-blue-400',
  MEDIUM: 'text-amber-500',
  HIGH: 'text-orange-500',
  CRITICAL: 'text-destructive',
};

// Audit event logging
const createAuditEvent = (eventType, actor, opts = {}) => ({
  eventType,
  timestamp: new Date().toISOString(),
  actor,
  previousStatus: opts.previousStatus || null,
  nextStatus: opts.nextStatus || null,
  validationResult: opts.validationResult || null,
  note: opts.note || null,
});

// Validation logic
const validateProposal = (proposal) => {
  const errors = [];
  const warnings = [];

  // Required fields
  if (!proposal.commandTitle?.trim()) errors.push('Command title is required');
  if (!proposal.commandType) errors.push('Command type is required');
  if (!proposal.reason?.trim()) errors.push('Reason is required');
  if (!proposal.proposedBy?.trim()) errors.push('Proposed by is required');
  if (!proposal.riskTier) errors.push('Risk tier is required');

  // URL validation
  const needsUrl = ['NAVIGATE', 'READ', 'EXTRACT', 'CLICK', 'TYPE', 'VERIFY'].includes(proposal.commandType);
  if (needsUrl && !proposal.targetUrl?.trim()) {
    errors.push(`${proposal.commandType} requires a target URL`);
  }

  if (proposal.targetUrl) {
    const url = proposal.targetUrl.toLowerCase();
    if (!url.startsWith('https://')) {
      errors.push('URL must use HTTPS (https://)');
    }
    if (url.startsWith('http://')) errors.push('HTTP is not allowed; use HTTPS only');
    if (url.includes('localhost') || url.includes('127.0.0.1')) {
      errors.push('Localhost is not allowed');
    }
    if (/^https:\/\/(10\.|172\.(1[6-9]|2[0-9]|3[01])\.|192\.168\.)/.test(url)) {
      errors.push('Private IP ranges (10.x, 172.16-31.x, 192.168.x) are not allowed');
    }
    if (url.startsWith('file://') || url.startsWith('javascript:') || url.startsWith('data:')) {
      errors.push('URLs must be https:// only; no file://, javascript:, or data: URIs');
    }
  }

  // Selector validation
  const needsSelector = ['CLICK', 'TYPE', 'EXTRACT', 'VERIFY'].includes(proposal.commandType);
  if (needsSelector && !proposal.selector?.trim()) {
    errors.push(`${proposal.commandType} requires a CSS selector`);
  }

  // Input text validation
  if (proposal.commandType === 'TYPE' && !proposal.inputText?.trim()) {
    errors.push('TYPE requires input text');
  }
  if (proposal.commandType !== 'TYPE' && proposal.inputText?.trim() && !proposal.reason.includes('input text')) {
    warnings.push('Input text provided for non-TYPE command; consider justifying in reason');
  }

  // Risk tier validation
  if (['CLICK', 'TYPE'].includes(proposal.commandType) && proposal.riskTier === 'LOW') {
    warnings.push(`${proposal.commandType} commands should be MEDIUM risk or higher`);
  }

  // Check if navigating to unknown domain with LOW risk
  if (proposal.commandType === 'NAVIGATE' && proposal.riskTier === 'LOW' && proposal.targetUrl) {
    const domain = new URL(proposal.targetUrl).hostname;
    const commonDomains = ['google.com', 'github.com', 'stackoverflow.com', 'example.com'];
    if (!commonDomains.some(d => domain.includes(d))) {
      warnings.push('Navigating to an unfamiliar domain should be MEDIUM risk or higher');
    }
  }

  // CRITICAL risk warning
  if (proposal.riskTier === 'CRITICAL') {
    warnings.push('CRITICAL risk proposals require manual review and cannot be auto-approved');
  }

  return {
    status: errors.length > 0 ? 'FAIL' : warnings.length > 0 ? 'WARNING' : 'PASS',
    errors,
    warnings,
  };
};

function ProposalForm({ onSubmit, onCancel, currentUser, existingProposal }) {
  const [formData, setFormData] = useState(
    existingProposal || {
      commandTitle: '',
      commandType: 'READ',
      targetUrl: '',
      selector: '',
      inputText: '',
      reason: '',
      riskTier: 'LOW',
      requiresApproval: true,
      proposedBy: currentUser || 'Anonymous',
    }
  );

  const detectChanges = () => {
    if (!existingProposal) return null;
    const changed = [];
    const fields = ['commandTitle', 'commandType', 'targetUrl', 'selector', 'inputText', 'reason', 'riskTier', 'requiresApproval', 'proposedBy'];
    fields.forEach(field => {
      if (formData[field] !== existingProposal[field]) {
        changed.push(field);
      }
    });
    return changed.length > 0 ? changed : null;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.commandTitle.trim() || !formData.targetUrl.trim()) {
      alert('Title and URL are required.');
      return;
    }
    const changedFields = detectChanges();
    onSubmit(formData, changedFields);
    setFormData({
      commandTitle: '',
      commandType: 'READ',
      targetUrl: '',
      selector: '',
      inputText: '',
      reason: '',
      riskTier: 'LOW',
      requiresApproval: true,
      proposedBy: currentUser || 'Anonymous',
    });
  };

  return (
    <form onSubmit={handleSubmit} className="border border-border/50 rounded-lg bg-secondary/10 p-4 space-y-3">
      {existingProposal && (
        <div className="text-[9px] text-amber-500 px-3 py-2 bg-amber-500/10 border border-amber-500/20 rounded">
          ✏️ Editing proposal — changes will be tracked in audit trail
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="text-[9px] font-semibold text-foreground block mb-1">Command Title</label>
          <input
            type="text"
            value={formData.commandTitle}
            onChange={(e) => setFormData({ ...formData, commandTitle: e.target.value })}
            placeholder="e.g., Read page title"
            className="w-full bg-card border border-border text-[10px] px-2 py-1.5 text-foreground placeholder:text-slate-500 outline-none focus:border-primary/50 rounded"
          />
        </div>

        <div>
          <label className="text-[9px] font-semibold text-foreground block mb-1">Command Type</label>
          <select
            value={formData.commandType}
            onChange={(e) => setFormData({ ...formData, commandType: e.target.value })}
            className="w-full bg-card border border-border text-[10px] px-2 py-1.5 text-foreground outline-none focus:border-primary/50 rounded"
          >
            {COMMAND_TYPES.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-[9px] font-semibold text-foreground block mb-1">Target URL</label>
          <input
            type="text"
            value={formData.targetUrl}
            onChange={(e) => setFormData({ ...formData, targetUrl: e.target.value })}
            placeholder="https://example.com"
            className="w-full bg-card border border-border text-[10px] px-2 py-1.5 text-foreground placeholder:text-slate-500 outline-none focus:border-primary/50 rounded"
          />
        </div>

        <div>
          <label className="text-[9px] font-semibold text-foreground block mb-1">CSS Selector (optional)</label>
          <input
            type="text"
            value={formData.selector}
            onChange={(e) => setFormData({ ...formData, selector: e.target.value })}
            placeholder=".button-class"
            className="w-full bg-card border border-border text-[10px] px-2 py-1.5 text-foreground placeholder:text-slate-500 outline-none focus:border-primary/50 rounded"
          />
        </div>

        <div>
          <label className="text-[9px] font-semibold text-foreground block mb-1">Input Text (optional)</label>
          <input
            type="text"
            value={formData.inputText}
            onChange={(e) => setFormData({ ...formData, inputText: e.target.value })}
            placeholder="Text to type"
            className="w-full bg-card border border-border text-[10px] px-2 py-1.5 text-foreground placeholder:text-slate-500 outline-none focus:border-primary/50 rounded"
          />
        </div>

        <div>
          <label className="text-[9px] font-semibold text-foreground block mb-1">Risk Tier</label>
          <select
            value={formData.riskTier}
            onChange={(e) => setFormData({ ...formData, riskTier: e.target.value })}
            className="w-full bg-card border border-border text-[10px] px-2 py-1.5 text-foreground outline-none focus:border-primary/50 rounded"
          >
            {RISK_TIERS.map(tier => (
              <option key={tier} value={tier}>{tier}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="text-[9px] font-semibold text-foreground block mb-1">Reason for Proposal</label>
        <textarea
          value={formData.reason}
          onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
          placeholder="Explain why this command is needed..."
          rows={2}
          className="w-full bg-card border border-border text-[10px] px-2 py-1.5 text-foreground placeholder:text-slate-500 outline-none focus:border-primary/50 rounded resize-none"
        />
      </div>

      <div className="flex items-center gap-3">
        <label className="flex items-center gap-2 text-[9px] text-foreground cursor-pointer">
          <input
            type="checkbox"
            checked={formData.requiresApproval}
            onChange={(e) => setFormData({ ...formData, requiresApproval: e.target.checked })}
            className="w-3 h-3 rounded"
          />
          <span>Requires Approval</span>
        </label>
        <div className="flex-1" />
        <input
          type="text"
          value={formData.proposedBy}
          onChange={(e) => setFormData({ ...formData, proposedBy: e.target.value })}
          placeholder="Your name/email"
          className="bg-card border border-border text-[9px] px-2 py-1 text-foreground placeholder:text-slate-500 outline-none focus:border-primary/50 rounded w-40"
        />
      </div>

      <div className="flex gap-2 justify-end">
        <button
          type="button"
          onClick={onCancel}
          className="px-3 py-1.5 text-[9px] border border-border text-foreground hover:bg-secondary/50 transition-colors rounded"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-3 py-1.5 text-[9px] border border-primary/50 bg-primary/10 text-primary hover:bg-primary/20 transition-colors font-semibold rounded flex items-center gap-1"
        >
          {existingProposal ? (
            <>✏️ Save Changes</>
          ) : (
            <>
              <Plus className="w-3 h-3" />
              Create Proposal
            </>
          )}
        </button>
      </div>
    </form>
  );
}

function ValidationBadge({ validation }) {
  const config = {
    PASS: { bg: 'bg-primary/5 border-primary/20', color: 'text-primary', label: '✓ PASS' },
    WARNING: { bg: 'bg-amber-500/5 border-amber-500/20', color: 'text-amber-500', label: '⚠ WARNING' },
    FAIL: { bg: 'bg-destructive/5 border-destructive/20', color: 'text-destructive', label: '✗ FAIL' },
  };
  const cfg = config[validation.status];
  return <div className={`text-[8px] px-2 py-0.5 border rounded font-semibold ${cfg.bg} ${cfg.color}`}>{cfg.label}</div>;
}

function AuditTrailExpanded({ events }) {
  return (
    <div className="space-y-1 text-[8px]">
      {events.map((event, i) => (
        <div key={i} className="flex items-start gap-2 px-2 py-1 bg-card/50 border border-border/20 rounded">
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-foreground">{event.eventType}</div>
            <div className="text-foreground/60 mt-0.5">
              {event.actor && <span>{event.actor} · </span>}
              <span className="font-mono">{new Date(event.timestamp).toLocaleString()}</span>
            </div>
            {event.previousStatus && event.nextStatus && (
              <div className="text-foreground/60 mt-0.5">
                {event.previousStatus} → {event.nextStatus}
              </div>
            )}
            {event.validationResult && (
              <div className="text-foreground/60 mt-0.5">
                Validation: <span className="font-semibold">{event.validationResult}</span>
              </div>
            )}
            {event.note && (
              <div className="text-foreground/60 mt-0.5 italic">{event.note}</div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function ProposalRow({ proposal, index, onApprove, onDeny, onExpire, onDelete, onSubmitForApproval, setEditingProposalIndex, setShowForm }) {
  const [showAudit, setShowAudit] = useState(false);
  const statusCfg = STATUS_CONFIG[proposal.status];
  const StatusIcon = statusCfg.icon;
  const validation = validateProposal(proposal);
  const { eligibility, reasons: eligibilityReasons } = calculateExecutionEligibility(proposal, validation);
  const canSubmit = validation.status !== 'FAIL';
  const canApprove = validation.status !== 'FAIL' && proposal.riskTier !== 'CRITICAL';

  return (
    <>
      <tr 
        className="border-b border-border/20 hover:bg-secondary/20 transition-colors cursor-pointer"
        onClick={() => setShowAudit(!showAudit)}
      >
        <td className="px-3 py-2 text-[10px] font-semibold text-foreground">{proposal.commandTitle}</td>
        <td className="px-3 py-2 text-[9px]">
          <span className="text-slate-400">{proposal.commandType}</span>
        </td>
        <td className="px-3 py-2 text-[9px]">
          <span className={`font-semibold ${RISK_COLORS[proposal.riskTier]}`}>{proposal.riskTier}</span>
        </td>
        <td className="px-3 py-2 text-[9px]">
          {proposal.requiresApproval ? (
            <span className="text-amber-500 font-semibold">Yes</span>
          ) : (
            <span className="text-slate-400">No</span>
          )}
        </td>
        <td className="px-3 py-2">
          <ValidationBadge validation={validation} />
        </td>
        <td className="px-3 py-2">
          <div className={`text-[8px] px-2 py-0.5 border rounded font-semibold ${
            eligibility === 'ELIGIBLE_PREVIEW' ? 'bg-primary/5 border-primary/20 text-primary' :
            eligibility === 'REVIEW_REQUIRED' ? 'bg-amber-500/5 border-amber-500/20 text-amber-500' :
            'bg-destructive/5 border-destructive/20 text-destructive'
          }`}>
            {eligibility.replace(/_/g, ' ')}
          </div>
        </td>
        <td className="px-3 py-2 text-[9px] font-mono">
          {(proposal.status === 'PENDING_APPROVAL' || proposal.status === 'APPROVED') && proposal.expirationAt ? (
            <span className={isProposalExpired(proposal) ? 'text-destructive font-semibold' : 'text-foreground/60'}>
              {getTimeRemaining(proposal.expirationAt)}
            </span>
          ) : (
            <span className="text-slate-400">—</span>
          )}
        </td>
        <td className="px-3 py-2">
          <div className={`inline-flex items-center gap-1 text-[8px] px-2 py-0.5 border rounded font-semibold ${statusCfg.bg} ${statusCfg.color}`}>
            <StatusIcon className="w-2.5 h-2.5" />
            {proposal.status}
          </div>
        </td>
        <td className="px-3 py-2 text-[8px] text-foreground/60 font-mono">
          {new Date(proposal.proposedAt).toLocaleString()}
        </td>
        <td className="px-3 py-2">
          <div className="flex gap-1">
            {proposal.status === 'DRAFT' && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingProposalIndex(index);
                    setShowForm(true);
                  }}
                  className="px-2 py-1 text-[8px] border border-slate-500/30 bg-slate-500/5 text-slate-400 hover:bg-slate-500/10 transition-colors rounded"
                  title="Edit proposal"
                >
                  ✏️
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onSubmitForApproval(index);
                  }}
                  disabled={!canSubmit}
                  title={!canSubmit ? 'Fix validation errors before submitting' : ''}
                  className={`px-2 py-1 text-[8px] border rounded transition-colors ${
                    canSubmit
                      ? 'border-amber-500/30 bg-amber-500/5 text-amber-500 hover:bg-amber-500/10'
                      : 'border-destructive/30 bg-destructive/5 text-destructive/50 cursor-not-allowed'
                  }`}
                >
                  <Send className="w-2.5 h-2.5" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(index);
                  }}
                  className="px-2 py-1 text-[8px] border border-destructive/30 bg-destructive/5 text-destructive hover:bg-destructive/10 transition-colors rounded"
                >
                  <Trash2 className="w-2.5 h-2.5" />
                </button>
              </>
            )}

            {proposal.status === 'PENDING_APPROVAL' && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onApprove(index);
                  }}
                  disabled={!canApprove || isProposalExpired(proposal)}
                  title={isProposalExpired(proposal) ? 'Proposal has expired' : !canApprove ? canApprove === false ? 'Fix validation errors first' : 'CRITICAL risk requires manual review' : ''}
                  className={`px-2 py-1 text-[8px] border rounded transition-colors ${
                    !canApprove || isProposalExpired(proposal)
                      ? 'border-primary/30 bg-primary/5 text-primary/50 cursor-not-allowed'
                      : 'border-primary/30 bg-primary/5 text-primary hover:bg-primary/10'
                  }`}
                >
                  Approve
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeny(index);
                  }}
                  className="px-2 py-1 text-[8px] border border-destructive/30 bg-destructive/5 text-destructive hover:bg-destructive/10 transition-colors rounded"
                >
                  Deny
                </button>
              </>
            )}

            {proposal.status === 'APPROVED' && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onExpire(index);
                }}
                className="px-2 py-1 text-[8px] border border-slate-500/30 bg-slate-500/5 text-slate-400 hover:bg-slate-500/10 transition-colors rounded"
              >
                Expire
              </button>
            )}

            {(proposal.status === 'DENIED' || proposal.status === 'EXPIRED') && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(index);
                }}
                className="px-2 py-1 text-[8px] border border-slate-500/30 bg-slate-500/5 text-slate-400 hover:bg-slate-500/10 transition-colors rounded"
              >
                <Trash2 className="w-2.5 h-2.5" />
              </button>
            )}
          </div>
        </td>
      </tr>

      {/* Validation & Eligibility messages row */}
      {(validation.errors.length > 0 || validation.warnings.length > 0 || eligibilityReasons.length > 0) && (
        <tr className="border-b border-border/20 bg-secondary/10">
          <td colSpan="10" className="px-3 py-2">
            <div className="space-y-2 text-[8px]">
              {validation.errors.length > 0 && (
                <div>
                  <div className="font-semibold text-destructive mb-1">Validation Errors:</div>
                  {validation.errors.map((err, i) => (
                    <div key={i} className="text-destructive flex items-start gap-2 ml-2">
                      <span className="shrink-0 mt-0.5">✗</span>
                      <span>{err}</span>
                    </div>
                  ))}
                </div>
              )}
              {validation.warnings.length > 0 && (
                <div>
                  <div className="font-semibold text-amber-500 mb-1">Validation Warnings:</div>
                  {validation.warnings.map((warn, i) => (
                    <div key={i} className="text-amber-500 flex items-start gap-2 ml-2">
                      <span className="shrink-0 mt-0.5">⚠</span>
                      <span>{warn}</span>
                    </div>
                  ))}
                </div>
              )}
              {eligibilityReasons.length > 0 && (
                <div>
                  <div className={`font-semibold mb-1 ${
                    eligibility === 'ELIGIBLE_PREVIEW' ? 'text-primary' :
                    eligibility === 'REVIEW_REQUIRED' ? 'text-amber-500' :
                    'text-destructive'
                  }`}>
                    Execution Eligibility:
                  </div>
                  {eligibilityReasons.map((reason, i) => (
                    <div key={i} className={`flex items-start gap-2 ml-2 ${
                      eligibility === 'ELIGIBLE_PREVIEW' ? 'text-primary' :
                      eligibility === 'REVIEW_REQUIRED' ? 'text-amber-500' :
                      'text-destructive'
                    }`}>
                      <span className="shrink-0 mt-0.5">•</span>
                      <span>{reason}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </td>
        </tr>
      )}

      {/* Audit trail row */}
      {showAudit && proposal.auditEvents && proposal.auditEvents.length > 0 && (
        <tr className="border-b border-border/20 bg-secondary/5">
          <td colSpan="9" className="px-3 py-2">
            <div className="text-[9px] font-semibold text-foreground mb-2">Audit Trail</div>
            <AuditTrailExpanded events={proposal.auditEvents} />
          </td>
        </tr>
      )}
    </>
  );
}

export default function OpenClawCommandProposalQueue() {
  const [proposals, setProposals] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [showAuditLog, setShowAuditLog] = useState(false);
  const [editingProposalIndex, setEditingProposalIndex] = useState(null);

  // Load proposals from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('openclawProposalQueue');
      if (stored) {
        setProposals(JSON.parse(stored));
      }
    } catch (err) {
      console.error('Error loading proposals:', err);
    }
  }, []);

  // Save proposals to localStorage whenever they change
  const saveProposals = (updated) => {
    setProposals(updated);
    try {
      localStorage.setItem('openclawProposalQueue', JSON.stringify(updated));
    } catch (err) {
      console.error('Error saving proposals:', err);
    }
  };

  // Get all audit events across all proposals (latest 25)
  const getAllAuditEvents = () => {
    const allEvents = proposals.flatMap(p =>
      (p.auditEvents || []).map(e => ({ ...e, proposalId: p.id, proposalTitle: p.commandTitle }))
    );
    return allEvents.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 25);
  };

  const handleCreateProposal = (formData, changedFields) => {
    if (editingProposalIndex !== null) {
      // Update existing proposal
      const updated = [...proposals];
      const oldProposal = updated[editingProposalIndex];
      const oldValidation = validateProposal(oldProposal);
      const newValidation = validateProposal(formData);

      const events = [...(oldProposal.auditEvents || [])];

      // Add UPDATED event
      if (changedFields && changedFields.length > 0) {
        events.push(createAuditEvent('UPDATED', 'User', { note: `Changed fields: ${changedFields.join(', ')}`, changedFields }));
      }

      // Add VALIDATION_CHANGED if validation result changed
      if (oldValidation.status !== newValidation.status) {
        events.push(
          createAuditEvent('VALIDATION_CHANGED', 'User', {
            previousValidationResult: oldValidation.status,
            nextValidationResult: newValidation.status,
            validationMessages: newValidation.errors.length > 0 ? newValidation.errors : newValidation.warnings,
            previousValidationResult: oldValidation.status,
            nextValidationResult: newValidation.status,
          })
        );
      }

      updated[editingProposalIndex] = {
        ...formData,
        id: oldProposal.id,
        status: oldProposal.status,
        proposedAt: oldProposal.proposedAt,
        auditEvents: events,
      };
      saveProposals(updated);
      setEditingProposalIndex(null);
      setShowForm(false);
    } else {
      // Create new proposal
      const proposal = {
        ...formData,
        id: Date.now().toString(),
        status: formData.requiresApproval ? 'PENDING_APPROVAL' : 'DRAFT',
        proposedAt: new Date().toISOString(),
        auditEvents: [createAuditEvent('CREATED', 'User', { nextStatus: formData.requiresApproval ? 'PENDING_APPROVAL' : 'DRAFT' })],
      };
      saveProposals([proposal, ...proposals]);
      setShowForm(false);
    }
  };

  const handleSubmitForApproval = (index) => {
    const updated = [...proposals];
    const oldStatus = updated[index].status;
    const expirationAt = calculateExpirationTime(updated[index].riskTier);
    updated[index] = {
      ...updated[index],
      status: 'PENDING_APPROVAL',
      expirationAt,
      auditEvents: [
        ...(updated[index].auditEvents || []),
        createAuditEvent('SUBMITTED_FOR_APPROVAL', 'User', { previousStatus: oldStatus, nextStatus: 'PENDING_APPROVAL', note: `Expires in ${EXPIRATION_HOURS[updated[index].riskTier]} hours` }),
      ],
    };
    saveProposals(updated);
  };

  const handleApprove = (index) => {
    const updated = [...proposals];
    const oldStatus = updated[index].status;
    
    // Check if expired
    if (isProposalExpired(updated[index])) {
      alert('Cannot approve expired proposal.');
      return;
    }
    
    updated[index] = {
      ...updated[index],
      status: 'APPROVED',
      auditEvents: [
        ...(updated[index].auditEvents || []),
        createAuditEvent('APPROVED', 'User', { previousStatus: oldStatus, nextStatus: 'APPROVED' }),
      ],
    };
    saveProposals(updated);
  };

  const handleDeny = (index) => {
    const updated = [...proposals];
    const oldStatus = updated[index].status;
    updated[index] = {
      ...updated[index],
      status: 'DENIED',
      auditEvents: [
        ...(updated[index].auditEvents || []),
        createAuditEvent('DENIED', 'User', { previousStatus: oldStatus, nextStatus: 'DENIED' }),
      ],
    };
    saveProposals(updated);
  };

  const handleExpire = (index) => {
    const updated = [...proposals];
    const oldStatus = updated[index].status;
    updated[index] = {
      ...updated[index],
      status: 'EXPIRED',
      auditEvents: [
        ...(updated[index].auditEvents || []),
        createAuditEvent('EXPIRED', 'User', { previousStatus: oldStatus, nextStatus: 'EXPIRED' }),
      ],
    };
    saveProposals(updated);
  };

  const handleDelete = (index) => {
    const proposal = proposals[index];
    // Save deleted draft to separate audit log
    if (proposal.status === 'DRAFT') {
      try {
        const deletedLog = JSON.parse(localStorage.getItem('openclawDeletedProposalAuditLog') || '[]');
        deletedLog.push({
          proposalId: proposal.id,
          proposalTitle: proposal.commandTitle,
          deletedAt: new Date().toISOString(),
          event: createAuditEvent('DELETED_DRAFT', 'User', { previousStatus: 'DRAFT' }),
        });
        localStorage.setItem('openclawDeletedProposalAuditLog', JSON.stringify(deletedLog));
      } catch (err) {
        console.error('Error saving deleted proposal audit:', err);
      }
    }
    const updated = proposals.filter((_, i) => i !== index);
    saveProposals(updated);
  };

  // Apply expiration status updates
  const proposalsWithExpiration = proposals.map(p => {
    if (isProposalExpired(p) && p.status === 'PENDING_APPROVAL') {
      // Auto-expire PENDING_APPROVAL proposals
      return {
        ...p,
        status: 'EXPIRED',
        auditEvents: [
          ...(p.auditEvents || []),
          ...(p.auditEvents?.some(e => e.eventType === 'EXPIRED') ? [] : [createAuditEvent('EXPIRED', 'System', { previousStatus: 'PENDING_APPROVAL', nextStatus: 'EXPIRED', note: 'Automatically expired due to time limit' })]),
        ],
      };
    }
    if (isProposalExpired(p) && p.status === 'APPROVED') {
      // Auto-expire APPROVED proposals
      return {
        ...p,
        status: 'EXPIRED_APPROVAL',
        auditEvents: [
          ...(p.auditEvents || []),
          ...(p.auditEvents?.some(e => e.eventType === 'EXPIRED_APPROVAL') ? [] : [createAuditEvent('EXPIRED_APPROVAL', 'System', { previousStatus: 'APPROVED', nextStatus: 'EXPIRED_APPROVAL', note: 'Automatically expired due to time limit' })]),
        ],
      };
    }
    return p;
  });

  // Save if any expired (only once)
  if (proposalsWithExpiration.some((p, i) => proposals[i]?.status !== p.status)) {
    saveProposals(proposalsWithExpiration);
  }

  const filteredProposals = filterStatus === 'ALL'
    ? proposalsWithExpiration
    : proposalsWithExpiration.filter(p => p.status === filterStatus);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="text-[11px] uppercase tracking-widest text-slate-400 mb-1 font-semibold">OpenClaw Module</div>
          <div className="text-[13px] font-semibold text-foreground">Command Proposal Queue</div>
        </div>
        {!showForm && (
          <button
            onClick={() => {
              setEditingProposalIndex(null);
              setShowForm(true);
            }}
            className="px-4 py-2 text-[10px] border border-primary/50 bg-primary/10 text-primary hover:bg-primary/20 transition-colors font-semibold rounded flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            New Proposal
          </button>
        )}
      </div>

      {/* Warning Banners */}
      <div className="flex items-start gap-3 px-4 py-3 bg-amber-500/5 border border-amber-500/20 rounded-lg">
        <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
        <div className="text-[10px] text-amber-500/80">
          <div className="font-semibold mb-0.5">This queue stores proposed commands only.</div>
          <div className="text-[9px] text-amber-500/70">It does not call OpenClaw and does not execute browser actions. All data is stored locally.</div>
        </div>
      </div>

      <div className="flex items-start gap-3 px-4 py-3 bg-primary/5 border border-primary/20 rounded-lg">
        <Shield className="w-4 h-4 text-primary shrink-0 mt-0.5" />
        <div className="text-[10px] text-primary/80">
          <div className="font-semibold mb-0.5">Execution Eligibility is preview-only.</div>
          <div className="text-[9px] text-primary/70">It does not execute commands or call OpenClaw. Use it to understand which proposals could be executed in the future when the execution bridge is enabled.</div>
        </div>
      </div>

      {/* Proposal Form */}
      {showForm && (
        <ProposalForm
          onSubmit={handleCreateProposal}
          onCancel={() => {
            setShowForm(false);
            setEditingProposalIndex(null);
          }}
          currentUser="Operator"
          existingProposal={editingProposalIndex !== null ? proposals[editingProposalIndex] : null}
        />
      )}

      {/* Filter & Summary */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex gap-1 flex-wrap">
          {['ALL', ...STATUSES].map(status => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-2.5 py-1 text-[9px] border rounded font-semibold transition-colors ${
                filterStatus === status
                  ? 'border-primary text-primary bg-primary/10'
                  : 'border-border text-slate-400 hover:text-foreground hover:bg-secondary/50'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
        <button
          onClick={() => setShowAuditLog(!showAuditLog)}
          className="ml-auto px-2.5 py-1 text-[9px] border border-primary/30 bg-primary/5 text-primary hover:bg-primary/10 transition-colors rounded font-semibold"
        >
          {showAuditLog ? 'Hide' : 'Show'} Global Audit Log
        </button>
        <div className="text-[9px] text-slate-400">
          {filteredProposals.length} proposal{filteredProposals.length !== 1 ? 's' : ''} · {proposals.length} total
        </div>
      </div>

      {/* Global Audit Log */}
      {showAuditLog && (
        <div className="border border-primary/20 bg-primary/5 rounded-lg p-4 space-y-3">
          <div className="text-[11px] font-semibold text-foreground uppercase tracking-wider">Global Audit Log — Latest 25 Events</div>
          <div className="border border-border/50 rounded overflow-x-auto">
            <table className="w-full text-[8px]">
              <thead className="border-b border-border/30 bg-secondary/10">
                <tr>
                  <th className="text-left px-3 py-2 font-semibold text-foreground">Event Type</th>
                  <th className="text-left px-3 py-2 font-semibold text-foreground">Proposal</th>
                  <th className="text-left px-3 py-2 font-semibold text-foreground">Actor</th>
                  <th className="text-left px-3 py-2 font-semibold text-foreground">Details</th>
                  <th className="text-left px-3 py-2 font-semibold text-foreground">Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {getAllAuditEvents().map((event, i) => (
                  <tr key={i} className="border-b border-border/20 hover:bg-secondary/20 transition-colors">
                    <td className="px-3 py-2 font-semibold text-foreground">{event.eventType}</td>
                    <td className="px-3 py-2 text-foreground/80 truncate max-w-xs">{event.proposalTitle}</td>
                    <td className="px-3 py-2 text-foreground/60">{event.actor || '—'}</td>
                    <td className="px-3 py-2 text-foreground/60 text-[7px] max-w-xs truncate">
                      {event.previousStatus && event.nextStatus && `${event.previousStatus} → ${event.nextStatus}`}
                      {event.changedFields && `Changed: ${event.changedFields.join(', ')}`}
                      {event.previousValidationResult && event.nextValidationResult && `${event.previousValidationResult} → ${event.nextValidationResult}`}
                      {event.note && event.note}
                      {!event.previousStatus && !event.changedFields && !event.previousValidationResult && '—'}
                    </td>
                    <td className="px-3 py-2 text-foreground/60 font-mono whitespace-nowrap">{new Date(event.timestamp).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="text-[8px] text-primary/70">Global audit events from all proposals. Click on a proposal row to view its full audit trail.</div>
        </div>
      )}

      {/* Proposals Table */}
      {filteredProposals.length > 0 ? (
        <div className="border border-border/50 rounded-lg overflow-x-auto">
          <table className="w-full text-[9px]">
            <thead className="border-b border-border/30 bg-secondary/10">
              <tr>
                <th className="text-left px-3 py-2 font-semibold text-foreground">Title</th>
                <th className="text-left px-3 py-2 font-semibold text-foreground">Type</th>
                <th className="text-left px-3 py-2 font-semibold text-foreground">Risk</th>
                <th className="text-left px-3 py-2 font-semibold text-foreground">Approval</th>
                <th className="text-left px-3 py-2 font-semibold text-foreground">Validation</th>
                <th className="text-left px-3 py-2 font-semibold text-foreground">Eligibility</th>
                <th className="text-left px-3 py-2 font-semibold text-foreground">Expires In</th>
                <th className="text-left px-3 py-2 font-semibold text-foreground">Status</th>
                <th className="text-left px-3 py-2 font-semibold text-foreground">Proposed</th>
                <th className="text-left px-3 py-2 font-semibold text-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProposals.map((proposal, idx) => (
                <ProposalRow
                  key={proposal.id}
                  proposal={proposal}
                  index={proposals.indexOf(proposal)}
                  onApprove={handleApprove}
                  onDeny={handleDeny}
                  onExpire={handleExpire}
                  onDelete={handleDelete}
                  onSubmitForApproval={handleSubmitForApproval}
                  setEditingProposalIndex={setEditingProposalIndex}
                  setShowForm={setShowForm}
                />
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-8 px-4 bg-secondary/10 border border-border/50 rounded-lg">
          <div className="text-[10px] text-slate-400">No proposals matching filter</div>
          {filterStatus !== 'ALL' && (
            <button
              onClick={() => setFilterStatus('ALL')}
              className="text-[9px] text-primary hover:underline mt-1"
            >
              Show all proposals
            </button>
          )}
        </div>
      )}

      {/* Validation Legend */}
      <div className="border border-border/50 rounded-lg bg-secondary/10 p-3 space-y-2 text-[9px]">
        <div className="font-semibold text-foreground mb-2">Validation Rules</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[8px] text-foreground/80">
        <div>
          <div className="font-semibold text-primary mb-1">Required Fields:</div>
          <ul className="list-disc ml-4 space-y-0.5 text-foreground/70">
            <li>Title, Type, Reason, Proposed By, Risk Tier</li>
          </ul>
        </div>
        <div>
          <div className="font-semibold text-primary mb-1">URL Rules:</div>
          <ul className="list-disc ml-4 space-y-0.5 text-foreground/70">
            <li>HTTPS only, no localhost/127.0.0.1/private IPs</li>
            <li>No file://, javascript:, or data: URIs</li>
          </ul>
        </div>
        <div>
          <div className="font-semibold text-primary mb-1">Selector Rules:</div>
          <ul className="list-disc ml-4 space-y-0.5 text-foreground/70">
            <li>Required for CLICK, TYPE, EXTRACT, VERIFY</li>
            <li>Optional for READ, NAVIGATE</li>
          </ul>
        </div>
        <div>
          <div className="font-semibold text-primary mb-1">Expiration & Risk:</div>
          <ul className="list-disc ml-4 space-y-0.5 text-foreground/70">
            <li>LOW: 24h, MEDIUM: 12h, HIGH: 4h, CRITICAL: 1h</li>
            <li>Expires when submitted for approval</li>
          </ul>
        </div>
        </div>
      </div>

      {/* Footer Notice */}
      <div className="text-[8px] text-foreground/60 px-4 py-3 bg-secondary/10 border border-border/30 rounded-lg">
        Validation is client-side only. Prevents FAIL proposals from submission/approval. CRITICAL risk requires manual review and cannot be auto-approved.
      </div>
    </div>
  );
}