/**
 * OpenClawValidatorRecordReviewDecisionGate — Phase 47
 * Operator review gate for Phase 46 validator records.
 * UI-only · localStorage-only · browser-only · no execution · no dispatch.
 *
 * Does NOT:
 *   - Call OpenClaw, SafeBridge, MCP, brokers, banks, bureaus
 *   - Execute commands or dispatch actions
 *   - Make backend routes, fetch calls, or API mutations
 *   - Use timers, polling, or schedulers
 *   - Handle credentials or browser automation
 */

import React, { useState, useEffect } from 'react';
import { Download, CheckCircle2, AlertCircle } from 'lucide-react';

const VALIDATOR_KEY = 'openclawPhase46DryRunValidatorRecords';
const REVIEW_KEY = 'openclawPhase47ValidatorReviewDecisions';
const MAX_RECORDS = 50;

const DECISIONS = [
  'APPROVED_FOR_DRY_RUN_REVIEW',
  'REJECTED',
  'NEEDS_CHANGES',
];

const DECISION_STYLES = {
  APPROVED_FOR_DRY_RUN_REVIEW: 'border-primary/30 bg-primary/5 text-primary',
  REJECTED:                    'border-destructive/30 bg-destructive/5 text-destructive',
  NEEDS_CHANGES:               'border-amber-500/30 bg-amber-500/5 text-amber-400',
};

const SAFETY_CLAIMS = [
  'Operator review decision only',
  'No live execution',
  'No dispatch',
  'No OpenClaw command dispatch',
  'No browser automation execution',
  'No broker calls',
  'No bank calls',
  'No credit bureau calls',
  'No credential handling',
  'Browser-only local record',
];

const EXPORT_SAFETY_CLAIMS = [
  'Validator review decisions only',
  'No live execution',
  'No dispatch',
  'No broker calls',
  'No bank calls',
  'No credit bureau calls',
  'No credential handling',
  'No OpenClaw command dispatch',
  'No backend mutation',
  'Browser-only export',
];

function loadFromStorage(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function saveToStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

function generateId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

const EMPTY_FORM = { decision: DECISIONS[0], reviewerName: '', reviewNote: '' };

export default function OpenClawValidatorRecordReviewDecisionGate() {
  const [validatorRecords, setValidatorRecords] = useState([]);
  const [reviewDecisions, setReviewDecisions] = useState([]);
  // Per-record form state keyed by validatorRecordId
  const [forms, setForms] = useState({});
  const [lastAction, setLastAction] = useState(null);

  useEffect(() => {
    setValidatorRecords(loadFromStorage(VALIDATOR_KEY, []));
    setReviewDecisions(loadFromStorage(REVIEW_KEY, []));
  }, []);

  const getForm = (id) => forms[id] || { ...EMPTY_FORM };

  const setForm = (id, patch) =>
    setForms(prev => ({ ...prev, [id]: { ...getForm(id), ...patch } }));

  const reviewedIds = new Set(reviewDecisions.map(r => r.sourceValidatorRecordId).filter(Boolean));

  const handleSaveDecision = (rec) => {
    const form = getForm(rec.validatorRecordId);
    if (!form.decision) return;

    const newReview = {
      reviewId: generateId('phase47-review'),
      reviewedAt: new Date().toISOString(),
      sourcePhase: 'PHASE_46_DRY_RUN_VALIDATOR_RECORD',
      sourceValidatorRecordId: rec.validatorRecordId,
      sourceIntakeId: rec.sourceIntakeId,
      sourceProposalId: rec.sourceProposalId,
      commandType: rec.commandType,
      decision: form.decision,
      reviewerName: form.reviewerName || '',
      reviewNote: form.reviewNote || '',
      executionAllowed: false,
      executionStatus: 'NOT_EXECUTED',
      dispatchAllowed: false,
      dispatchStatus: 'NOT_DISPATCHED',
      safetyClaims: SAFETY_CLAIMS,
    };

    const updated = [newReview, ...reviewDecisions].slice(0, MAX_RECORDS);
    saveToStorage(REVIEW_KEY, updated);
    setReviewDecisions(updated);
    setLastAction(`Review decision saved for ${rec.validatorRecordId} — ${form.decision}`);
    // Clear form for this record
    setForms(prev => ({ ...prev, [rec.validatorRecordId]: { ...EMPTY_FORM } }));
  };

  const handleExport = () => {
    const snapshot = {
      snapshotType: 'VERIDAN_VALIDATOR_REVIEW_DECISIONS_PHASE_47',
      generatedAt: new Date().toISOString(),
      reviewDecisions,
      recordCount: reviewDecisions.length,
      safetyClaims: EXPORT_SAFETY_CLAIMS,
    };
    const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `phase47-validator-review-decisions-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5 font-mono">

      {/* Header */}
      <div className="px-4 py-3 bg-rose-500/5 border border-rose-500/20 rounded-sm">
        <div className="text-[11px] font-bold uppercase tracking-wide text-rose-400 mb-1">
          Phase 47 · Validator Record Review and Decision Gate
        </div>
        <p className="text-[9px] text-slate-400 leading-relaxed">
          Operator review gate for Phase 46 validator records. Decisions are local-only.
          Read-only · no execution · no dispatch · localStorage-only.
        </p>
      </div>

      {/* Safety Banner */}
      <div className="flex items-start gap-2 px-3 py-2.5 bg-amber-500/5 border border-amber-500/20 rounded-sm">
        <AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
        <p className="text-[9px] text-amber-500/90">
          <span className="font-bold">EXECUTION LOCKED</span> — All review records are created with
          executionAllowed=false, executionStatus=NOT_EXECUTED, dispatchAllowed=false, dispatchStatus=NOT_DISPATCHED.
        </p>
      </div>

      {/* Last Action Feedback */}
      {lastAction && (
        <div className="flex items-center gap-2 px-3 py-2 bg-rose-500/5 border border-rose-500/20 rounded-sm">
          <CheckCircle2 className="w-3.5 h-3.5 text-rose-400 shrink-0" />
          <span className="text-[9px] text-rose-400">{lastAction}</span>
        </div>
      )}

      {/* ── Phase 46 Validator Records + Review Controls ── */}
      <div className="bg-card border border-border/50 rounded-sm overflow-hidden">
        <div className="px-4 py-2.5 bg-secondary/30 border-b border-border/40 flex items-center justify-between">
          <div>
            <div className="text-[10px] font-bold uppercase text-slate-200">Phase 46 Validator Records</div>
            <div className="text-[8px] text-slate-500 mt-0.5">
              Read from: <span className="text-blue-400">{VALIDATOR_KEY}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[8px] px-2 py-0.5 border border-rose-500/30 bg-rose-500/5 text-rose-400 rounded font-bold uppercase">
              {validatorRecords.length - reviewedIds.size} pending
            </span>
            <span className="text-[8px] px-2 py-0.5 border border-border/40 bg-secondary/40 text-slate-400 rounded font-bold uppercase">
              {validatorRecords.length} total
            </span>
          </div>
        </div>

        {validatorRecords.length === 0 ? (
          <div className="px-4 py-6 text-center">
            <p className="text-[10px] text-slate-400">
              No Phase 46 dry-run validator records found. Create validator records before review.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border/20">
            {validatorRecords.map((rec, i) => {
              const form = getForm(rec.validatorRecordId);
              const alreadyReviewed = reviewedIds.has(rec.validatorRecordId);
              const existingReview = reviewDecisions.find(r => r.sourceValidatorRecordId === rec.validatorRecordId);

              return (
                <div key={rec.validatorRecordId || i} className="p-4 space-y-3">
                  {/* Record summary row */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[8px]">
                    <div className="px-2.5 py-1.5 bg-secondary/30 border border-border/30 rounded-sm">
                      <div className="text-slate-500 uppercase mb-0.5">createdAt</div>
                      <div className="text-slate-300">{rec.createdAt ? new Date(rec.createdAt).toLocaleString() : '—'}</div>
                    </div>
                    <div className="px-2.5 py-1.5 bg-secondary/30 border border-border/30 rounded-sm">
                      <div className="text-slate-500 uppercase mb-0.5">validatorRecordId</div>
                      <div className="text-violet-400 font-mono truncate" title={rec.validatorRecordId}>{rec.validatorRecordId || '—'}</div>
                    </div>
                    <div className="px-2.5 py-1.5 bg-secondary/30 border border-border/30 rounded-sm">
                      <div className="text-slate-500 uppercase mb-0.5">sourceIntakeId</div>
                      <div className="text-blue-400 font-mono truncate" title={rec.sourceIntakeId}>{rec.sourceIntakeId || '—'}</div>
                    </div>
                    <div className="px-2.5 py-1.5 bg-secondary/30 border border-border/30 rounded-sm">
                      <div className="text-slate-500 uppercase mb-0.5">sourceProposalId</div>
                      <div className="text-slate-300 font-mono truncate" title={rec.sourceProposalId}>{rec.sourceProposalId || '—'}</div>
                    </div>
                    <div className="px-2.5 py-1.5 bg-secondary/30 border border-border/30 rounded-sm">
                      <div className="text-slate-500 uppercase mb-0.5">commandType</div>
                      <div className="text-slate-200">{rec.commandType || '—'}</div>
                    </div>
                    <div className="px-2.5 py-1.5 bg-secondary/30 border border-border/30 rounded-sm">
                      <div className="text-slate-500 uppercase mb-0.5">validatorStatus</div>
                      <span className="px-1.5 py-0.5 rounded border text-[7px] font-bold uppercase border-violet-500/30 bg-violet-500/10 text-violet-400">
                        {rec.validatorStatus || '—'}
                      </span>
                    </div>
                    <div className="px-2.5 py-1.5 bg-secondary/30 border border-border/30 rounded-sm">
                      <div className="text-slate-500 uppercase mb-0.5">validationMode</div>
                      <span className="px-1.5 py-0.5 rounded border text-[7px] font-bold uppercase border-primary/30 bg-primary/5 text-primary">
                        {rec.validationMode || '—'}
                      </span>
                    </div>
                    <div className="px-2.5 py-1.5 bg-secondary/30 border border-border/30 rounded-sm">
                      <div className="text-slate-500 uppercase mb-0.5">execution / dispatch</div>
                      <div className="text-primary font-bold text-[7px]">allowed=false · NOT_EXECUTED · NOT_DISPATCHED</div>
                    </div>
                  </div>

                  {/* Review controls or existing decision */}
                  {alreadyReviewed ? (
                    <div className="flex items-center gap-2 px-3 py-2 bg-secondary/20 border border-border/30 rounded-sm">
                      <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />
                      <span className="text-[9px] text-slate-300">
                        Decision recorded: <span className={`font-bold px-1.5 py-0.5 rounded border text-[7px] uppercase ${DECISION_STYLES[existingReview?.decision] || 'text-slate-400'}`}>
                          {existingReview?.decision}
                        </span>
                        {existingReview?.reviewerName && (
                          <span className="text-slate-500 ml-2">by {existingReview.reviewerName}</span>
                        )}
                      </span>
                    </div>
                  ) : (
                    <div className="space-y-2 p-3 bg-rose-500/3 border border-rose-500/15 rounded-sm">
                      <div className="text-[9px] font-bold uppercase text-rose-400 mb-2">Review Controls</div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                        {/* Decision select */}
                        <div className="space-y-1">
                          <label className="text-[8px] uppercase text-slate-500 font-bold">Decision</label>
                          <select
                            value={form.decision}
                            onChange={e => setForm(rec.validatorRecordId, { decision: e.target.value })}
                            className="w-full px-2 py-1.5 bg-secondary/50 border border-border/50 rounded-sm text-[9px] text-slate-200 font-mono focus:border-primary/50 focus:outline-none"
                          >
                            {DECISIONS.map(d => (
                              <option key={d} value={d}>{d}</option>
                            ))}
                          </select>
                        </div>
                        {/* Reviewer name */}
                        <div className="space-y-1">
                          <label className="text-[8px] uppercase text-slate-500 font-bold">Reviewer Name</label>
                          <input
                            type="text"
                            value={form.reviewerName}
                            onChange={e => setForm(rec.validatorRecordId, { reviewerName: e.target.value })}
                            placeholder="Operator identifier"
                            className="w-full px-2 py-1.5 bg-secondary/50 border border-border/50 rounded-sm text-[9px] text-slate-200 placeholder-slate-600 focus:border-primary/50 focus:outline-none"
                          />
                        </div>
                        {/* Review note */}
                        <div className="space-y-1">
                          <label className="text-[8px] uppercase text-slate-500 font-bold">Review Note</label>
                          <input
                            type="text"
                            value={form.reviewNote}
                            onChange={e => setForm(rec.validatorRecordId, { reviewNote: e.target.value })}
                            placeholder="Optional note"
                            className="w-full px-2 py-1.5 bg-secondary/50 border border-border/50 rounded-sm text-[9px] text-slate-200 placeholder-slate-600 focus:border-primary/50 focus:outline-none"
                          />
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleSaveDecision(rec)}
                        className="mt-1 px-4 py-1.5 bg-rose-500/10 border border-rose-500/30 text-rose-400 hover:bg-rose-500/20 transition-colors rounded-sm text-[9px] font-bold uppercase"
                      >
                        Save Validator Review Decision
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Decision History Table ── */}
      <div className="bg-card border border-border/50 rounded-sm overflow-hidden">
        <div className="px-4 py-2.5 bg-secondary/30 border-b border-border/40 flex items-center justify-between">
          <div>
            <div className="text-[10px] font-bold uppercase text-slate-200">Decision History</div>
            <div className="text-[8px] text-slate-500 mt-0.5">
              Stored in: <span className="text-blue-400">{REVIEW_KEY}</span>
            </div>
          </div>
          <span className="text-[8px] px-2 py-0.5 border border-border/40 bg-secondary/40 text-slate-400 rounded font-bold uppercase">
            {reviewDecisions.length} / {MAX_RECORDS} max
          </span>
        </div>

        {reviewDecisions.length === 0 ? (
          <div className="px-4 py-5 text-center">
            <p className="text-[9px] text-slate-500">No review decisions saved yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[8px]">
              <thead>
                <tr className="border-b border-border/40 bg-secondary/20">
                  {['reviewedAt','reviewId','sourceValidatorRecordId','sourceProposalId','commandType','decision','reviewerName','executionAllowed','dispatchAllowed'].map(h => (
                    <th key={h} className="px-3 py-2 text-left font-bold uppercase tracking-wider text-slate-500 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/20">
                {reviewDecisions.map((rev, i) => (
                  <tr key={rev.reviewId || i} className="hover:bg-secondary/10">
                    <td className="px-3 py-2 text-slate-400 whitespace-nowrap">
                      {rev.reviewedAt ? new Date(rev.reviewedAt).toLocaleString() : '—'}
                    </td>
                    <td className="px-3 py-2 text-rose-400 font-mono max-w-[110px] truncate" title={rev.reviewId}>
                      {rev.reviewId || '—'}
                    </td>
                    <td className="px-3 py-2 text-violet-400 font-mono max-w-[110px] truncate" title={rev.sourceValidatorRecordId}>
                      {rev.sourceValidatorRecordId || '—'}
                    </td>
                    <td className="px-3 py-2 text-slate-300 font-mono max-w-[100px] truncate" title={rev.sourceProposalId}>
                      {rev.sourceProposalId || '—'}
                    </td>
                    <td className="px-3 py-2 text-slate-200 whitespace-nowrap">{rev.commandType || '—'}</td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <span className={`px-1.5 py-0.5 rounded border text-[7px] font-bold uppercase ${DECISION_STYLES[rev.decision] || 'border-slate-500/30 bg-slate-500/5 text-slate-400'}`}>
                        {rev.decision || '—'}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-slate-300 whitespace-nowrap">{rev.reviewerName || '—'}</td>
                    <td className="px-3 py-2 whitespace-nowrap"><span className="text-primary font-bold">false ✓</span></td>
                    <td className="px-3 py-2 whitespace-nowrap"><span className="text-primary font-bold">false ✓</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Export ── */}
      <div className="bg-primary/5 border border-primary/20 rounded-sm overflow-hidden">
        <div className="px-4 py-3 bg-primary/10 border-b border-primary/20 flex items-center justify-center">
          <button
            type="button"
            onClick={handleExport}
            disabled={reviewDecisions.length === 0}
            className="flex items-center gap-2 px-6 py-2.5 bg-primary/10 border border-primary/40 text-primary hover:bg-primary/20 transition-colors rounded-sm font-bold text-[11px] uppercase disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Download className="w-4 h-4" />
            Export Validator Review Decisions
          </button>
        </div>
        <div className="px-4 py-2 bg-secondary/20 border-t border-border/40 text-[8px] font-mono text-muted-foreground/60 text-center italic">
          snapshotType: VERIDAN_VALIDATOR_REVIEW_DECISIONS_PHASE_47 · Browser-local JSON export only · No backend writes
        </div>
      </div>

      {/* Safety Claims Footer */}
      <div className="px-3 py-2.5 bg-primary/5 border border-primary/15 rounded-sm">
        <div className="text-[8px] font-bold uppercase text-primary/70 mb-1.5">Phase 47 Safety Claims</div>
        <div className="flex flex-wrap gap-1">
          {SAFETY_CLAIMS.map(claim => (
            <span key={claim} className="px-1.5 py-0.5 bg-primary/5 border border-primary/15 rounded text-[7px] text-primary/70 font-mono">
              {claim}
            </span>
          ))}
        </div>
      </div>

    </div>
  );
}