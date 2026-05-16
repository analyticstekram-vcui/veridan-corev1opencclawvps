/**
 * RegenerateEvidenceChainButton
 * Local-only button to regenerate all downstream evidence components.
 * No network calls, no OpenClaw calls, no execution.
 */
import React, { useState } from 'react';
import { RefreshCw, CheckCircle2 } from 'lucide-react';

function regenerateEvidenceChain() {
  const componentIds = [
    'historical-status',
    'manual-monitoring-console',
    'evidence-export',
    'audit-dashboard',
    'promotion-gate',
    'operator-runbook',
    'final-acceptance',
    'control-room-summary',
  ];

  const refreshTrigger = Date.now();

  // Trigger refresh on each component via dispatch or direct state update
  componentIds.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      // Dispatch custom event for components listening to refresh triggers
      el.dispatchEvent(new CustomEvent('regenerate', { detail: { timestamp: refreshTrigger } }));
    }
  });

  // Also emit a global event for listening components
  window.dispatchEvent(new CustomEvent('regenerateEvidenceChain', { detail: { timestamp: refreshTrigger } }));
}

export default function RegenerateEvidenceChainButton() {
  const [regenerating, setRegenerating] = useState(false);
  const [regenerated, setRegenerated] = useState(false);

  const handleRegenerate = () => {
    setRegenerating(true);
    setRegenerated(false);

    setTimeout(() => {
      regenerateEvidenceChain();
      setRegenerating(false);
      setRegenerated(true);
      setTimeout(() => setRegenerated(false), 3000);
    }, 500);
  };

  return (
    <button type="button" onClick={handleRegenerate} disabled={regenerating}
      className="flex items-center gap-1.5 px-3 py-2 text-[9px] border border-primary/40 text-primary bg-primary/10 hover:bg-primary/20 disabled:opacity-50 rounded font-bold transition-colors">
      {regenerated ? (
        <>
          <CheckCircle2 className="w-3.5 h-3.5" /> Chain Regenerated
        </>
      ) : (
        <>
          <RefreshCw className={`w-3.5 h-3.5 ${regenerating ? 'animate-spin' : ''}`} />
          {regenerating ? 'Regenerating…' : 'Regenerate Full Manual Monitoring Evidence Chain'}
        </>
      )}
    </button>
  );
}