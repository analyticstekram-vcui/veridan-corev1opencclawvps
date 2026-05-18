/**
 * EinBankCreditReadiness — Planning-only EIN/bank/credit readiness placeholder.
 * localStorage only. No EIN submission. No bank API calls. No credit bureau calls. No credential storage.
 */

import React from 'react';
import { AlertTriangle } from 'lucide-react';

const SAFETY_CLAIMS = [
  'Planning only',
  'No EIN submission',
  'No bank account opening',
  'No credit bureau calls',
  'No payment processing',
  'No registered agent API calls',
  'No credential storage',
  'localStorage-only future section',
];

export default function EinBankCreditReadiness() {
  return (
    <div className="space-y-4 font-mono">
      <div>
        <div className="text-[11px] font-bold uppercase text-primary">EIN / Bank / Credit Readiness</div>
        <div className="text-[8px] text-slate-500 mt-0.5">Plan readiness steps · No EIN submission · No bank API calls · No credit bureau calls</div>
      </div>

      <div className="flex items-start gap-2 px-4 py-3 bg-destructive/5 border border-destructive/30 rounded-sm">
        <AlertTriangle className="w-3.5 h-3.5 text-destructive shrink-0 mt-0.5" />
        <div>
          <div className="text-[9px] font-bold text-destructive mb-0.5">Planning only. No EIN submission, bank account opening, or credit bureau calls occur from this system.</div>
          <div className="text-[8px] text-destructive/70">No EIN submission · No bank API calls · No credit bureau calls · No payment processing · No credential storage</div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-1.5">
        {[
          { label: 'EIN Submission',        value: 'DISABLED' },
          { label: 'Bank Account Opening',  value: 'DISABLED' },
          { label: 'Credit Bureau Calls',   value: 'DISABLED' },
          { label: 'Credential Storage',    value: 'DISABLED' },
        ].map(item => (
          <div key={item.label} className="flex items-center justify-between px-3 py-1.5 bg-secondary/20 border border-border/30 rounded-sm">
            <span className="text-[8px] text-slate-400">{item.label}:</span>
            <span className="text-[8px] font-bold font-mono text-destructive">{item.value}</span>
          </div>
        ))}
      </div>

      <div className="px-4 py-6 bg-card border border-border/40 rounded-sm text-center">
        <div className="text-[9px] font-bold text-slate-400 mb-1">EIN / Bank / Credit Readiness — Coming Soon</div>
        <div className="text-[8px] text-slate-600">
          Future: Track EIN readiness checklist, bank account requirement planning, and business credit readiness milestones — all localStorage-only, no submission logic.
        </div>
      </div>

      <div className="px-3 py-2.5 bg-primary/5 border border-primary/15 rounded-sm">
        <div className="text-[8px] font-bold uppercase text-primary/70 mb-1.5">Safety Claims</div>
        <div className="flex flex-wrap gap-1">
          {SAFETY_CLAIMS.map(c => (
            <span key={c} className="px-1.5 py-0.5 bg-primary/5 border border-primary/15 rounded text-[7px] text-primary/70 font-mono">{c}</span>
          ))}
        </div>
      </div>
    </div>
  );
}