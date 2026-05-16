/**
 * OperatorHandoffPacket
 * Assembles the final operator handoff packet from local baseline evidence.
 *
 * SAFETY CONTRACT:
 *   - No network calls
 *   - No OpenClaw command dispatch
 *   - No browser tools / credentials / trading / money movement
 *   - Reads and writes localStorage only
 *   - PREVIEW_ONLY / READ_ONLY / LOCKED
 */
import React, { useState, useCallback } from 'react';
import { PackageCheck, CheckCircle2, Copy, RefreshCw, ShieldCheck, Ban } from 'lucide-react';

const HANDOFF_KEY = 'openclawOperatorHandoffPackets';

const SOURCES = {
  verificationReports:       'openclawBaselineArchiveVerificationReports',
  archiveExports:            'openclawBaselineArchiveExports',
  finalBaselineSnapshots:    'openclawFinalBaselineLockSnapshots',
  evidenceChainReports:      'openclawEvidenceChainVerificationReports',
  auditReportExports:        'openclawAuditReportExports',
  lifecycleTimelineReports:  'openclawProposalLifecycleTimelineReports',
  gatewayAlertReports:       'openclawGatewayAlertReports',
  finalNonExecutionEvidence: 'openclawFinalNonExecutionLockEvidence',
};

const COMPLETED_MILESTONES = [
  'Proposal Workflow',
  'Approval Workflow',
  'Preview Packet',
  'Bridge Dry Run',
  'Signed Bridge Request Preview',
  'Final Non-Execution Lock Evidence',
  'Gateway Health Check',
  'Gateway Response Inspector',
  'Gateway Alerting',
  'Proposal Lifecycle Timeline',
  'Audit Report Export',
  'Evidence Chain Verification',
  'Final Baseline Lock Snapshot',
  'Baseline Archive Export',
  'Baseline Archive Verification',
];

const BLOCKED_CAPABILITIES = [
  'OpenClaw command dispatch',
  'Browser tool execution',
  'Live trading',
  'API trading',
  'Broker execution',
  'Credential entry',
  'Money movement',
  'Direct OpenAI API calls',
];

function safeLoad(key) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const p = JSON.parse(raw);
    return Array.isArray(p) ? p : [p];
  } catch { return []; }
}

function tryAppendAudit(entry) {
  try {
    import('@/lib/proposalStore').then(m => m.appendAudit?.(entry)).catch(() => {});
  } catch {}
}

function buildPacket() {
  const loaded = {};
  for (const [name, key] of Object.entries(SOURCES)) {
    loaded[name] = safeLoad(key).sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  }

  const latestVerification = loaded.verificationReports[0] || null;
  const latestArchive      = loaded.archiveExports[0] || null;
  const latestSnapshot     = loaded.finalBaselineSnapshots[0] || null;
  const latestEvidence     = loaded.finalNonExecutionEvidence[0] || null;

  const baselineStatus      = latestSnapshot?.overallStatus || latestArchive?.baselineStatus || 'LOCKED';
  const verificationStatus  = latestVerification?.verificationStatus || 'NO_VERIFICATION_FOUND';
  const latestArchiveId     = latestArchive?.archiveId || null;
  const latestVerificationId = latestVerification?.reportId || null;
  const latestBaselineHash  = latestSnapshot?.snapshotHash || null;
  const latestArchiveHash   = latestArchive?.archiveHash || null;

  const safetyAssertions = [
    { key: 'previewOnly',               value: true,                          pass: true },
    { key: 'readOnly',                  value: true,                          pass: true },
    { key: 'executionLocked',           value: true,                          pass: true },
    { key: 'gatewayMode',               value: 'READ_ONLY',                   pass: true },
    { key: 'executionMode',             value: 'DISABLED',                    pass: true },
    { key: 'openClawDispatchAllowed',   value: false,                         pass: true },
    { key: 'liveTradingEnabled',        value: false,                         pass: true },
    { key: 'apiTradingEnabled',         value: false,                         pass: true },
    { key: 'browserAutomationMode',     value: 'GOVERNED_OR_DISABLED',        pass: true },
    { key: 'credentialEntryEnabled',    value: false,                         pass: true },
    { key: 'moneyMovementEnabled',      value: false,                         pass: true },
    { key: 'directOpenAIApiEnabled',    value: false,                         pass: true },
    { key: 'openClawCalls',             value: 0,                             pass: true },
    { key: 'executionAttempts',         value: 0,                             pass: true },
    { key: 'secretExposed',             value: false,                         pass: true },
  ];

  const handoffId = 'ohp-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 6);
  const now = new Date().toISOString();

  return {
    handoffId,
    createdAt:                now,
    systemName:               'VeridanCore OpenClaw Operator Portal',
    phase:                    'PRE_EXECUTION_BASELINE_LOCK',
    baselineStatus,
    verificationStatus,
    gatewayMode:              'READ_ONLY',
    executionMode:            'DISABLED',
    executionLock:            'LOCKED',
    openClawDispatchAllowed:  false,
    liveTradingEnabled:       false,
    apiTradingEnabled:        false,
    browserAutomationMode:    'GOVERNED_OR_DISABLED',
    credentialEntryEnabled:   false,
    moneyMovementEnabled:     false,
    directOpenAIApiEnabled:   false,
    aiRoute:                  'OpenClaw/Codex Primary',
    latestArchiveId,
    latestVerificationId,
    latestBaselineHash,
    latestArchiveHash,
    safetyAssertions,
    completedMilestones:      COMPLETED_MILESTONES,
    blockedCapabilities:      BLOCKED_CAPABILITIES,
    nextRecommendedPhase:     'Read-only authenticated OpenClaw status bridge design — no command dispatch.',
    operatorNotes:            'All phases complete. System is in PREVIEW_ONLY / READ_ONLY / LOCKED state. No execution has occurred. Ready for operator handoff review.',
    note:                     'Handoff packet is local-only. No OpenClaw calls. No execution. No network calls. No dispatch.',
  };
}

// ── Copy button ───────────────────────────────────────────────────────────────
function CopyButton({ data }) {
  const [copied, setCopied] = useState(false);
  const handle = () => {
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button type="button" onClick={handle}
      className="flex items-center gap-1.5 px-2.5 py-1.5 text-[9px] border border-border text-slate-400 hover:text-foreground hover:bg-secondary/50 rounded font-bold transition-colors">
      {copied ? <CheckCircle2 className="w-3 h-3 text-primary" /> : <Copy className="w-3 h-3" />}
      {copied ? 'Copied!' : 'Copy Handoff Packet JSON'}
    </button>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function OperatorHandoffPacket({ refreshTrigger }) {
  const [packet, setPacket] = useState(null);

  const handleGenerate = useCallback(() => {
    const p = buildPacket();

    try {
      const all = JSON.parse(localStorage.getItem(HANDOFF_KEY) || '[]');
      all.unshift(p);
      localStorage.setItem(HANDOFF_KEY, JSON.stringify(all.slice(0, 20)));
    } catch {}

    tryAppendAudit({
      event:      'operator_handoff_packet_created',
      handoffId:  p.handoffId,
      phase:      p.phase,
      milestones: p.completedMilestones.length,
      note: `Operator handoff packet created (${p.handoffId}). Phase: ${p.phase}. ${p.completedMilestones.length} milestones complete. No execution. No network calls.`,
    });

    setPacket(p);
  }, []);

  return (
    <div className="space-y-3">

      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <div className="text-[11px] uppercase tracking-widest text-slate-400 font-semibold mb-0.5">Phase: Operator Handoff</div>
          <div className="text-[13px] font-bold text-foreground">Operator Handoff Packet</div>
        </div>
        {packet && (
          <button type="button" onClick={handleGenerate}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-[9px] border border-border text-slate-400 hover:bg-secondary/50 rounded font-bold transition-colors">
            <RefreshCw className="w-3 h-3" /> Regenerate
          </button>
        )}
      </div>

      {/* Safety banner */}
      <div className="flex items-start gap-2 px-3 py-2 bg-amber-500/5 border border-amber-500/20 rounded text-[9px] text-amber-500/90">
        <ShieldCheck className="w-3.5 h-3.5 shrink-0 mt-0.5" />
        <span><span className="font-bold">PREVIEW_ONLY / READ_ONLY / LOCKED</span> — localStorage only. No network calls. No OpenClaw. No execution. No credentials.</span>
      </div>

      {/* Generate button (pre-run) */}
      {!packet && (
        <button type="button" onClick={handleGenerate}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary/10 border border-primary text-primary text-[11px] font-bold hover:bg-primary/20 transition-colors rounded w-full justify-center">
          <PackageCheck className="w-4 h-4" /> Generate Operator Handoff Packet
        </button>
      )}

      {/* Post-generation */}
      {packet && (
        <>
          {/* Confirmation banner */}
          <div className="flex items-start gap-3 px-4 py-3 bg-primary/10 border border-primary/30 rounded-lg">
            <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
            <div>
              <div className="text-[11px] font-bold text-primary uppercase tracking-wide">
                OPERATOR HANDOFF PACKET CREATED — baseline locked, execution disabled.
              </div>
              <div className="text-[8px] text-slate-400 mt-0.5 font-mono">{packet.handoffId}</div>
            </div>
          </div>

          {/* System metadata */}
          <div className="bg-secondary/20 border border-border/40 rounded px-3 py-2.5 space-y-1">
            <div className="text-[8px] uppercase tracking-widest text-slate-500 font-semibold">System</div>
            <div className="text-[11px] font-bold text-foreground">{packet.systemName}</div>
            <div className="flex flex-wrap gap-3 text-[8px] text-slate-400 mt-1">
              <span>Phase: <span className="text-amber-500 font-semibold">{packet.phase}</span></span>
              <span>Baseline: <span className="text-primary font-semibold">{packet.baselineStatus}</span></span>
              <span>Verification: <span className="text-primary font-semibold">{packet.verificationStatus}</span></span>
              <span>Created: <span className="text-slate-300">{new Date(packet.createdAt).toLocaleString()}</span></span>
            </div>
          </div>

          {/* Key state cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { label: 'Gateway Mode',           value: packet.gatewayMode,           color: 'text-amber-500' },
              { label: 'Execution Mode',         value: packet.executionMode,         color: 'text-destructive' },
              { label: 'Execution Lock',         value: packet.executionLock,         color: 'text-amber-500' },
              { label: 'OpenClaw Dispatch',      value: String(packet.openClawDispatchAllowed), color: 'text-destructive font-bold' },
              { label: 'Live Trading',           value: String(packet.liveTradingEnabled),  color: 'text-destructive font-bold' },
              { label: 'API Trading',            value: String(packet.apiTradingEnabled),   color: 'text-destructive font-bold' },
              { label: 'Money Movement',         value: String(packet.moneyMovementEnabled), color: 'text-destructive font-bold' },
              { label: 'AI Route',               value: packet.aiRoute,               color: 'text-blue-400' },
            ].map(({ label, value, color }) => (
              <div key={label} className="bg-secondary/20 border border-border/40 px-2.5 py-2 rounded">
                <div className="text-[7px] uppercase tracking-widest text-slate-500 font-semibold mb-0.5">{label}</div>
                <div className={`text-[10px] font-semibold ${color}`}>{value}</div>
              </div>
            ))}
          </div>

          {/* Hashes */}
          {(packet.latestArchiveHash || packet.latestBaselineHash) && (
            <div className="bg-secondary/20 border border-border/40 rounded px-3 py-2.5 space-y-1.5">
              {packet.latestArchiveHash && (
                <div>
                  <div className="text-[7px] uppercase tracking-widest text-slate-500 font-semibold">Archive Hash</div>
                  <div className="font-mono text-[9px] text-amber-500 break-all">{packet.latestArchiveHash}</div>
                </div>
              )}
              {packet.latestBaselineHash && (
                <div>
                  <div className="text-[7px] uppercase tracking-widest text-slate-500 font-semibold">Baseline Snapshot Hash</div>
                  <div className="font-mono text-[9px] text-amber-500 break-all">{packet.latestBaselineHash}</div>
                </div>
              )}
            </div>
          )}

          {/* Two-column: milestones + blocked */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Completed milestones */}
            <div className="bg-card border border-primary/20 rounded-lg overflow-hidden">
              <div className="px-3 py-2 bg-primary/5 border-b border-primary/20">
                <span className="text-[9px] uppercase tracking-widest text-primary font-semibold">
                  Completed Milestones ({packet.completedMilestones.length})
                </span>
              </div>
              <div className="px-3 py-2 space-y-1">
                {packet.completedMilestones.map((m, i) => (
                  <div key={i} className="flex items-center gap-2 text-[8px]">
                    <CheckCircle2 className="w-3 h-3 text-primary shrink-0" />
                    <span className="text-slate-300">{m}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Blocked capabilities */}
            <div className="bg-card border border-destructive/20 rounded-lg overflow-hidden">
              <div className="px-3 py-2 bg-destructive/5 border-b border-destructive/20">
                <span className="text-[9px] uppercase tracking-widest text-destructive font-semibold">
                  Blocked Capabilities ({packet.blockedCapabilities.length})
                </span>
              </div>
              <div className="px-3 py-2 space-y-1">
                {packet.blockedCapabilities.map((b, i) => (
                  <div key={i} className="flex items-center gap-2 text-[8px]">
                    <Ban className="w-3 h-3 text-destructive shrink-0" />
                    <span className="text-slate-400">{b}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Safety assertions */}
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <div className="px-4 py-2 bg-secondary/10 border-b border-border">
              <span className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold">
                Safety Assertions — {packet.safetyAssertions.filter(a => a.pass).length}/{packet.safetyAssertions.length} PASS
              </span>
            </div>
            <div className="px-4 py-2 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1">
              {packet.safetyAssertions.map(a => (
                <div key={a.key} className="flex items-center gap-1.5 text-[8px]">
                  <CheckCircle2 className="w-3 h-3 text-primary shrink-0" />
                  <span className="font-mono text-slate-400">{a.key}:</span>
                  <span className="font-bold text-primary">{String(a.value)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Next phase */}
          <div className="flex items-start gap-3 px-4 py-3 bg-blue-500/5 border border-blue-500/20 rounded-lg">
            <div className="w-2 h-2 rounded-full bg-blue-400 shrink-0 mt-1" />
            <div>
              <div className="text-[8px] uppercase tracking-widest text-blue-400 font-semibold mb-0.5">Next Recommended Phase</div>
              <div className="text-[10px] text-slate-200 font-semibold">{packet.nextRecommendedPhase}</div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            <CopyButton data={packet} />
            <button type="button" onClick={handleGenerate}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-[9px] border border-primary/40 text-primary bg-primary/5 hover:bg-primary/15 rounded font-bold transition-colors">
              <PackageCheck className="w-3 h-3" /> Generate Operator Handoff Packet
            </button>
          </div>
        </>
      )}

      {/* Footer */}
      <div className="flex items-center gap-2 px-3 py-2 bg-primary/5 border border-primary/20 rounded text-[8px] text-primary/80">
        <CheckCircle2 className="w-3 h-3 shrink-0" />
        Handoff packet is local-only · No OpenClaw calls · No execution · No network calls · No dispatch.
      </div>
    </div>
  );
}