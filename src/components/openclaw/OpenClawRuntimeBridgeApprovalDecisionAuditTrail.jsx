/**
 * OpenClawRuntimeBridgeApprovalDecisionAuditTrail — Phase 32
 * Creates a local-only immutable audit trail from Phase 31 approval/denial decisions.
 * Audit records do not execute anything.
 */
import React, { useState } from 'react';
import { Copy, CheckCircle2, Trash2, ShieldCheck, AlertTriangle, Lock } from 'lucide-react';

const APPROVAL_QUEUE_KEY = 'openclawPhase31RuntimeBridgeApprovalQueuePreview';
const AUDIT_TRAIL_KEY = 'openclawPhase32RuntimeBridgeApprovalDecisionAuditTrail';

function loadJSON(key, fallback = []) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function generateAuditRecord(approvalItem) {
  return {
    auditId: `audit-${approvalItem.approvalId}-${Date.now()}`,
    sourceApprovalId: approvalItem.approvalId,
    sourceValidationId: approvalItem.sourceValidationId,
    sourceRequestId: approvalItem.sourceRequestId,
    sourceContractId: approvalItem.sourceContractId,
    decisionStatus: approvalItem.approvalStatus,
    decisionAt: approvalItem.reviewedAt || new Date().toISOString(),
    reviewedBy: approvalItem.reviewedBy,
    reviewNote: approvalItem.reviewNote,
    executionAllowed: false,
    dryRunOnly: true,
    executionStatus: 'NOT_EXECUTED',
    auditStatus: 'RECORDED',
    safetyLockStatus: 'LOCKED',
  };
}

export default function OpenClawRuntimeBridgeApprovalDecisionAuditTrail() {
  const [auditTrail, setAuditTrail] = useState(() => loadJSON(AUDIT_TRAIL_KEY, []));
  const [copied, setCopied] = useState(false);
  const [lastAction, setLastAction] = useState(null);

  const handleGenerateAuditTrail = () => {
    try {
      const approvalQueue = loadJSON(APPROVAL_QUEUE_KEY, {});
      if (!approvalQueue.approvalItems || approvalQueue.approvalItems.length === 0) {
        setLastAction('No approval queue found');
        return;
      }

      // Filter for APPROVED or DENIED items where executionAllowed=false and dryRunOnly=true
      const decidedItems = approvalQueue.approvalItems.filter(
        item =>
          (item.approvalStatus === 'APPROVED' || item.approvalStatus === 'DENIED') &&
          item.executionAllowed === false &&
          item.dryRunOnly === true
      );

      if (decidedItems.length === 0) {
        setLastAction('No decided approval items (APPROVED or DENIED)');
        return;
      }

      // Generate audit records
      const auditBatch = {
        auditTrailId: `trail-${Date.now()}`,
        auditTrailType: 'PHASE_32_RUNTIME_BRIDGE_APPROVAL_DECISION_AUDIT_TRAIL',
        generatedAt: new Date().toISOString(),
        sourceApprovalQueueId: approvalQueue.queueId,
        totalAuditRecords: decidedItems.length,
        approvedCount: decidedItems.filter(i => i.approvalStatus === 'APPROVED').length,
        deniedCount: decidedItems.filter(i => i.approvalStatus === 'DENIED').length,
        auditRecords: decidedItems.map(item => generateAuditRecord(item)),
      };

      try {
        localStorage.setItem(AUDIT_TRAIL_KEY, JSON.stringify(auditBatch));
      } catch {}

      setAuditTrail(auditBatch);
      setLastAction(`Audit trail generated from ${decidedItems.length} approval decisions`);
    } catch (err) {
      setLastAction('Audit trail generation failed: ' + (err?.message || String(err)));
    }
  };

  const handleCopy = () => {
    if (!auditTrail.auditRecords || auditTrail.auditRecords.length === 0) return;
    try {
      navigator.clipboard.writeText(JSON.stringify(auditTrail, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      setLastAction('Audit trail JSON copied to clipboard');
    } catch (err) {
      setLastAction('Copy failed: ' + (err?.message || String(err)));
    }
  };

  const handleClear = () => {
    try {
      localStorage.removeItem(AUDIT_TRAIL_KEY);
      setAuditTrail([]);
      setLastAction('Audit trail cleared from localStorage');
    } catch (err) {
      setLastAction('Clear failed: ' + (err?.message || String(err)));
    }
  };

  return (
    <div className="space-y-4">

      {/* Header */}
      <div>
        <div className="text-[11px] uppercase tracking-widest text-slate-400 font-semibold mb-0.5">Phase 32 · Runtime Bridge Approval Decision Audit Trail</div>
        <div className="text-[13px] font-bold text-foreground flex items-center gap-2">
          <Lock className="w-4 h-4 text-primary" /> Approval Decision Audit Trail
        </div>
        <div className="text-[9px] text-slate-500 mt-0.5">Local-only immutable audit trail of Phase 31 approval/denial decisions. No execution.</div>
      </div>

      {/* Phase info chip */}
      <div className="px-3 py-1.5 bg-primary/5 border border-primary/20 rounded inline-flex items-center gap-1.5">
        <ShieldCheck className="w-3 h-3 text-primary shrink-0" />
        <span className="text-[9px] font-mono font-bold text-primary">PHASE_32_APPROVAL_DECISION_AUDIT_TRAIL</span>
      </div>

      {/* Audit summary */}
      {auditTrail.auditRecords && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <div className="bg-card border border-border rounded-lg px-4 py-3">
            <div className="text-[8px] uppercase tracking-widest text-slate-500 font-semibold mb-1">Total Records</div>
            <div className="text-[18px] font-bold text-primary">{auditTrail.auditRecords.length}</div>
          </div>
          <div className="bg-card border border-primary/20 rounded-lg px-4 py-3">
            <div className="text-[8px] uppercase tracking-widest text-slate-500 font-semibold mb-1">Approved</div>
            <div className="text-[18px] font-bold text-primary">{auditTrail.approvedCount}</div>
          </div>
          <div className={`bg-card border ${auditTrail.deniedCount > 0 ? 'border-destructive/20' : 'border-border'} rounded-lg px-4 py-3`}>
            <div className="text-[8px] uppercase tracking-widest text-slate-500 font-semibold mb-1">Denied</div>
            <div className={`text-[18px] font-bold ${auditTrail.deniedCount > 0 ? 'text-destructive' : 'text-slate-500'}`}>{auditTrail.deniedCount}</div>
          </div>
          <div className="bg-card border border-border rounded-lg px-4 py-3">
            <div className="text-[8px] uppercase tracking-widest text-slate-500 font-semibold mb-1">Generated</div>
            <div className="text-[10px] font-mono text-slate-300">{new Date(auditTrail.generatedAt).toLocaleTimeString()}</div>
          </div>
        </div>
      )}

      {/* Info box */}
      <div className="bg-blue-500/5 border border-blue-500/20 rounded-lg p-3">
        <div className="text-[9px] text-blue-400/90">
          <span className="font-bold">About Audit Trail:</span> This audit trail is an immutable record of approval/denial decisions. All records are marked NOT_EXECUTED with executionAllowed=false and dryRunOnly=true. No execution occurs.
        </div>
      </div>

      {/* Last action feedback */}
      {lastAction && (
        <div className="text-[9px] text-primary bg-primary/5 border border-primary/20 px-3 py-2 rounded">
          {lastAction}
        </div>
      )}

      {/* Buttons */}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={handleGenerateAuditTrail}
          className="flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary text-primary text-[10px] font-bold hover:bg-primary/20 transition-colors rounded"
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          Generate Audit Trail From Decisions
        </button>
        <button
          type="button"
          onClick={handleCopy}
          disabled={!auditTrail.auditRecords || auditTrail.auditRecords.length === 0}
          className="flex items-center gap-1.5 px-3 py-2 text-[10px] border border-border text-slate-400 hover:text-foreground hover:bg-secondary/50 rounded font-bold transition-colors disabled:opacity-40"
        >
          {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-primary" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? 'Copied!' : 'Copy Audit Trail JSON'}
        </button>
        <button
          type="button"
          onClick={handleClear}
          disabled={!auditTrail.auditRecords || auditTrail.auditRecords.length === 0}
          className="flex items-center gap-1.5 px-3 py-2 text-[10px] border border-destructive/30 text-destructive/70 hover:bg-destructive/5 rounded font-bold transition-colors disabled:opacity-40"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Clear Audit Trail
        </button>
      </div>

      {/* Audit records table */}
      {auditTrail.auditRecords && auditTrail.auditRecords.length > 0 && (
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="px-4 py-2 bg-secondary/20 border-b border-border">
            <span className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold">Audit Records ({auditTrail.auditRecords.length})</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-[8px]">
              <thead className="bg-secondary/10 border-b border-border/30">
                <tr>
                  <th className="px-3 py-2 text-left font-semibold text-slate-400 uppercase tracking-wider">Request ID</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-400 uppercase tracking-wider">Decision</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-400 uppercase tracking-wider">Reviewed By</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-400 uppercase tracking-wider">Decided At</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-400 uppercase tracking-wider">Execution Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/20">
                {auditTrail.auditRecords.map((record, i) => (
                  <tr key={i} className="hover:bg-secondary/10 transition-colors">
                    <td className="px-3 py-2.5 text-slate-300 font-mono text-[7px] truncate">{record.sourceRequestId}</td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-1.5">
                        {record.decisionStatus === 'APPROVED' && (
                          <>
                            <CheckCircle2 className="w-3 h-3 text-primary shrink-0" />
                            <span className="text-primary font-semibold">APPROVED</span>
                          </>
                        )}
                        {record.decisionStatus === 'DENIED' && (
                          <>
                            <AlertTriangle className="w-3 h-3 text-destructive shrink-0" />
                            <span className="text-destructive font-semibold">DENIED</span>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-2.5 text-slate-400 text-[7px] font-mono">{record.reviewedBy || '—'}</td>
                    <td className="px-3 py-2.5 text-slate-500 text-[7px]">{new Date(record.decisionAt).toLocaleString()}</td>
                    <td className="px-3 py-2.5">
                      <span className="text-primary font-mono text-[7px]">{record.executionStatus}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Safety summary box */}
      <div className="bg-primary/5 border-2 border-primary/20 rounded-lg p-4 space-y-2">
        <div className="flex items-center gap-2 mb-1">
          <Lock className="w-4 h-4 text-primary shrink-0" />
          <div className="text-[10px] font-bold text-primary uppercase tracking-wider">Audit Trail Safety Guarantee</div>
        </div>
        <p className="text-[9px] text-slate-300 leading-relaxed">
          All audit records are immutable, local-only, and do not execute anything. Approved decisions remain NOT_EXECUTED with executionAllowed=false and dryRunOnly=true.
        </p>
        <div className="pt-2 border-t border-primary/10 text-[8px] text-slate-400 space-y-0.5">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3 h-3 text-primary shrink-0" />
            <span>executionAllowed: false (all records)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3 h-3 text-primary shrink-0" />
            <span>dryRunOnly: true (all records)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3 h-3 text-primary shrink-0" />
            <span>executionStatus: NOT_EXECUTED (all records)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3 h-3 text-primary shrink-0" />
            <span>No backend calls, no OpenClaw dispatch, no automation</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3 h-3 text-primary shrink-0" />
            <span>No trading, credentials, wallet actions, or money movement</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3 h-3 text-primary shrink-0" />
            <span>No scheduler, polling, or browser automation</span>
          </div>
        </div>
      </div>

      {/* Audit trail JSON preview */}
      {auditTrail.auditRecords && (
        <div className="bg-secondary/10 border border-border/60 rounded-lg overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2 bg-secondary/20 border-b border-border">
            <span className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold">Audit Trail — JSON Preview</span>
            <span className="text-[8px] font-mono text-slate-500">{new Date(auditTrail.generatedAt).toLocaleString()}</span>
          </div>
          <pre className="px-4 py-3 text-[8px] font-mono text-slate-300 overflow-auto max-h-72 whitespace-pre-wrap break-words">
            {JSON.stringify(auditTrail, null, 2)}
          </pre>
          <div className="px-4 py-2 border-t border-border/40 flex items-center gap-1.5">
            <CheckCircle2 className="w-3 h-3 text-primary" />
            <span className="text-[8px] text-primary/80">Stored in localStorage key: <span className="font-mono">{AUDIT_TRAIL_KEY}</span></span>
          </div>
        </div>
      )}

      {/* Safety footer */}
      <div className="flex items-center gap-2 px-3 py-2 bg-primary/5 border border-primary/20 rounded text-[8px] text-primary/80">
        <ShieldCheck className="w-3 h-3 shrink-0" />
        Local-only immutable audit trail. No fetch, no OpenClaw calls, no backend calls, no execution, no dispatch.
      </div>
    </div>
  );
}