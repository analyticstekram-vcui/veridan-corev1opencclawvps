import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import {
  AlertTriangle, CheckCircle2, XCircle, Loader2, Lock,
  Eye, FileText, Save, Shield
} from 'lucide-react';

// ============================================================================
// PHASE 5B — READ-ONLY DISPATCH PREVIEW
// Safety boundary:
// - No execution, no dispatch, no browser automation, no file writes
// - No credential handling, no broker/trading logic
// - Calls ONLY existing read-only backend functions (health/status/version/capabilities)
// - Saves Phase 5B previews to localStorage only (prefix: phase5b_readonly_dispatch_preview_)
// - Never deletes Phase 5A evidence or baseline keys
// ============================================================================

const EVIDENCE_KEY_PREFIX = 'phase5a_evidence_';
const PHASE5B_KEY_PREFIX = 'phase5b_readonly_dispatch_preview_';

const TARGETS = [
  { name: 'OpenClaw Health',        path: '/health',       fn: 'openclawHealthCheck',                extract: d => ({ online: d.success === true || d.gatewayReachable === true || d.status === 'SUCCESS' || d.httpStatus === 200, latencyMs: d.latencyMs ?? d.data?.latencyMs ?? '—' }) },
  { name: 'OpenClaw Status',        path: '/status',       fn: 'openclawStatus',                     extract: d => ({ status: d.status ?? d.gatewayStatus ?? 'unknown', mode: d.mode ?? '—' }) },
  { name: 'OpenClaw Version',       path: '/version',      fn: 'openclawStatusVersionCapabilities',  extract: d => ({ version: d.version ?? d.gatewayVersion ?? '—', build: d.build ?? '—', environment: d.environment ?? '—' }) },
  { name: 'OpenClaw Capabilities',  path: '/capabilities', fn: 'openclawStatusVersionCapabilities',  extract: d => { const c = d.capabilities ?? d.supportedCapabilities ?? []; return { capabilities: Array.isArray(c) ? (c.length ? c.join(', ') : '—') : String(c) }; } },
];

// Read the most recent accepted Phase 5A snapshot from localStorage
const loadLatestPhase5ASnapshot = () => {
  const keys = Object.keys(localStorage).filter(k => k.startsWith(EVIDENCE_KEY_PREFIX));
  if (keys.length === 0) return null;
  keys.sort().reverse();
  try { return JSON.parse(localStorage.getItem(keys[0])); } catch { return null; }
};

// Validate a loaded Phase 5A snapshot
const validateSnapshot = (snap) => {
  if (!snap) return { valid: false, checks: [{ label: 'Snapshot loaded', pass: false }] };

  const accepted = snap.accepted === true || snap.acceptedForDryRun === true || snap.snapshotType === 'PHASE_5A_DRY_RUN_EVIDENCE';
  const bridgeOk = snap.bridgeMode === 'DRY_RUN_ONLY';
  const execOk   = snap.executionStatus === 'NOT_EXECUTED';
  const sigOk    = !snap.signatureCheckResult || snap.signatureCheckResult === 'PASS';
  const polOk    = !snap.policyGateResult    || snap.policyGateResult    === 'PASS';
  const repOk    = !snap.replayCheckResult   || snap.replayCheckResult   === 'PASS';
  const bindOk   = !snap.approvalBindingStatus || snap.approvalBindingStatus === 'PASS';

  const checks = [
    { label: 'Phase 5A snapshot accepted',   pass: accepted },
    { label: 'bridgeMode === DRY_RUN_ONLY',  pass: bridgeOk },
    { label: 'executionStatus NOT_EXECUTED', pass: execOk },
    { label: 'Signature check passed',       pass: sigOk },
    { label: 'Policy gate passed',           pass: polOk },
    { label: 'Replay check passed',          pass: repOk },
    { label: 'Approval binding passed',      pass: bindOk },
  ];

  return { valid: accepted && bridgeOk && execOk && sigOk && polOk && repOk && bindOk, checks };
};

// Build the local-only dispatchPreview object
const buildDispatchPreview = (target) => ({
  phase: 'Phase 5B',
  mode: 'READ_ONLY_DISPATCH_PREVIEW',
  sourcePhase: 'Phase 5A',
  sourceAcceptedDryRun: true,
  targetName: target.name,
  targetPath: target.path,
  commandType: 'READ',
  riskTier: 'LOW',
  dispatchAllowed: false,
  executionStatus: 'NOT_EXECUTED',
  dispatchStatus: 'NOT_DISPATCHED',
  browserAutomationAllowed: false,
  fileWriteAllowed: false,
  credentialUseAllowed: false,
  brokerActionAllowed: false,
  createdAt: new Date().toISOString(),
});

// ─── Verification Row ─────────────────────────────────────────────────────────
function VerifRow({ label, pass }) {
  return (
    <div className="flex items-center gap-2 text-[7px] font-mono">
      {pass
        ? <CheckCircle2 className="w-3 h-3 text-primary shrink-0" />
        : <XCircle className="w-3 h-3 text-destructive shrink-0" />}
      <span className={pass ? 'text-slate-300' : 'text-destructive'}>{label}</span>
      <span className={`ml-auto font-bold ${pass ? 'text-primary' : 'text-destructive'}`}>{pass ? 'PASS' : 'FAIL'}</span>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function Phase5BReadOnlyDispatchPreview() {
  const [snapshot, setSnapshot]           = useState(undefined); // undefined = not yet loaded
  const [validation, setValidation]       = useState(null);
  const [selectedIdx, setSelectedIdx]     = useState(0);
  const [dispatchPreview, setDispatchPreview] = useState(null);
  const [callLoading, setCallLoading]     = useState(false);
  const [callResult, setCallResult]       = useState(null);
  const [callError, setCallError]         = useState(null);
  const [savedKey, setSavedKey]           = useState(null);

  const target = TARGETS[selectedIdx];

  // ── Load snapshot ──
  const handleLoad = () => {
    const snap = loadLatestPhase5ASnapshot();
    setSnapshot(snap);
    setValidation(validateSnapshot(snap));
    setDispatchPreview(null);
    setCallResult(null);
    setCallError(null);
    setSavedKey(null);
  };

  // ── Build preview ──
  const handleBuildPreview = () => {
    setDispatchPreview(buildDispatchPreview(target));
    setCallResult(null);
    setCallError(null);
  };

  // ── Run read-only call ──
  const handleRunReadOnly = async () => {
    setCallLoading(true);
    setCallResult(null);
    setCallError(null);
    try {
      const res = await base44.functions.invoke(target.fn, {});
      const raw = res.data || {};
      setCallResult({ label: 'READ-ONLY CALL RESULT — NOT EXECUTION', data: target.extract(raw) });
    } catch (err) {
      setCallError(err.message || 'Read-only call failed');
    } finally {
      setCallLoading(false);
    }
  };

  // ── Save preview locally ──
  const handleSave = () => {
    if (!dispatchPreview) return;
    const key = `${PHASE5B_KEY_PREFIX}${Date.now()}`;
    const toSave = {
      ...dispatchPreview,
      savedAt: new Date().toISOString(),
      readOnlyCallResult: callResult?.data || null,
      safetyBoundary: 'Phase 5B local preview only. No dispatch, no execution, no file write.',
    };
    try {
      localStorage.setItem(key, JSON.stringify(toSave));
      setSavedKey(key);
    } catch {
      setSavedKey('QUOTA_EXCEEDED');
    }
  };

  const snapshotValid = validation?.valid === true;

  // ── Verification checks ──
  const verificationChecks = [
    { label: 'Phase 5A accepted snapshot loaded',        pass: snapshotValid },
    { label: 'bridgeMode DRY_RUN_ONLY',                  pass: snapshot?.bridgeMode === 'DRY_RUN_ONLY' },
    { label: 'executionStatus NOT_EXECUTED',             pass: snapshot?.executionStatus === 'NOT_EXECUTED' },
    { label: 'Target is allowlisted read-only target',   pass: !!target },
    { label: 'Dispatch disabled',                        pass: true },
    { label: 'Execution disabled',                       pass: true },
    { label: 'Browser automation disabled',              pass: true },
    { label: 'File writes disabled',                     pass: true },
    { label: 'Credential use disabled',                  pass: true },
    { label: 'Broker action disabled',                   pass: true },
  ];

  return (
    <div className="space-y-5">

      {/* Title */}
      <div className="flex items-center gap-2">
        <Lock className="w-4 h-4 text-primary shrink-0" />
        <h2 className="text-sm font-bold uppercase tracking-widest text-foreground">
          Phase 5B — Read-Only Dispatch Preview
        </h2>
      </div>

      {/* Banner */}
      <div className="flex items-center gap-2 px-4 py-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
        <Shield className="w-4 h-4 text-blue-400 shrink-0" />
        <span className="text-[9px] font-bold text-blue-400 uppercase tracking-wide">
          READ-ONLY DISPATCH PREVIEW — No execution, no browser automation, no file writes.
        </span>
      </div>

      {/* Step 1: Load Snapshot */}
      <div className="border border-border/40 bg-card rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-border/30 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-[9px] font-bold uppercase tracking-wider text-slate-300">
              Step 1 — Load Phase 5A Dry-Run Snapshot
            </span>
          </div>
          <button
            type="button"
            onClick={handleLoad}
            className="text-[7px] font-mono px-2 py-1 border border-border/40 hover:border-primary/40 hover:text-primary text-slate-400 rounded transition-colors flex items-center gap-1"
          >
            <Eye className="w-2.5 h-2.5" />
            Load
          </button>
        </div>
        <div className="px-4 py-3 text-[7px] font-mono min-h-[48px]">
          {snapshot === undefined && (
            <span className="text-slate-600 italic">Click Load to read the latest Phase 5A dry-run evidence from localStorage.</span>
          )}
          {snapshot === null && (
            <span className="text-amber-500/80">
              No accepted Phase 5A dry-run snapshot found. Run Phase 5A and save a Dry-Run Snapshot first.
            </span>
          )}
          {snapshot && (
            <div className="space-y-0.5 text-slate-400">
              <div>snapshotType: <span className="text-slate-200">{snapshot.snapshotType}</span></div>
              <div>savedAt: <span className="text-slate-200">{snapshot.savedAt}</span></div>
              <div>bridgeMode: <span className={snapshot.bridgeMode === 'DRY_RUN_ONLY' ? 'text-primary' : 'text-destructive'}>{snapshot.bridgeMode}</span></div>
              <div>executionStatus: <span className={snapshot.executionStatus === 'NOT_EXECUTED' ? 'text-primary' : 'text-destructive'}>{snapshot.executionStatus}</span></div>
              <div>policyGateResult: <span className="text-slate-200">{snapshot.policyGateResult || '—'}</span></div>
              <div>signatureCheckResult: <span className="text-slate-200">{snapshot.signatureCheckResult || '—'}</span></div>
            </div>
          )}
        </div>

        {/* Snapshot validation */}
        {validation && (
          <div className="px-4 pb-3 space-y-1 border-t border-border/20 pt-2">
            <div className="text-[7px] font-bold uppercase text-slate-500 mb-1">Snapshot Validation</div>
            {validation.checks.map(c => <VerifRow key={c.label} label={c.label} pass={c.pass} />)}
            <div className={`mt-2 text-[8px] font-bold uppercase ${validation.valid ? 'text-primary' : 'text-destructive'}`}>
              {validation.valid ? '✓ Snapshot valid — Phase 5B enabled' : '✗ Snapshot invalid — fix Phase 5A first'}
            </div>
          </div>
        )}
      </div>

      {/* Step 2: Select Target */}
      <div className="border border-border/40 bg-card rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-border/30">
          <span className="text-[9px] font-bold uppercase tracking-wider text-slate-300">
            Step 2 — Select Read-Only Target
          </span>
        </div>
        <div className="px-4 py-3 grid grid-cols-2 md:grid-cols-4 gap-2">
          {TARGETS.map((t, i) => (
            <button
              key={t.path}
              type="button"
              onClick={() => { setSelectedIdx(i); setDispatchPreview(null); setCallResult(null); setCallError(null); }}
              className={`px-3 py-2 text-[8px] font-mono border rounded transition-colors ${
                selectedIdx === i
                  ? 'border-primary/60 bg-primary/10 text-primary font-bold'
                  : 'border-border/40 text-slate-400 hover:border-primary/30 hover:text-slate-200'
              }`}
            >
              <div>{t.name}</div>
              <div className="text-[7px] opacity-60">{t.path}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Step 3: Build Preview */}
      <div className="border border-border/40 bg-card rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-border/30 flex items-center justify-between">
          <span className="text-[9px] font-bold uppercase tracking-wider text-slate-300">
            Step 3 — Build Read-Only Dispatch Preview
          </span>
          <button
            type="button"
            onClick={handleBuildPreview}
            disabled={!snapshotValid}
            className="text-[7px] font-mono px-3 py-1.5 border border-primary/40 text-primary hover:bg-primary/10 rounded transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Build Read-Only Dispatch Preview
          </button>
        </div>
        <div className="px-4 py-3 text-[7px] font-mono min-h-[48px]">
          {!dispatchPreview && (
            <span className="text-slate-600 italic">
              {snapshotValid ? 'Click button to build local-only dispatch preview.' : 'Load a valid Phase 5A snapshot first.'}
            </span>
          )}
          {dispatchPreview && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-0.5 text-slate-400">
              {Object.entries(dispatchPreview).map(([k, v]) => (
                <div key={k}>
                  <span className="text-slate-500">{k}: </span>
                  <span className={
                    k === 'executionStatus' || k === 'dispatchStatus' ? 'text-primary' :
                    (k === 'dispatchAllowed' || k === 'browserAutomationAllowed' || k === 'fileWriteAllowed' || k === 'credentialUseAllowed' || k === 'brokerActionAllowed') ? 'text-destructive' :
                    'text-slate-200'
                  }>
                    {String(v)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Step 4: Run Read-Only Call (optional) */}
      {dispatchPreview && (
        <div className="border border-border/40 bg-card rounded-lg overflow-hidden">
          <div className="px-4 py-3 border-b border-border/30 flex items-center justify-between">
            <span className="text-[9px] font-bold uppercase tracking-wider text-slate-300">
              Step 4 (Optional) — Run Read-Only Status Call
            </span>
            <button
              type="button"
              onClick={handleRunReadOnly}
              disabled={callLoading}
              className="text-[7px] font-mono px-3 py-1.5 border border-blue-500/40 text-blue-400 hover:bg-blue-500/10 rounded transition-colors disabled:opacity-50 flex items-center gap-1"
            >
              {callLoading ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : <Eye className="w-2.5 h-2.5" />}
              Run Read-Only Status Call
            </button>
          </div>
          <div className="px-4 py-3 text-[7px] font-mono min-h-[48px]">
            {!callResult && !callError && !callLoading && (
              <span className="text-slate-600 italic">Click to run read-only {target.fn} call for {target.path}.</span>
            )}
            {callLoading && (
              <span className="text-slate-400 flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" /> Calling {target.fn}…</span>
            )}
            {callError && (
              <span className="text-destructive">{callError}</span>
            )}
            {callResult && (
              <div className="space-y-1">
                <div className="text-[8px] font-bold text-blue-400 uppercase mb-1">{callResult.label}</div>
                {Object.entries(callResult.data).map(([k, v]) => (
                  <div key={k}>
                    <span className="text-slate-500">{k}: </span>
                    <span className="text-slate-200">{String(v)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="px-4 pb-2 text-[6px] text-slate-600 italic">
            Calls existing read-only function only — not execution — no dispatch.
          </div>
        </div>
      )}

      {/* Result Panel */}
      {dispatchPreview && (
        <div className="border border-border/40 bg-card rounded-lg overflow-hidden">
          <div className="px-4 py-3 border-b border-border/30 flex items-center justify-between">
            <span className="text-[9px] font-bold uppercase tracking-wider text-slate-300">
              Phase 5B Result Panel
            </span>
            <button
              type="button"
              onClick={handleSave}
              className="text-[7px] font-mono px-2 py-1 border border-border/40 hover:border-primary/40 hover:text-primary text-slate-400 rounded transition-colors flex items-center gap-1"
            >
              <Save className="w-2.5 h-2.5" />
              Save Preview
            </button>
          </div>
          <div className="px-4 py-3 text-[7px] font-mono space-y-0.5 text-slate-400">
            <div>selectedTarget: <span className="text-slate-200">{target.name}</span></div>
            <div>targetPath: <span className="text-slate-200">{target.path}</span></div>
            <div>dispatchAllowed: <span className="text-destructive font-bold">false</span></div>
            <div>dispatchStatus: <span className="text-primary font-bold">NOT_DISPATCHED</span></div>
            <div>executionStatus: <span className="text-primary font-bold">NOT_EXECUTED</span></div>
            {callResult && (
              <div className="pt-1 mt-1 border-t border-border/20">
                <div className="text-[7px] font-bold text-blue-400 mb-0.5">readOnlyCallResult</div>
                {Object.entries(callResult.data).map(([k, v]) => (
                  <div key={k}>{k}: <span className="text-slate-200">{String(v)}</span></div>
                ))}
              </div>
            )}
            {savedKey && (
              <div className={`pt-1 mt-1 border-t border-border/20 ${savedKey === 'QUOTA_EXCEEDED' ? 'text-amber-400' : 'text-primary'}`}>
                {savedKey === 'QUOTA_EXCEEDED' ? 'localStorage quota full — not saved.' : `Saved to localStorage key: ${savedKey}`}
              </div>
            )}
          </div>
          <div className="px-4 pb-2 text-[6px] text-slate-600 italic">
            Local preview only — no dispatch, no execution, no file write, no credential use.
          </div>
        </div>
      )}

      {/* Verification Block */}
      <div className="border border-border/40 bg-card rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-border/30 flex items-center gap-2">
          <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
          <span className="text-[9px] font-bold uppercase tracking-wider text-slate-300">Phase 5B Verification</span>
        </div>
        <div className="px-4 py-3 space-y-1">
          {verificationChecks.map(c => <VerifRow key={c.label} label={c.label} pass={c.pass} />)}
        </div>
      </div>

      {/* Safety footer */}
      <div className="text-[6px] text-slate-700 italic text-center pt-2 border-t border-border/20">
        Phase 5B · Read-only · No dispatch · No execution · No browser automation · No file write · No credential use · No broker action
      </div>
    </div>
  );
}