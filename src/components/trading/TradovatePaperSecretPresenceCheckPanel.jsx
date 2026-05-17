/**
 * TradovatePaperSecretPresenceCheckPanel
 * Read-only backend secret presence check for Tradovate paper env vars.
 * Returns only presence/absence, never secret values.
 *
 * Does NOT:
 *   - Return secret values
 *   - Connect to Tradovate
 *   - Accept credential inputs
 *   - Attempt broker operations
 *   - Call APIs directly
 *   - Write localStorage
 *   - Use timers
 */
import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { CheckCircle2, AlertCircle, Lock, Loader2 } from 'lucide-react';

function KeyRow({ keyName, present }) {
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 border-b border-border/20 last:border-0">
      {present
        ? <CheckCircle2 className="w-3 h-3 text-primary shrink-0" />
        : <AlertCircle className="w-3 h-3 text-destructive shrink-0" />}
      <span className="flex-1 text-[9px] font-mono text-muted-foreground/70">{keyName}</span>
      <span className={`text-[8px] font-bold px-1.5 py-0.5 border rounded-sm ${present ? 'text-primary border-primary/30 bg-primary/5' : 'text-destructive border-destructive/30 bg-destructive/5'}`}>
        {present ? 'PRESENT' : 'MISSING'}
      </span>
    </div>
  );
}

function SafetyBoundaryRow({ label, value }) {
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 border-b border-border/20 last:border-0">
      {value
        ? <CheckCircle2 className="w-3 h-3 text-primary shrink-0" />
        : <AlertCircle className="w-3 h-3 text-destructive shrink-0" />}
      <span className="flex-1 text-[9px] font-mono text-muted-foreground/70">{label}</span>
      <span className={`text-[7px] font-bold px-1.5 py-0.5 border rounded-sm ${value ? 'text-primary border-primary/30 bg-primary/5' : 'text-destructive border-destructive/30 bg-destructive/5'}`}>
        {value ? 'TRUE' : 'FALSE'}
      </span>
    </div>
  );
}

export default function TradovatePaperSecretPresenceCheckPanel() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleRunCheck = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await base44.functions.invoke('tradovatePaperSecretPresenceCheck', {});
      setResult(response.data);
    } catch (err) {
      setError(err.message);
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col bg-background">
      {/* Header */}
      <div className="h-8 bg-card border-b border-border flex items-center px-3 gap-2 shrink-0">
        <Lock className="w-3.5 h-3.5 text-amber-500" />
        <span className="text-[11px] font-mono text-muted-foreground">SECRET PRESENCE CHECK</span>
        <span className="text-[9px] font-mono text-muted-foreground/40 ml-1">tradovate paper · backend-only</span>
      </div>

      <div className="p-3 space-y-3">
        {/* Run button */}
        <button
          onClick={handleRunCheck}
          disabled={loading}
          className="w-full px-3 py-2 bg-primary/10 border border-primary/30 text-primary text-[10px] font-mono hover:bg-primary/20 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
        >
          {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
          {loading ? 'Running check...' : 'Run Secret Presence Check'}
        </button>

        {/* Error state */}
        {error && (
          <div className="flex items-center gap-2 px-3 py-2 bg-destructive/5 border border-destructive/30 text-destructive text-[9px] font-mono">
            <AlertCircle className="w-3 h-3 shrink-0" />
            {error}
          </div>
        )}

        {/* Results */}
        {result && (
          <>
            {/* Readiness Status */}
            <div className={`flex items-center gap-3 px-4 py-3 border rounded-sm ${result.readinessStatus === 'READY_FOR_BACKEND_SECRET_POLICY_REVIEW' ? 'bg-primary/5 border-primary/30' : 'bg-amber-500/5 border-amber-500/30'}`}>
              <CheckCircle2 className={`w-4 h-4 shrink-0 ${result.readinessStatus === 'READY_FOR_BACKEND_SECRET_POLICY_REVIEW' ? 'text-primary' : 'text-amber-500'}`} />
              <div>
                <div className="text-[8px] font-mono text-muted-foreground/50 uppercase mb-0.5">Readiness Status</div>
                <div className={`text-[11px] font-mono font-bold ${result.readinessStatus === 'READY_FOR_BACKEND_SECRET_POLICY_REVIEW' ? 'text-primary' : 'text-amber-500'}`}>
                  {result.readinessStatus}
                </div>
              </div>
            </div>

            {/* Required Keys */}
            <div className="bg-card border border-border/50 rounded-sm overflow-hidden">
              <div className="px-3 py-1.5 bg-secondary/30 border-b border-border/40">
                <span className="text-[9px] font-mono font-bold uppercase text-slate-300">Required Environment Variables</span>
              </div>
              <div>
                {result.requiredKeys.map((key, i) => (
                  <KeyRow key={i} keyName={key.keyName} present={key.present} />
                ))}
              </div>
            </div>

            {/* Missing Keys */}
            {result.missingKeys.length > 0 && (
              <div className="bg-destructive/5 border border-destructive/30 rounded-sm overflow-hidden">
                <div className="px-3 py-1.5 bg-destructive/10 border-b border-destructive/20">
                  <span className="text-[9px] font-mono font-bold uppercase text-destructive">Missing Keys ({result.missingKeys.length})</span>
                </div>
                <div className="p-3 space-y-1">
                  {result.missingKeys.map((key, i) => (
                    <div key={i} className="text-[9px] font-mono text-destructive/70">
                      • {key}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Secret Values Returned */}
            <div className="flex items-center gap-2 px-3 py-1.5 border border-border/50 rounded-sm bg-card">
              <CheckCircle2 className="w-3 h-3 text-primary shrink-0" />
              <span className="flex-1 text-[9px] font-mono text-muted-foreground/70">Secret values returned</span>
              <span className={`text-[8px] font-bold px-1.5 py-0.5 border rounded-sm text-primary border-primary/30 bg-primary/5`}>
                {result.secretValuesReturned ? 'YES' : 'NO'}
              </span>
            </div>

            {/* Safety Boundary */}
            <div className="bg-card border border-border/50 rounded-sm overflow-hidden">
              <div className="px-3 py-1.5 bg-secondary/30 border-b border-border/40">
                <span className="text-[9px] font-mono font-bold uppercase text-slate-300">Safety Boundary</span>
              </div>
              <div>
                <SafetyBoundaryRow label="No secret values returned" value={result.safetyBoundary.noSecretValuesReturned} />
                <SafetyBoundaryRow label="No broker connection attempted" value={result.safetyBoundary.noBrokerConnectionAttempted} />
                <SafetyBoundaryRow label="No order routing attempted" value={result.safetyBoundary.noOrderRoutingAttempted} />
                <SafetyBoundaryRow label="No execution attempted" value={result.safetyBoundary.noExecutionAttempted} />
                <SafetyBoundaryRow label="No money movement attempted" value={result.safetyBoundary.noMoneyMovementAttempted} />
              </div>
            </div>

            {/* Checked At */}
            <div className="flex items-center gap-2 px-3 py-1.5 border border-border/50 rounded-sm bg-card/50 text-[9px] font-mono text-muted-foreground/60">
              <span>Checked: {new Date(result.checkedAt).toLocaleString()}</span>
            </div>

            {/* Raw Response Preview */}
            <div className="bg-card border border-border/50 rounded-sm overflow-hidden">
              <div className="px-3 py-1.5 bg-secondary/30 border-b border-border/40">
                <span className="text-[9px] font-mono font-bold uppercase text-slate-300">Raw Response</span>
              </div>
              <pre className="p-3 text-[7px] font-mono text-muted-foreground/70 overflow-auto max-h-40 whitespace-pre-wrap break-words">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          </>
        )}

        {/* Safety footer */}
        <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/5 border border-primary/15 rounded-sm text-[8px] font-mono text-primary/60">
          <Lock className="w-3 h-3 shrink-0" />
          READ_ONLY · Presence check only · No values · Backend-only
        </div>
      </div>
    </div>
  );
}