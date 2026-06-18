/**
 * Phase4MonitoringLayer — Read-Only Monitoring Dashboard
 *
 * SAFETY: READ_ONLY · MONITORING_ONLY · NO_EXECUTION · NO_DISPATCH
 * No entity mutations. No governance activation. No broker/trading/banking.
 * No backend function calls. No automations. No scheduled jobs.
 */
import React from 'react';
import { Monitor, ShieldCheck, CheckCircle2 } from 'lucide-react';
import VaultFreshnessMonitor from './VaultFreshnessMonitor';
import GovernanceMonitor from './GovernanceMonitor';
import ExceptionMonitor from './ExceptionMonitor';
import OpenClawBoundaryMonitor from './OpenClawBoundaryMonitor';
import HealthScoreEngine from './HealthScoreEngine';

const SAFETY_CLAIMS = [
  'No execution functionality',
  'No workflow automation',
  'No database mutations',
  'No OpenClaw execution',
  'No governance activation',
  'No broker/trading/banking access',
  'No scheduled jobs or autonomous actions',
  'Read-only monitoring of mock adapter data only',
];

function Phase4SafetyVerification() {
  return (
    <div className="border border-primary/20 bg-primary/5 rounded-sm p-3 space-y-1.5">
      <div className="flex items-center gap-2">
        <ShieldCheck className="w-3 h-3 text-primary shrink-0" />
        <span className="text-[8px] font-bold uppercase tracking-widest text-primary">Phase 4 Safety Verification</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-0.5">
        {SAFETY_CLAIMS.map((claim, i) => (
          <div key={i} className="flex items-center gap-1.5 text-[7px] font-mono text-slate-400">
            <CheckCircle2 className="w-2.5 h-2.5 text-primary shrink-0" />
            {claim}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Phase4MonitoringLayer({ monitoring }) {
  return (
    <div className="space-y-4">
      {/* Section header */}
      <div className="flex items-center gap-2 pt-2">
        <Monitor className="w-4 h-4 text-accent" />
        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-300">Phase 4 · Monitoring Layer</span>
        <div className="flex gap-1.5 ml-2">
          {['READ_ONLY', 'MONITORING_ONLY', 'NO_EXECUTION'].map(badge => (
            <span key={badge} className={`px-1.5 py-0.5 text-[6px] font-bold uppercase border rounded-sm ${
              badge === 'READ_ONLY' || badge === 'MONITORING_ONLY'
                ? 'border-primary/30 bg-primary/10 text-primary'
                : 'border-destructive/30 bg-destructive/10 text-destructive'
            }`}>{badge}</span>
          ))}
        </div>
      </div>

      {/* Top row: Health + Freshness */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <HealthScoreEngine
          healthScore={monitoring.healthScore}
          breakdown={monitoring.healthBreakdown}
        />
        <VaultFreshnessMonitor monitoring={monitoring} />
        <ExceptionMonitor exceptions={monitoring.exceptionMonitor} />
      </div>

      {/* Bottom row: Governance + OpenClaw Boundary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <GovernanceMonitor gov={monitoring.governanceMonitor} />
        <OpenClawBoundaryMonitor oc={monitoring.openclawMonitor} />
      </div>

      {/* Safety verification */}
      <Phase4SafetyVerification />
    </div>
  );
}