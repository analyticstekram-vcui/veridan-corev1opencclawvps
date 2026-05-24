import React from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';
import { REVIEW_REQUIREMENTS, evaluateReviewRequirements } from './controlledWakeReviewContracts';

export default function ControlledWakeEvidencePanel({ record }) {
  const { checks, allPass } = evaluateReviewRequirements(record);
  const passCount = Object.values(checks).filter(Boolean).length;

  if (!record) {
    return (
      <div className="border border-border/40 bg-card rounded-sm p-4 text-[8px] text-slate-500 italic font-mono">
        No readiness evidence loaded. Generate a readiness record from the Wake Activation Readiness Gate first.
      </div>
    );
  }

  const fields = [
    { k: 'evidenceId',        v: record.evidenceId },
    { k: 'auditHash',         v: record.auditHash },
    { k: 'dryRunDecision',    v: record.form?.dryRunDecision },
    { k: 'wakeStatus',        v: record.form?.localWakeTestStatus },
    { k: 'localWakeHttp',     v: record.form?.localWakeHttpStatus || '—' },
    { k: 'approval',          v: record.form?.operatorApprovalState },
    { k: 'checksPassCount',   v: record.allPass ? '16 / 16' : `${Object.values(record.validationResults || {}).filter(Boolean).length} / 16` },
    { k: 'decision',          v: record.decision },
    { k: 'activationStatus',  v: record.activationStatus },
    { k: 'networkRequest',    v: record.networkRequest },
    { k: 'createdAt',         v: record.createdAt },
  ];

  const safeColor = (k, v) => {
    if (['activationStatus', 'networkRequest'].includes(k)) return 'text-destructive font-bold';
    if (k === 'decision' && v === 'READY_FOR_CONTROLLED_WAKE_ACTIVATION_REVIEW') return 'text-primary font-bold';
    if (k === 'dryRunDecision' && v === 'SERVER_DRY_RUN_VALIDATED') return 'text-primary';
    if (k === 'wakeStatus' && v === 'HTTP_200_CONFIRMED') return 'text-primary';
    if (k === 'checksPassCount' && v === '16 / 16') return 'text-primary font-bold';
    return 'text-slate-200';
  };

  return (
    <div className="space-y-3">
      {/* Evidence fields */}
      <div className="border border-border/40 bg-card rounded-sm overflow-hidden">
        <div className="px-4 py-2.5 border-b border-border/30 text-[8px] font-bold uppercase text-slate-400">
          Source Readiness Evidence Record
        </div>
        <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-2">
          {fields.map(({ k, v }) => (
            <div key={k} className="bg-secondary/20 border border-border/30 rounded-sm px-2.5 py-1.5">
              <div className="text-[6px] uppercase text-slate-500 mb-0.5">{k}</div>
              <div className={`font-mono text-[8px] break-all ${safeColor(k, v)}`}>{v ?? '—'}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Review requirements checklist */}
      <div className="border border-border/40 bg-card rounded-sm overflow-hidden">
        <div className="px-4 py-2.5 border-b border-border/30 flex items-center justify-between">
          <div className="text-[8px] font-bold uppercase text-slate-400">
            Review Requirements ({passCount} / {REVIEW_REQUIREMENTS.length})
          </div>
          <span className={`px-2 py-0.5 text-[7px] font-bold border rounded-sm ${
            allPass
              ? 'text-primary border-primary/30 bg-primary/10'
              : 'text-destructive border-destructive/30 bg-destructive/10'
          }`}>
            {allPass ? 'ALL PASS' : `${REVIEW_REQUIREMENTS.length - passCount} FAILING`}
          </span>
        </div>
        <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-1">
          {REVIEW_REQUIREMENTS.map(c => {
            const pass = checks[c.key];
            return (
              <div key={c.key} className="flex items-center gap-1.5 text-[8px] font-mono">
                {pass
                  ? <CheckCircle2 className="w-3 h-3 text-primary shrink-0" />
                  : <XCircle className="w-3 h-3 text-destructive shrink-0" />}
                <span className={pass ? 'text-slate-300' : 'text-destructive'}>{c.label}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}