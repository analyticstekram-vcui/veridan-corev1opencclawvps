/**
 * OpenClawApprovedReviewDryRunResultPackageBuilder — Phase 48
 * Builds dry-run result packages from approved Phase 47 validator review decisions.
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
import { Download, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';

const REVIEW_KEY = 'openclawPhase47ValidatorReviewDecisions';
const PACKAGE_KEY = 'openclawPhase48DryRunResultPackages';
const MAX_RECORDS = 50;

const SAFETY_CLAIMS = [
  'Created from approved Phase 47 review decision',
  'Dry-run result package only',
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
  'Dry-run result packages only',
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

function isEligible(review) {
  return (
    review.decision === 'APPROVED_FOR_DRY_RUN_REVIEW' &&
    review.executionAllowed === false &&
    review.executionStatus === 'NOT_EXECUTED' &&
    review.dispatchAllowed === false &&
    review.dispatchStatus === 'NOT_DISPATCHED' &&
    !!review.sourceValidatorRecordId &&
    !!review.sourceProposalId &&
    !!review.commandType
  );
}

export default function OpenClawApprovedReviewDryRunResultPackageBuilder() {
  const [reviewDecisions, setReviewDecisions] = useState([]);
  const [resultPackages, setResultPackages] = useState([]);
  const [builtIds, setBuiltIds] = useState(new Set());
  const [lastAction, setLastAction] = useState(null);

  useEffect(() => {
    setReviewDecisions(loadFromStorage(REVIEW_KEY, []));
    setResultPackages(loadFromStorage(PACKAGE_KEY, []));
  }, []);

  useEffect(() => {
    const ids = new Set(resultPackages.map(p => p.sourceReviewId).filter(Boolean));
    setBuiltIds(ids);
  }, [resultPackages]);

  const handleBuildPackage = (review) => {
    const newPackage = {
      resultPackageId: generateId('phase48-pkg'),
      createdAt: new Date().toISOString(),
      sourcePhase: 'PHASE_47_VALIDATOR_REVIEW_DECISION',
      sourceReviewId: review.reviewId,
      sourceValidatorRecordId: review.sourceValidatorRecordId,
      sourceProposalId: review.sourceProposalId,
      commandType: review.commandType,
      reviewerName: review.reviewerName || '',
      reviewDecision: review.decision,
      packageStatus: 'DRY_RUN_RESULT_PACKAGE_CREATED',
      resultMode: 'DRY_RUN_ONLY',
      executionAllowed: false,
      executionStatus: 'NOT_EXECUTED',
      dispatchAllowed: false,
      dispatchStatus: 'NOT_DISPATCHED',
      packageSummary: [
        'Approved validator review converted into dry-run result package.',
        'No command executed.',
        'No dispatch occurred.',
      ],
      safetyClaims: SAFETY_CLAIMS,
    };

    const updated = [newPackage, ...resultPackages].slice(0, MAX_RECORDS);
    saveToStorage(PACKAGE_KEY, updated);
    setResultPackages(updated);
    setBuiltIds(prev => new Set([...prev, review.reviewId]));
    setLastAction(`Result package built for review ${review.reviewId}`);
  };

  const handleExport = () => {
    const snapshot = {
      snapshotType: 'VERIDAN_DRY_RUN_RESULT_PACKAGES_PHASE_48',
      generatedAt: new Date().toISOString(),
      resultPackages,
      recordCount: resultPackages.length,
      safetyClaims: EXPORT_SAFETY_CLAIMS,
    };
    const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `phase48-dry-run-result-packages-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const eligibleCount = reviewDecisions.filter(isEligible).length;

  return (
    <div className="space-y-5 font-mono">

      {/* Header */}
      <div className="px-4 py-3 bg-emerald-500/5 border border-emerald-500/20 rounded-sm">
        <div className="text-[11px] font-bold uppercase tracking-wide text-emerald-400 mb-1">
          Phase 48 · Approved Review → Dry-Run Result Package Builder
        </div>
        <p className="text-[9px] text-slate-400 leading-relaxed">
          Only approved Phase 47 review decisions can generate dry-run result packages.
          Browser-only · localStorage-only · no execution · no dispatch.
        </p>
      </div>

      {/* Safety Banner */}
      <div className="flex items-start gap-2 px-3 py-2.5 bg-amber-500/5 border border-amber-500/20 rounded-sm">
        <AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
        <p className="text-[9px] text-amber-500/90">
          <span className="font-bold">EXECUTION LOCKED</span> — All result packages are created with
          executionAllowed=false, executionStatus=NOT_EXECUTED, dispatchAllowed=false, dispatchStatus=NOT_DISPATCHED.
        </p>
      </div>

      {/* Last Action Feedback */}
      {lastAction && (
        <div className="flex items-center gap-2 px-3 py-2 bg-emerald-500/5 border border-emerald-500/20 rounded-sm">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span className="text-[9px] text-emerald-400">{lastAction}</span>
        </div>
      )}

      {/* ── Phase 47 Review Decisions Table ── */}
      <div className="bg-card border border-border/50 rounded-sm overflow-hidden">
        <div className="px-4 py-2.5 bg-secondary/30 border-b border-border/40 flex items-center justify-between">
          <div>
            <div className="text-[10px] font-bold uppercase text-slate-200">Phase 47 Review Decisions</div>
            <div className="text-[8px] text-slate-500 mt-0.5">
              Read from: <span className="text-blue-400">{REVIEW_KEY}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[8px] px-2 py-0.5 border border-emerald-500/30 bg-emerald-500/5 text-emerald-400 rounded font-bold uppercase">
              {eligibleCount} eligible
            </span>
            <span className="text-[8px] px-2 py-0.5 border border-border/40 bg-secondary/40 text-slate-400 rounded font-bold uppercase">
              {reviewDecisions.length} total
            </span>
          </div>
        </div>

        {reviewDecisions.length === 0 ? (
          <div className="px-4 py-6 text-center">
            <p className="text-[10px] text-slate-400">
              No Phase 47 validator review decisions found. Review validator records before building dry-run result packages.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[8px]">
              <thead>
                <tr className="border-b border-border/40 bg-secondary/20">
                  {['reviewedAt','reviewId','sourceValidatorRecordId','sourceProposalId','commandType','decision','reviewerName','executionAllowed','dispatchAllowed','action'].map(h => (
                    <th key={h} className="px-3 py-2 text-left font-bold uppercase tracking-wider text-slate-500 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/20">
                {reviewDecisions.map((rev, i) => {
                  const eligible = isEligible(rev);
                  const alreadyBuilt = builtIds.has(rev.reviewId);
                  return (
                    <tr key={rev.reviewId || i} className={eligible ? 'hover:bg-secondary/10' : 'opacity-50'}>
                      <td className="px-3 py-2 text-slate-400 whitespace-nowrap">
                        {rev.reviewedAt ? new Date(rev.reviewedAt).toLocaleString() : '—'}
                      </td>
                      <td className="px-3 py-2 text-rose-400 font-mono max-w-[100px] truncate" title={rev.reviewId}>
                        {rev.reviewId || '—'}
                      </td>
                      <td className="px-3 py-2 text-violet-400 font-mono max-w-[100px] truncate" title={rev.sourceValidatorRecordId}>
                        {rev.sourceValidatorRecordId || '—'}
                      </td>
                      <td className="px-3 py-2 text-slate-300 font-mono max-w-[90px] truncate" title={rev.sourceProposalId}>
                        {rev.sourceProposalId || '—'}
                      </td>
                      <td className="px-3 py-2 text-slate-200 whitespace-nowrap">{rev.commandType || '—'}</td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <span className={`px-1.5 py-0.5 rounded border text-[7px] font-bold uppercase ${
                          rev.decision === 'APPROVED_FOR_DRY_RUN_REVIEW'
                            ? 'border-primary/30 bg-primary/5 text-primary'
                            : rev.decision === 'REJECTED'
                            ? 'border-destructive/30 bg-destructive/5 text-destructive'
                            : 'border-amber-500/30 bg-amber-500/5 text-amber-400'
                        }`}>
                          {rev.decision || '—'}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-slate-300 whitespace-nowrap">{rev.reviewerName || '—'}</td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <span className="text-primary font-bold">false ✓</span>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <span className="text-primary font-bold">false ✓</span>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        {alreadyBuilt ? (
                          <span className="flex items-center gap-1 text-[7px] text-primary font-bold">
                            <CheckCircle2 className="w-3 h-3" /> Built
                          </span>
                        ) : eligible ? (
                          <button
                            type="button"
                            onClick={() => handleBuildPackage(rev)}
                            className="px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 transition-colors rounded-sm text-[7px] font-bold uppercase whitespace-nowrap"
                          >
                            Build Dry-Run Result Package
                          </button>
                        ) : (
                          <span className="flex items-center gap-1 text-[7px] text-slate-500">
                            <XCircle className="w-3 h-3" /> Not Eligible
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Eligibility Rules Reference ── */}
      <div className="bg-card border border-border/50 rounded-sm overflow-hidden">
        <div className="px-4 py-2.5 bg-secondary/30 border-b border-border/40">
          <div className="text-[10px] font-bold uppercase text-slate-200">Eligibility Rules</div>
        </div>
        <div className="p-3 grid grid-cols-1 md:grid-cols-2 gap-1.5">
          {[
            'decision === "APPROVED_FOR_DRY_RUN_REVIEW"',
            'executionAllowed === false',
            'executionStatus === "NOT_EXECUTED"',
            'dispatchAllowed === false',
            'dispatchStatus === "NOT_DISPATCHED"',
            'sourceValidatorRecordId must exist',
            'sourceProposalId must exist',
            'commandType must exist',
          ].map(rule => (
            <div key={rule} className="flex items-center gap-2 px-2.5 py-1.5 bg-secondary/30 border border-border/30 rounded-sm">
              <CheckCircle2 className="w-3 h-3 text-primary shrink-0" />
              <span className="text-[8px] text-slate-300 font-mono">{rule}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Result Packages History ── */}
      <div className="bg-card border border-border/50 rounded-sm overflow-hidden">
        <div className="px-4 py-2.5 bg-secondary/30 border-b border-border/40 flex items-center justify-between">
          <div>
            <div className="text-[10px] font-bold uppercase text-slate-200">Result Packages</div>
            <div className="text-[8px] text-slate-500 mt-0.5">
              Stored in: <span className="text-blue-400">{PACKAGE_KEY}</span>
            </div>
          </div>
          <span className="text-[8px] px-2 py-0.5 border border-border/40 bg-secondary/40 text-slate-400 rounded font-bold uppercase">
            {resultPackages.length} / {MAX_RECORDS} max
          </span>
        </div>

        {resultPackages.length === 0 ? (
          <div className="px-4 py-5 text-center">
            <p className="text-[9px] text-slate-500">No result packages built yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[8px]">
              <thead>
                <tr className="border-b border-border/40 bg-secondary/20">
                  {['createdAt','resultPackageId','sourceReviewId','sourceValidatorRecordId','sourceProposalId','commandType','packageStatus','resultMode','executionAllowed','dispatchAllowed'].map(h => (
                    <th key={h} className="px-3 py-2 text-left font-bold uppercase tracking-wider text-slate-500 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/20">
                {resultPackages.map((pkg, i) => (
                  <tr key={pkg.resultPackageId || i} className="hover:bg-secondary/10">
                    <td className="px-3 py-2 text-slate-400 whitespace-nowrap">
                      {pkg.createdAt ? new Date(pkg.createdAt).toLocaleString() : '—'}
                    </td>
                    <td className="px-3 py-2 text-emerald-400 font-mono max-w-[110px] truncate" title={pkg.resultPackageId}>
                      {pkg.resultPackageId || '—'}
                    </td>
                    <td className="px-3 py-2 text-rose-400 font-mono max-w-[100px] truncate" title={pkg.sourceReviewId}>
                      {pkg.sourceReviewId || '—'}
                    </td>
                    <td className="px-3 py-2 text-violet-400 font-mono max-w-[100px] truncate" title={pkg.sourceValidatorRecordId}>
                      {pkg.sourceValidatorRecordId || '—'}
                    </td>
                    <td className="px-3 py-2 text-slate-300 font-mono max-w-[90px] truncate" title={pkg.sourceProposalId}>
                      {pkg.sourceProposalId || '—'}
                    </td>
                    <td className="px-3 py-2 text-slate-200 whitespace-nowrap">{pkg.commandType || '—'}</td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <span className="px-1.5 py-0.5 rounded border text-[7px] font-bold uppercase border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
                        {pkg.packageStatus || '—'}
                      </span>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <span className="px-1.5 py-0.5 rounded border text-[7px] font-bold uppercase border-primary/30 bg-primary/5 text-primary">
                        {pkg.resultMode || '—'}
                      </span>
                    </td>
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
            disabled={resultPackages.length === 0}
            className="flex items-center gap-2 px-6 py-2.5 bg-primary/10 border border-primary/40 text-primary hover:bg-primary/20 transition-colors rounded-sm font-bold text-[11px] uppercase disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Download className="w-4 h-4" />
            Export Dry-Run Result Packages
          </button>
        </div>
        <div className="px-4 py-2 bg-secondary/20 border-t border-border/40 text-[8px] font-mono text-muted-foreground/60 text-center italic">
          snapshotType: VERIDAN_DRY_RUN_RESULT_PACKAGES_PHASE_48 · Browser-local JSON export only · No backend writes
        </div>
      </div>

      {/* Safety Claims Footer */}
      <div className="px-3 py-2.5 bg-primary/5 border border-primary/15 rounded-sm">
        <div className="text-[8px] font-bold uppercase text-primary/70 mb-1.5">Phase 48 Safety Claims</div>
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