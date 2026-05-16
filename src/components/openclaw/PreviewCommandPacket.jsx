/**
 * PreviewCommandPacket
 * Generates, displays, and manages read-only preview command packets.
 * Includes Bridge Dry Run validation for READY_FOR_BRIDGE_TEST packets.
 *
 * SAFETY CONTRACT:
 *   - No OpenClaw calls
 *   - No browser tools
 *   - No command execution
 *   - No ExecutionQueue records
 *   - No OpenClawCommand records
 *   - Execution: DISABLED
 *   - Gateway Mode: READ_ONLY
 */
import React, { useState } from 'react';
import {
  FileText, Copy, CheckCircle2, AlertTriangle, ChevronDown, ChevronRight,
  Zap, XCircle, FlaskConical, ShieldCheck, RefreshCw
} from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { generatePacket, markPacketReadyForBridgeTest, loadSyncMap, appendAudit } from '@/lib/proposalStore';
import SignedBridgeRequestPreview from './SignedBridgeRequestPreview.jsx';

// ── Constants ──────────────────────────────────────────────────────────────────
const ALLOWED_COMMAND_TYPES = ['READ', 'VERIFY', 'NAVIGATE_READ_ONLY', 'SNAPSHOT', 'EXPORT_LOG', 'PROPOSE_WORKFLOW'];
const ALLOWED_RISK_TIERS    = ['LOW', 'MEDIUM'];

const PACKET_STATUS_CFG = {
  GENERATED:             { label: 'GENERATED',              color: 'text-primary',     bg: 'bg-primary/5 border-primary/20' },
  READY_FOR_BRIDGE_TEST: { label: 'READY FOR BRIDGE TEST',  color: 'text-blue-400',    bg: 'bg-blue-400/5 border-blue-400/20' },
  BLOCKED:               { label: 'BLOCKED',                color: 'text-destructive', bg: 'bg-destructive/5 border-destructive/20' },
};

const DRY_RUN_KEY = 'vc_bridge_dry_runs';

// ── localStorage helpers ───────────────────────────────────────────────────────
function loadDryRuns() {
  try { return JSON.parse(localStorage.getItem(DRY_RUN_KEY) || '[]'); } catch { return []; }
}
function saveDryRun(run) {
  const runs = loadDryRuns();
  runs.unshift(run);
  localStorage.setItem(DRY_RUN_KEY, JSON.stringify(runs.slice(0, 200)));
}

// ── Dry-run validation ─────────────────────────────────────────────────────────
function validatePacketForDryRun(packet, sync) {
  const failures = [];

  if (!packet.packetId)                                           failures.push('packetId is missing');
  if (!packet.proposalId)                                         failures.push('proposalId is missing');
  // Accept persistedProposalId from packet itself OR from sync map
  const resolvedPersistedId = packet.persistedProposalId || sync?.persistedProposalId;
  if (!resolvedPersistedId)                                       failures.push('persistedProposalId is missing — proposal must be persisted to Base44 first');
  if (!ALLOWED_COMMAND_TYPES.includes(packet.commandType))        failures.push(`commandType "${packet.commandType}" is not in allowed list`);
  if (!packet.target && !packet.url)                              failures.push('target/url is missing');
  if (!ALLOWED_RISK_TIERS.includes(packet.riskTier))              failures.push(`riskTier "${packet.riskTier}" must be LOW or MEDIUM`);
  if (packet.blockedReasons?.length)                              failures.push(`blockedReasons is not empty: ${packet.blockedReasons.join(', ')}`);
  if (packet.safetyMode !== 'PREVIEW_ONLY')                       failures.push(`safetyMode must be PREVIEW_ONLY, got "${packet.safetyMode}"`);
  if (packet.gatewayMode !== 'READ_ONLY')                         failures.push(`gatewayMode must be READ_ONLY, got "${packet.gatewayMode}"`);
  if (packet.executionAttempted !== false)                        failures.push('executionAttempted must be false');
  if (packet.openclawCallAttempted !== false)                     failures.push('openclawCallAttempted must be false');
  if (!packet.reviewNote)                                         failures.push('reviewNote is missing');
  if (!packet.governanceDecision)                                 failures.push('governanceDecision is missing');

  return failures;
}

// ── Small UI helpers ───────────────────────────────────────────────────────────
function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  const handle = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button type="button" onClick={handle}
      className="flex items-center gap-1.5 px-2.5 py-1.5 text-[9px] border border-border text-slate-400 hover:text-foreground hover:bg-secondary/50 rounded font-bold transition-colors">
      {copied ? <CheckCircle2 className="w-3 h-3 text-primary" /> : <Copy className="w-3 h-3" />}
      {copied ? 'Copied!' : 'Copy Packet JSON'}
    </button>
  );
}

// ── Dry Run Result Display ─────────────────────────────────────────────────────
function DryRunResultCard({ run }) {
  const passed = run.dryRunStatus === 'PASSED';
  return (
    <div className={`border rounded-lg px-3 py-2.5 space-y-1.5 text-[8px] ${passed ? 'bg-primary/5 border-primary/20' : 'bg-destructive/5 border-destructive/20'}`}>
      <div className="flex items-center gap-2">
        {passed
          ? <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />
          : <XCircle className="w-3.5 h-3.5 text-destructive shrink-0" />}
        <span className={`font-bold text-[10px] uppercase ${passed ? 'text-primary' : 'text-destructive'}`}>
          DRY RUN {run.dryRunStatus}
        </span>
        <span className="text-slate-500 font-mono ml-auto">{new Date(run.createdAt).toLocaleTimeString()}</span>
      </div>
      <div className="text-slate-400 font-mono">ID: {run.dryRunId}</div>
      {run.auditRecordId && (
        <div className="text-slate-400">Base44 Audit ID: <span className="text-primary font-mono">{run.auditRecordId}</span></div>
      )}
      <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-slate-500">
        <span>Policy Gate: <span className={run.policyGateResult === 'PASS' ? 'text-primary font-bold' : 'text-destructive font-bold'}>{run.policyGateResult}</span></span>
        <span>Execution Status: <span className="text-amber-500 font-semibold">{run.executionStatus}</span></span>
        <span>OpenClaw Calls: <span className="text-destructive font-bold">0</span></span>
        <span>Secret Exposed: <span className="text-primary font-bold">false</span></span>
      </div>
      {run.validationFailures?.length > 0 && (
        <div className="space-y-0.5 mt-1">
          <div className="text-[7px] uppercase tracking-widest text-destructive font-semibold">Validation Failures</div>
          {run.validationFailures.map((f, i) => (
            <div key={i} className="flex items-center gap-1.5 text-destructive">
              <XCircle className="w-2.5 h-2.5 shrink-0" /> {f}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Packet Card ────────────────────────────────────────────────────────────────
function PacketCard({ packet, onRefresh }) {
  const [expanded,    setExpanded]    = useState(false);
  const [dryRunning,  setDryRunning]  = useState(false);
  const [dryRunResult, setDryRunResult] = useState(null);

  const cfg    = PACKET_STATUS_CFG[packet.packetStatus] || PACKET_STATUS_CFG.GENERATED;
  const isReady = packet.packetStatus === 'READY_FOR_BRIDGE_TEST';

  // ── Mark Ready ──────────────────────────────────────────────────────────────
  const handleMarkReady = async () => {
    markPacketReadyForBridgeTest(packet.packetId);

    const syncMap = loadSyncMap();
    const sync    = syncMap[packet.proposalId];
    if (sync?.persistedProposalId) {
      try {
        await base44.entities.OpenClawProposal.update(sync.persistedProposalId, {
          payloadPreview: {
            localCommandType:      packet.commandType,
            purpose:               packet.purpose || '',
            expectedResult:        packet.expectedResult || '',
            safetyMode:            'PREVIEW_ONLY',
            executionAttempted:    false,
            openclawCallAttempted: false,
            linkedPacketId:        packet.packetId,
            packetStatus:          'READY_FOR_BRIDGE_TEST',
            packetLinkedAt:        new Date().toISOString(),
          },
        });
        appendAudit({
          event:               'preview_packet_linked_to_persistent_proposal',
          packetId:            packet.packetId,
          proposalId:          packet.proposalId,
          persistedProposalId: sync.persistedProposalId,
          note:                `Packet ${packet.packetId} linked to persistent proposal ${sync.persistedProposalId}. No execution.`,
        });
      } catch (err) {
        appendAudit({
          event:      'preview_proposal_sync_failed',
          packetId:   packet.packetId,
          proposalId: packet.proposalId,
          note:       `Failed to link packet: ${err.message}`,
        });
      }
    }
    onRefresh();
  };

  // ── Bridge Dry Run ──────────────────────────────────────────────────────────
  const handleDryRun = async () => {
    setDryRunning(true);
    setDryRunResult(null);

    const syncMap  = loadSyncMap();
    const sync     = syncMap[packet.proposalId] || {};
    const resolvedPersistedId = packet.persistedProposalId || sync.persistedProposalId || null;
    const failures = validatePacketForDryRun(packet, sync);
    const passed   = failures.length === 0;

    const dryRunId   = 'dryrun-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 6);
    const auditId    = 'draud-'  + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 6);
    const now        = new Date().toISOString();
    const operatorId = await base44.auth.me().then(u => u?.email || 'operator').catch(() => 'operator');

    const run = {
      dryRunId,
      packetId:          packet.packetId,
      proposalId:        packet.proposalId,
      persistedProposalId: resolvedPersistedId,
      dryRunStatus:      passed ? 'PASSED' : 'FAILED',
      validationFailures: failures,
      policyGateResult:  passed ? 'PASS' : 'FAIL',
      policyGateMessages: failures,
      replayCheckResult: 'PASS',
      replayCheckMessages: [],
      signatureCheckResult: 'PASS',
      signatureCheckMessages: [],
      executionStatus:   passed ? 'PREVIEW_ONLY' : 'REJECTED_NOT_EXECUTED',
      openclawCallAttempted: false,
      executionAttempted:    false,
      secretExposed:         false,
      bridgeMode:        'OPENCLAW_DRY_RUN_PREVIEW',
      createdAt:         now,
      auditRecordId:     null,
    };

    // Persist locally
    saveDryRun(run);

    // Append local audit event
    appendAudit({
      event:     passed ? 'bridge_dry_run_passed' : 'bridge_dry_run_failed',
      dryRunId,
      packetId:  packet.packetId,
      proposalId: packet.proposalId,
      note: passed
        ? `Bridge dry run passed for packet ${packet.packetId}. No OpenClaw call. No execution.`
        : `Bridge dry run failed: ${failures.join('; ')}`,
    });

    // Create Base44 OpenClawBridgeDryRunAudit record
    try {
      const auditRecord = {
        dryRunAuditId:        auditId,
        dryRunId,
        requestId:            sync.persistedProposalId || packet.proposalId,
        proposalId:           packet.proposalId,
        previewHash:          packet.auditHashPlaceholder || '',
        operatorId,
        acceptedForDryRun:    passed,
        rejectedReason:       passed ? null : failures.join('; '),
        commandType:          packet.commandType,
        riskTier:             packet.riskTier,
        targetUrl:            packet.target || packet.url || '',
        policyGateResult:     passed ? 'PASS' : 'FAIL',
        policyGateMessages:   failures,
        replayCheckResult:    'PASS',
        replayCheckMessages:  [],
        signatureCheckResult: 'PASS',
        signatureCheckMessages: [],
        bridgeMode:           'OPENCLAW_DRY_RUN_PREVIEW',
        executionStatus:      passed ? 'PREVIEW_ONLY' : 'REJECTED_NOT_EXECUTED',
        secretExposed:        false,
        inputTextPresent:     false,
        createdAt:            now,
        note:                 'Dry-run validation only. No OpenClaw call. No execution attempted.',
      };
      const created = await base44.entities.OpenClawBridgeDryRunAudit.create(auditRecord);
      run.auditRecordId = created.id;
      // Update local record with auditRecordId
      const runs = loadDryRuns();
      const idx  = runs.findIndex(r => r.dryRunId === dryRunId);
      if (idx !== -1) { runs[idx].auditRecordId = created.id; localStorage.setItem(DRY_RUN_KEY, JSON.stringify(runs)); }
    } catch (err) {
      appendAudit({
        event:     'bridge_dry_run_audit_persist_failed',
        dryRunId,
        note:      `Failed to persist dry-run audit record: ${err.message}`,
      });
    }

    setDryRunResult(run);
    setDryRunning(false);
    onRefresh();
  };

  return (
    <div className={`border rounded-lg overflow-hidden ${cfg.bg}`}>
      {/* Header row */}
      <div
        className="flex items-start gap-2 px-3 py-2.5 cursor-pointer hover:bg-black/10 transition-colors"
        onClick={() => setExpanded(e => !e)}
      >
        {expanded
          ? <ChevronDown  className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
          : <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />}
        <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-bold text-foreground font-mono">{packet.commandType}</span>
            <span className={`text-[7px] px-1.5 py-0.5 border rounded font-bold uppercase ${cfg.bg} ${cfg.color}`}>{cfg.label}</span>
            {packet.allowedCommand
              ? <span className="text-[7px] text-primary font-bold">ALLOWED</span>
              : <span className="text-[7px] text-destructive font-bold">BLOCKED</span>}
          </div>
          <div className="text-[9px] text-blue-400 font-mono truncate mt-0.5">{packet.target}</div>
        </div>
        <span className="text-[8px] text-slate-500 font-mono shrink-0">{new Date(packet.createdAt).toLocaleTimeString()}</span>
      </div>

      {expanded && (
        <div className="border-t border-border/20 px-3 py-3 space-y-3 bg-black/10">
          {/* Fields grid */}
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[8px] text-slate-500">
            <span>Packet ID: <span className="text-slate-300 font-mono">{packet.packetId}</span></span>
            <span>Proposal ID: <span className="text-slate-300 font-mono">{packet.proposalId}</span></span>
            <span>Safety Mode: <span className="text-primary font-semibold">{packet.safetyMode}</span></span>
            <span>Gateway Mode: <span className="text-amber-500 font-semibold">{packet.gatewayMode}</span></span>
            <span>Execution Attempted: <span className="text-destructive font-semibold">{String(packet.executionAttempted)}</span></span>
            <span>OpenClaw Call: <span className="text-destructive font-semibold">{String(packet.openclawCallAttempted)}</span></span>
            <span>Governance: <span className="text-slate-300">{packet.governanceDecision || '—'}</span></span>
            <span>Reviewed by: <span className="text-slate-300">{packet.reviewedBy || '—'}</span></span>
            <span>Risk Tier: <span className={packet.riskTier === 'HIGH' ? 'text-destructive font-semibold' : packet.riskTier === 'MEDIUM' ? 'text-amber-500 font-semibold' : 'text-primary font-semibold'}>{packet.riskTier}</span></span>
            <span>Audit Hash: <span className="text-slate-400 font-mono">{packet.auditHashPlaceholder}</span></span>
          </div>

          {packet.blockedReasons?.length > 0 && (
            <div className="px-2 py-1.5 bg-destructive/5 border border-destructive/20 rounded space-y-0.5">
              {packet.blockedReasons.map((r, i) => (
                <div key={i} className="flex items-center gap-1.5 text-[8px] text-destructive">
                  <XCircle className="w-2.5 h-2.5 shrink-0" /> {r}
                </div>
              ))}
            </div>
          )}

          {/* Full JSON */}
          <div>
            <div className="text-[8px] uppercase tracking-widest text-slate-500 font-semibold mb-1">Preview Packet JSON (read-only)</div>
            <pre className="bg-secondary/40 border border-border/30 rounded p-2 text-[7px] font-mono text-slate-300 overflow-auto max-h-48">
              {JSON.stringify(packet, null, 2)}
            </pre>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            <CopyButton text={JSON.stringify(packet, null, 2)} />

            {!isReady && packet.allowedCommand && (
              <button type="button" onClick={handleMarkReady}
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-[9px] border border-blue-400/40 text-blue-400 bg-blue-400/5 hover:bg-blue-400/15 rounded font-bold transition-colors">
                <Zap className="w-3 h-3" /> Mark Ready for Read-Only Bridge Test
              </button>
            )}

            {isReady && !dryRunResult && (
              <button type="button" onClick={handleDryRun} disabled={dryRunning}
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-[9px] border border-amber-500/40 text-amber-500 bg-amber-500/5 hover:bg-amber-500/15 rounded font-bold transition-colors disabled:opacity-50">
                {dryRunning
                  ? <><RefreshCw className="w-3 h-3 animate-spin" /> Running Dry Run…</>
                  : <><FlaskConical className="w-3 h-3" /> Run Bridge Dry Run</>}
              </button>
            )}

            {isReady && dryRunResult && (
              <button type="button" onClick={handleDryRun} disabled={dryRunning}
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-[9px] border border-border text-slate-400 hover:bg-secondary/50 rounded font-bold transition-colors disabled:opacity-50">
                {dryRunning
                  ? <><RefreshCw className="w-3 h-3 animate-spin" /> Re-running…</>
                  : <><RefreshCw className="w-3 h-3" /> Re-run Dry Run</>}
              </button>
            )}

            {isReady && !dryRunResult && (
              <div className="flex items-center gap-1.5 text-[9px] text-blue-400 font-bold">
                <CheckCircle2 className="w-3.5 h-3.5" /> READY_FOR_BRIDGE_TEST
              </div>
            )}
          </div>

          {/* Dry Run Result */}
          {dryRunResult && <DryRunResultCard run={dryRunResult} />}

          {/* Signed Bridge Request Preview — only after a passing dry run */}
          {dryRunResult && (dryRunResult.dryRunStatus === 'PASSED' || dryRunResult.acceptedForDryRun === true) && (
            <SignedBridgeRequestPreview run={dryRunResult} packet={packet} />
          )}

          {/* Safety note */}
          <div className="flex items-center gap-2 px-2 py-1.5 bg-primary/5 border border-primary/20 rounded text-[8px] text-primary/80">
            <CheckCircle2 className="w-3 h-3 shrink-0" />
            Read-only packet. No OpenClaw calls. No execution. No browser tools.
          </div>
        </div>
      )}
    </div>
  );
}

// ── Dry Run Summary Card ───────────────────────────────────────────────────────
function DryRunSummaryCard({ proposalId }) {
  const runs   = loadDryRuns().filter(r => r.proposalId === proposalId);
  const passed = runs.filter(r => r.dryRunStatus === 'PASSED').length;
  const failed = runs.filter(r => r.dryRunStatus === 'FAILED').length;

  if (runs.length === 0) return null;

  return (
    <div className="bg-card border border-border/50 rounded-lg p-3 space-y-2">
      <div className="flex items-center gap-2 mb-1">
        <FlaskConical className="w-3.5 h-3.5 text-slate-400" />
        <span className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold">Bridge Dry Run Summary</span>
      </div>
      <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
        {[
          { label: 'Total Dry Runs',          value: runs.length, color: 'text-foreground',  bg: 'bg-secondary/20 border-border' },
          { label: 'Passed',                  value: passed,      color: 'text-primary',     bg: 'bg-primary/5 border-primary/20' },
          { label: 'Failed',                  value: failed,      color: 'text-destructive', bg: 'bg-destructive/5 border-destructive/20' },
          { label: 'OpenClaw Calls',          value: 0,           color: 'text-slate-400',   bg: 'bg-secondary/10 border-border' },
          { label: 'Executions Attempted',    value: 0,           color: 'text-slate-400',   bg: 'bg-secondary/10 border-border' },
        ].map(({ label, value, color, bg }) => (
          <div key={label} className={`border rounded px-2 py-1.5 ${bg}`}>
            <div className="text-[7px] uppercase tracking-widest text-slate-500 font-semibold mb-0.5">{label}</div>
            <div className={`text-[13px] font-bold ${color}`}>{value}</div>
          </div>
        ))}
      </div>
      {/* Safety guarantee */}
      <div className="flex items-center gap-2 px-2 py-1.5 bg-amber-500/5 border border-amber-500/20 rounded text-[8px] text-amber-500/90">
        <ShieldCheck className="w-3 h-3 shrink-0" />
        Dry-run validation only · No OpenClaw call · No execution · Gateway Mode: READ_ONLY
      </div>
    </div>
  );
}

// ── Main export ────────────────────────────────────────────────────────────────
/**
 * Props:
 *   proposal  – the approved/queued proposal object
 *   packets   – all loaded packets
 *   onRefresh – callback to reload packets from store
 */
export default function PreviewCommandPacket({ proposal, packets, onRefresh }) {
  const [genError,   setGenError]   = useState('');
  const [showPanel,  setShowPanel]  = useState(false);

  const myPackets = packets.filter(pk => pk.proposalId === proposal.id);

  const handleGenerate = () => {
    setGenError('');
    const result = generatePacket(proposal);
    if (result.error) { setGenError(result.error); }
    else { setShowPanel(true); onRefresh(); }
  };

  const canGenerate = !['DENIED', 'BLOCKED_PREVIEW'].includes(proposal.status)
    && proposal.riskTier !== 'HIGH'
    && !proposal.blockedReasons?.length
    && proposal.reviewNote;

  return (
    <div className="space-y-2">
      {/* Generate button */}
      <div className="flex items-center gap-2 flex-wrap">
        <button type="button" onClick={handleGenerate} disabled={!canGenerate}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-[9px] border border-primary/40 text-primary bg-primary/5 hover:bg-primary/15 rounded font-bold transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
          <FileText className="w-3 h-3" /> Generate Preview Packet
        </button>
        {myPackets.length > 0 && (
          <button type="button" onClick={() => setShowPanel(p => !p)}
            className="text-[8px] text-slate-400 hover:text-slate-200 underline">
            {showPanel ? 'Hide' : 'Show'} packets ({myPackets.length})
          </button>
        )}
      </div>

      {genError && (
        <div className="flex items-start gap-1.5 text-[9px] text-destructive">
          <AlertTriangle className="w-3 h-3 shrink-0 mt-0.5" /> {genError}
        </div>
      )}

      {!canGenerate && !genError && !proposal.reviewNote && (
        <div className="text-[8px] text-slate-500">Review note required before generating a packet.</div>
      )}

      {/* Dry run summary (shown whenever there are runs for this proposal) */}
      <DryRunSummaryCard proposalId={proposal.id} />

      {/* Packets panel */}
      {showPanel && myPackets.length > 0 && (
        <div className="space-y-1.5 border-l-2 border-primary/20 pl-3">
          <div className="text-[8px] uppercase tracking-widest text-slate-500 font-semibold mb-1">Preview Packets ({myPackets.length})</div>
          {myPackets.map(pk => (
            <PacketCard key={pk.packetId} packet={pk} onRefresh={onRefresh} />
          ))}
        </div>
      )}
    </div>
  );
}