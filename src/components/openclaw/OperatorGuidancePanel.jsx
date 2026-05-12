import React from 'react';
import { AlertCircle, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';

/**
 * Operator-facing guidance showing:
 * - ✓ What's already fixed / verified
 * - ⚠️ Warnings requiring review
 * - 📋 External production prerequisites
 * Displayed in System Verify tab for clarity.
 */
export default function OperatorGuidancePanel({ verificationResults, backendStatus }) {
  const categories = {
    fixed: {
      icon: CheckCircle2,
      color: 'text-primary border-primary/20 bg-primary/5',
      iconColor: 'text-primary',
      title: 'Already Fixed / Verified',
      description: 'These items passed verification and require no action right now.',
    },
    warnings: {
      icon: AlertTriangle,
      color: 'text-amber-500 border-amber-500/20 bg-amber-500/5',
      iconColor: 'text-amber-500',
      title: 'Warnings – Review Before Production',
      description: 'These items need review but are not production-blocking.',
    },
    external: {
      icon: AlertCircle,
      color: 'text-blue-400 border-blue-400/20 bg-blue-400/5',
      iconColor: 'text-blue-400',
      title: 'External Production Prerequisites',
      description: 'These require external work, deployment, or governance approval outside this app.',
    },
  };

  // Categorize results
  const fixed = [];
  const warnings = [];
  const external = [];

  if (verificationResults) {
    Object.entries(verificationResults).forEach(([checkId, result]) => {
      if (result?.status === 'pass') {
        fixed.push({ id: checkId, name: result.explanation || checkId });
      } else if (result?.status === 'warn') {
        warnings.push({ id: checkId, name: result.explanation || checkId });
      } else if (result?.status === 'fail' && result?.suggestedFix?.includes('Requires')) {
        external.push({ id: checkId, name: result.explanation || checkId, fix: result.suggestedFix });
      }
    });
  }

  // Backend enforcement
  const backendTestsFail = backendStatus && !backendStatus.passed;
  const backendNextAction = backendTestsFail
    ? 'Review backend enforcement test failures in openclawEnforcement function logs.'
    : 'Backend enforcement tests are passing. All validation gates active.';

  const Section = ({ category, items }) => {
    const cfg = categories[category];
    const Icon = cfg.icon;
    if (items.length === 0) return null;

    return (
      <div className={`border rounded-lg p-4 ${cfg.color}`}>
        <div className="flex items-start gap-3 mb-3">
          <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${cfg.iconColor}`} />
          <div>
            <div className={`text-[11px] font-semibold mb-0.5 ${cfg.iconColor}`}>{cfg.title}</div>
            <div className={`text-[9px] ${cfg.iconColor}/80`}>{cfg.description}</div>
          </div>
        </div>
        <div className="space-y-2 ml-8">
          {items.map((item) => (
            <div key={item.id} className="text-[10px] text-foreground/90">
              <div className="flex items-start gap-2">
                <span className="shrink-0 mt-0.5">•</span>
                <div className="flex-1">
                  <div className="font-mono text-[9px]">{item.id}</div>
                  <div className="text-[9px] text-slate-400 mt-0.5">{item.name}</div>
                  {item.fix && (
                    <div className="flex items-start gap-2 mt-1 p-2 bg-card/50 rounded border border-border/50">
                      <ArrowRight className="w-3 h-3 shrink-0 mt-0.5 text-amber-500" />
                      <div className="text-[8px] text-amber-500/80">{item.fix}</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <AlertCircle className="w-5 h-5 text-blue-400" />
        <div>
          <div className="text-[11px] font-semibold text-foreground">Operator Guidance</div>
          <div className="text-[9px] text-slate-400">Plain-language status and next actions</div>
        </div>
      </div>

      {/* Backend Enforcement Status */}
      <div className={`border rounded-lg p-4 ${backendTestsFail ? 'border-destructive/20 bg-destructive/5' : 'border-primary/20 bg-primary/5'}`}>
        <div className="flex items-start gap-3">
          {backendTestsFail ? (
            <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
          ) : (
            <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
          )}
          <div className="flex-1">
            <div className={`text-[11px] font-semibold mb-0.5 ${backendTestsFail ? 'text-destructive' : 'text-primary'}`}>
              {backendTestsFail ? '⚠️ Backend Enforcement Tests Failed' : '✓ Backend Enforcement Tests Passing'}
            </div>
            <div className={`text-[9px] mb-2 ${backendTestsFail ? 'text-destructive/80' : 'text-primary/80'}`}>
              {backendTestsFail
                ? 'Backend validation is critical. Backend enforcement module must pass all tests before production readiness is declared.'
                : 'All backend validation gates are active. Live execution is blocked, RBAC is enforced, secrets are protected, and audit logging is enabled.'}
            </div>
            <div className="flex items-start gap-2 p-2 bg-card/50 rounded border border-border/50">
              <ArrowRight className={`w-3 h-3 shrink-0 mt-0.5 ${backendTestsFail ? 'text-destructive' : 'text-primary'}`} />
              <div className={`text-[9px] ${backendTestsFail ? 'text-destructive/80' : 'text-primary/80'}`}>{backendNextAction}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Categorized results */}
      <Section category="fixed" items={fixed} />
      <Section category="warnings" items={warnings} />
      <Section category="external" items={external} />

      {/* Summary guidance */}
      <div className="bg-secondary/10 border border-border/50 rounded-lg p-4">
        <div className="text-[10px] space-y-2 text-slate-300">
          <div className="font-semibold text-foreground">What happens now?</div>
          <ul className="space-y-1 text-[9px] ml-4 list-disc">
            <li>
              <span className="font-semibold text-primary">Green items (✓)</span>: Working correctly. No action required.
            </li>
            <li>
              <span className="font-semibold text-amber-500">Yellow items (⚠️)</span>: Review each one. If they look OK, proceed. If not, fix before claiming production readiness.
            </li>
            <li>
              <span className="font-semibold text-blue-400">Blue items (📋)</span>: External work needed — deployment, governance board approval, broker integrations, or infrastructure changes. Plan these separately.
            </li>
            <li>
              <span className="font-semibold text-destructive">Backend enforcement (🔴)</span>: Must pass. If it fails, check backend function logs immediately.
            </li>
          </ul>
        </div>
      </div>

      {/* Next steps */}
      <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
        <div className="text-[10px] space-y-1.5 text-primary/90">
          <div className="font-semibold text-primary">Next Steps</div>
          <div className="text-[9px]">
            <ol className="space-y-1 ml-4 list-decimal">
              <li>Review all yellow items above. Verify they look acceptable to you.</li>
              <li>Check the blue items — these need work outside the app. Plan them with your team.</li>
              <li>If backend enforcement shows red, open the openclawEnforcement backend function and check the test logs.</li>
              <li>Once all green and blue prerequisites are met, Production Checklist will unlock PRODUCTION_READY status.</li>
            </ol>
          </div>
        </div>
      </div>

      {/* Key safety constraints reminder */}
      <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-4">
        <div className="text-[10px] space-y-1.5 text-destructive/90">
          <div className="font-semibold text-destructive">Safety Constraints (Always Enforced)</div>
          <div className="text-[9px] space-y-1 ml-4 list-disc">
            <ul className="space-y-1">
              <li>Live execution is disabled globally. No role can enable it.</li>
              <li>All operations run in SIMULATED mode. No real trades, transfers, or commands.</li>
              <li>Secrets are never displayed in the UI. Metadata-only registry only.</li>
              <li>Audit logging tracks all approvals and denials at the backend level.</li>
              <li>RBAC prevents unauthorized access. All checks enforced server-side.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}