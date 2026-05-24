import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { CheckCircle2, XCircle, Loader2, Heart, Eye, ExternalLink } from 'lucide-react';

/**
 * Phase5ANextStepCard
 * Read-only / preview-only next-step panel shown after Phase 5A lock.
 *
 * SAFETY BOUNDARY:
 * - No execution, dispatch, polling, scheduler, broker action
 * - No browser automation, credential use, file write
 * - No live OpenClaw command execution
 * - "Check OpenClaw Health" calls the existing read-only openclawHealthCheck function (GET-only)
 * - "Preview" buttons are local-only localStorage reads — no network calls
 * - "View Last Dry Run" reads localStorage only
 */

const LAST_EVIDENCE_KEY_PREFIX = 'phase5a_evidence_';

const readLastDryRun = () => {
  const keys = Object.keys(localStorage).filter(k => k.startsWith(LAST_EVIDENCE_KEY_PREFIX));
  if (keys.length === 0) return null;
  keys.sort().reverse();
  try { return JSON.parse(localStorage.getItem(keys[0])); } catch { return null; }
};

export default function Phase5ANextStepCard() {
  const [healthStatus, setHealthStatus] = useState(null); // null | 'loading' | {ok, message}
  const [lastDryRun, setLastDryRun] = useState(null);
  const [obsidianPreview, setObsidianPreview] = useState(null);
  const [browserPreview, setBrowserPreview] = useState(null);

  const handleCheckHealth = async () => {
    setHealthStatus('loading');
    try {
      const res = await base44.functions.invoke('openclawHealthCheck', {});
      const d = res.data || {};
      setHealthStatus({ ok: d.online ?? d.success ?? true, message: d.status || d.message || 'Health check complete' });
    } catch (err) {
      setHealthStatus({ ok: false, message: err.message || 'Health check failed' });
    }
  };

  const handleObsidianPreview = () => {
    setObsidianPreview({
      previewType: 'OBSIDIAN_TASK_PREVIEW',
      mode: 'DRY_RUN_ONLY',
      executionStatus: 'NOT_EXECUTED',
      sampleTask: { commandType: 'READ', targetSystem: 'obsidian-vault', requestedAction: 'Read vault index', riskTier: 'LOW' },
      note: 'Preview only — no VPS bridge call, no file write, no execution.',
    });
  };

  const handleBrowserPreview = () => {
    setBrowserPreview({
      previewType: 'BROWSER_TASK_PREVIEW',
      mode: 'DRY_RUN_ONLY',
      executionStatus: 'NOT_EXECUTED',
      sampleTask: { commandType: 'READ', targetUrl: 'https://openclaw.veridancore.com/status', requestedAction: 'Read page title', riskTier: 'LOW' },
      note: 'Preview only — no browser automation, no navigation, no execution.',
    });
  };

  const handleViewLastDryRun = () => {
    setLastDryRun(readLastDryRun());
  };

  return (
    <div className="mt-4 border border-primary/20 bg-primary/5 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-primary/20 bg-primary/10 flex items-center justify-between">
        <div>
          <div className="text-[10px] font-bold text-primary uppercase tracking-wide">Next: OpenClaw Read-Only Command Center</div>
          <div className="text-[8px] text-slate-400 mt-0.5">All actions below are read-only or preview-only. No execution.</div>
        </div>
        <Link
          to="/openclaw-readonly-command-center"
          className="flex items-center gap-1 text-[7px] font-mono text-primary border border-primary/30 hover:bg-primary/10 px-2 py-1 rounded transition-colors"
        >
          <ExternalLink className="w-2.5 h-2.5" />
          Open
        </Link>
      </div>

      <div className="p-4 space-y-3">
        {/* 4 action buttons */}
        <div className="grid grid-cols-2 gap-2">
          {/* Check OpenClaw Health */}
          <button
            type="button"
            onClick={handleCheckHealth}
            disabled={healthStatus === 'loading'}
            className="flex items-center justify-center gap-1.5 px-3 py-2 bg-secondary/50 border border-border/40 hover:border-primary/40 hover:bg-primary/5 text-slate-300 hover:text-primary transition-colors rounded text-[8px] font-semibold disabled:opacity-50"
          >
            {healthStatus === 'loading' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Heart className="w-3 h-3" />}
            Check OpenClaw Health
          </button>

          {/* Preview Obsidian Task */}
          <button
            type="button"
            onClick={handleObsidianPreview}
            className="flex items-center justify-center gap-1.5 px-3 py-2 bg-secondary/50 border border-border/40 hover:border-primary/40 hover:bg-primary/5 text-slate-300 hover:text-primary transition-colors rounded text-[8px] font-semibold"
          >
            <Eye className="w-3 h-3" />
            Preview Obsidian Task
          </button>

          {/* Preview Browser Task */}
          <button
            type="button"
            onClick={handleBrowserPreview}
            className="flex items-center justify-center gap-1.5 px-3 py-2 bg-secondary/50 border border-border/40 hover:border-primary/40 hover:bg-primary/5 text-slate-300 hover:text-primary transition-colors rounded text-[8px] font-semibold"
          >
            <Eye className="w-3 h-3" />
            Preview Browser Task
          </button>

          {/* View Last Dry Run */}
          <button
            type="button"
            onClick={handleViewLastDryRun}
            className="flex items-center justify-center gap-1.5 px-3 py-2 bg-secondary/50 border border-border/40 hover:border-primary/40 hover:bg-primary/5 text-slate-300 hover:text-primary transition-colors rounded text-[8px] font-semibold"
          >
            <Eye className="w-3 h-3" />
            View Last Dry Run
          </button>
        </div>

        {/* Health result */}
        {healthStatus && healthStatus !== 'loading' && (
          <div className={`flex items-center gap-2 px-3 py-2 border rounded text-[8px] ${healthStatus.ok ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-destructive/10 border-destructive/20 text-destructive'}`}>
            {healthStatus.ok ? <CheckCircle2 className="w-3 h-3 shrink-0" /> : <XCircle className="w-3 h-3 shrink-0" />}
            <span>{healthStatus.message}</span>
          </div>
        )}

        {/* Obsidian preview */}
        {obsidianPreview && (
          <div className="bg-secondary/30 border border-border/40 rounded p-3 text-[7px] font-mono text-slate-400 space-y-0.5">
            <div className="text-[8px] font-semibold text-slate-300 mb-1">Obsidian Task Preview</div>
            <div>mode: <span className="text-emerald-400">{obsidianPreview.mode}</span></div>
            <div>executionStatus: <span className="text-slate-200">{obsidianPreview.executionStatus}</span></div>
            <div>commandType: <span className="text-slate-200">{obsidianPreview.sampleTask.commandType}</span></div>
            <div>targetSystem: <span className="text-slate-200">{obsidianPreview.sampleTask.targetSystem}</span></div>
            <div>riskTier: <span className="text-slate-200">{obsidianPreview.sampleTask.riskTier}</span></div>
            <div className="text-slate-500 italic pt-1">{obsidianPreview.note}</div>
          </div>
        )}

        {/* Browser preview */}
        {browserPreview && (
          <div className="bg-secondary/30 border border-border/40 rounded p-3 text-[7px] font-mono text-slate-400 space-y-0.5">
            <div className="text-[8px] font-semibold text-slate-300 mb-1">Browser Task Preview</div>
            <div>mode: <span className="text-emerald-400">{browserPreview.mode}</span></div>
            <div>executionStatus: <span className="text-slate-200">{browserPreview.executionStatus}</span></div>
            <div>commandType: <span className="text-slate-200">{browserPreview.sampleTask.commandType}</span></div>
            <div>targetUrl: <span className="text-slate-200">{browserPreview.sampleTask.targetUrl}</span></div>
            <div>riskTier: <span className="text-slate-200">{browserPreview.sampleTask.riskTier}</span></div>
            <div className="text-slate-500 italic pt-1">{browserPreview.note}</div>
          </div>
        )}

        {/* Last dry run */}
        {lastDryRun === null && (
          /* only show "no record" after user clicked the button — detect via a flag */
          null
        )}
        {lastDryRun !== undefined && lastDryRun !== null && (
          <div className="bg-secondary/30 border border-border/40 rounded p-3 text-[7px] font-mono text-slate-400 space-y-0.5">
            <div className="text-[8px] font-semibold text-slate-300 mb-1">Last Dry Run (localStorage)</div>
            <div>savedAt: <span className="text-slate-200">{lastDryRun.savedAt}</span></div>
            <div>bridgeMode: <span className="text-emerald-400">{lastDryRun.bridgeMode}</span></div>
            <div>executionStatus: <span className="text-slate-200">{lastDryRun.executionStatus}</span></div>
            <div>policyGate: <span className="text-slate-200">{lastDryRun.policyGateResult}</span></div>
            <div>replayCheck: <span className="text-slate-200">{lastDryRun.replayCheckResult}</span></div>
            <div>signatureCheck: <span className="text-slate-200">{lastDryRun.signatureCheckResult}</span></div>
            <div className="text-slate-500 italic pt-1">{lastDryRun.safetyBoundary}</div>
          </div>
        )}

        <div className="text-[6px] text-slate-600 italic text-center">Read-only · Preview-only · No execution · No dispatch · No broker action</div>
      </div>
    </div>
  );
}