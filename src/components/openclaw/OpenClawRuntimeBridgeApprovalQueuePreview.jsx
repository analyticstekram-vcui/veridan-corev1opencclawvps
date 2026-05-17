/**
 * OpenClawRuntimeBridgeApprovalQueuePreview — Phase 31
 * Shows Phase 30 PASS validation results as local-only approval queue items.
 * Approval is preview-only. No execution, no backend calls, no dispatch.
 */
import React, { useState } from 'react';
import { Copy, CheckCircle2, Trash2, ShieldCheck, AlertTriangle, XCircle, ThumbsUp, ThumbsDown, ChevronDown } from 'lucide-react';

const VALIDATION_RESULTS_KEY = 'openclawPhase30RuntimeBridgeContractValidationResults';
const APPROVAL_QUEUE_KEY = 'openclawPhase31RuntimeBridgeApprovalQueuePreview';

function loadJSON(key, fallback = []) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function convertValidationToApprovalItem(validationResult) {
  return {
    approvalId: `approval-${validationResult.sourceRequestId}-${Date.now()}`,
    sourceValidationId: validationResult.validationId,
    sourceRequestId: validationResult.sourceRequestId,
    sourceContractId: validationResult.sourceContractId,
    approvalStatus: 'PENDING',
    approvalRequired: true,
    executionAllowed: false,
    dryRunOnly: true,
    createdAt: new Date().toISOString(),
    reviewedAt: null,
    reviewedBy: null,
    reviewNote: null,
  };
}

export default function OpenClawRuntimeBridgeApprovalQueuePreview() {
  const [queue, setQueue] = useState(() => loadJSON(APPROVAL_QUEUE_KEY, []));
  const [expandedItem, setExpandedItem] = useState(null);
  const [copied, setCopied] = useState(false);
  const [lastAction, setLastAction] = useState(null);
  const [reviewInput, setReviewInput] = useState('');

  const handleBuildQueue = () => {
    try {
      const validationBatches = loadJSON(VALIDATION_RESULTS_KEY, []);
      if (validationBatches.length === 0) {
        setLastAction('No validation batches found');
        return;
      }

      const latestBatch = validationBatches[0];
      if (!latestBatch.validationResults) {
        setLastAction('No validation results in latest batch');
        return;
      }

      // Filter for PASS + LOCKED + NOT_EXECUTED
      const eligibleResults = latestBatch.validationResults.filter(
        r =>
          r.validationStatus === 'PASS' &&
          r.safetyLockStatus === 'LOCKED' &&
          r.executionStatus === 'NOT_EXECUTED'
      );

      if (eligibleResults.length === 0) {
        setLastAction('No eligible validation results (must be PASS + LOCKED + NOT_EXECUTED)');
        return;
      }

      // Convert to approval items
      const newQueue = {
        queueId: `queue-${Date.now()}`,
        queueType: 'PHASE_31_RUNTIME_BRIDGE_APPROVAL_QUEUE_PREVIEW',
        builtAt: new Date().toISOString(),
        sourceValidationBatchId: latestBatch.batchId,
        totalApprovalItems: eligibleResults.length,
        approvalItems: eligibleResults.map(r => convertValidationToApprovalItem(r)),
      };

      try {
        localStorage.setItem(APPROVAL_QUEUE_KEY, JSON.stringify(newQueue));
      } catch {}

      setQueue(newQueue);
      setLastAction(`Approval queue built from ${eligibleResults.length} PASS validations`);
    } catch (err) {
      setLastAction('Queue build failed: ' + (err?.message || String(err)));
    }
  };

  const handleApproveItem = (itemIndex) => {
    if (!queue.approvalItems) return;
    try {
      const updated = { ...queue };
      updated.approvalItems[itemIndex].approvalStatus = 'APPROVED';
      updated.approvalItems[itemIndex].reviewedAt = new Date().toISOString();
      updated.approvalItems[itemIndex].reviewedBy = 'operator@example.com';
      updated.approvalItems[itemIndex].reviewNote = reviewInput || 'Approved by operator';
      try {
        localStorage.setItem(APPROVAL_QUEUE_KEY, JSON.stringify(updated));
      } catch {}
      setQueue(updated);
      setReviewInput('');
      setExpandedItem(null);
      setLastAction(`Item ${queue.approvalItems[itemIndex].sourceRequestId} marked APPROVED (local-only, no execution)`);
    } catch (err) {
      setLastAction('Approval failed: ' + (err?.message || String(err)));
    }
  };

  const handleDenyItem = (itemIndex) => {
    if (!queue.approvalItems) return;
    try {
      const updated = { ...queue };
      updated.approvalItems[itemIndex].approvalStatus = 'DENIED';
      updated.approvalItems[itemIndex].reviewedAt = new Date().toISOString();
      updated.approvalItems[itemIndex].reviewedBy = 'operator@example.com';
      updated.approvalItems[itemIndex].reviewNote = reviewInput || 'Denied by operator';
      try {
        localStorage.setItem(APPROVAL_QUEUE_KEY, JSON.stringify(updated));
      } catch {}
      setQueue(updated);
      setReviewInput('');
      setExpandedItem(null);
      setLastAction(`Item ${queue.approvalItems[itemIndex].sourceRequestId} marked DENIED (local-only, no execution)`);
    } catch (err) {
      setLastAction('Denial failed: ' + (err?.message || String(err)));
    }
  };

  const handleCopy = () => {
    if (!queue.approvalItems || queue.approvalItems.length === 0) return;
    try {
      navigator.clipboard.writeText(JSON.stringify(queue, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      setLastAction('Approval queue JSON copied to clipboard');
    } catch (err) {
      setLastAction('Copy failed: ' + (err?.message || String(err)));
    }
  };

  const handleClear = () => {
    try {
      localStorage.removeItem(APPROVAL_QUEUE_KEY);
      setQueue([]);
      setLastAction('Approval queue cleared from localStorage');
    } catch (err) {
      setLastAction('Clear failed: ' + (err?.message || String(err)));
    }
  };

  const pendingCount = queue.approvalItems ? queue.approvalItems.filter(i => i.approvalStatus === 'PENDING').length : 0;
  const approvedCount = queue.approvalItems ? queue.approvalItems.filter(i => i.approvalStatus === 'APPROVED').length : 0;
  const deniedCount = queue.approvalItems ? queue.approvalItems.filter(i => i.approvalStatus === 'DENIED').length : 0;

  return (
    <div className="space-y-4">

      {/* Header */}
      <div>
        <div className="text-[11px] uppercase tracking-widest text-slate-400 font-semibold mb-0.5">Phase 31 · Runtime Bridge Approval Queue</div>
        <div className="text-[13px] font-bold text-foreground flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-primary" /> Runtime Bridge Approval Queue Preview
        </div>
        <div className="text-[9px] text-slate-500 mt-0.5">Local-only approval queue from Phase 30 PASS validations. Approval does not execute anything.</div>
      </div>

      {/* Phase info chip */}
      <div className="px-3 py-1.5 bg-primary/5 border border-primary/20 rounded inline-flex items-center gap-1.5">
        <ShieldCheck className="w-3 h-3 text-primary shrink-0" />
        <span className="text-[9px] font-mono font-bold text-primary">PHASE_31_APPROVAL_QUEUE_PREVIEW</span>
      </div>

      {/* Queue summary */}
      {queue.approvalItems && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <div className="bg-card border border-border rounded-lg px-4 py-3">
            <div className="text-[8px] uppercase tracking-widest text-slate-500 font-semibold mb-1">Total Items</div>
            <div className="text-[18px] font-bold text-primary">{queue.approvalItems.length}</div>
          </div>
          <div className="bg-card border border-border rounded-lg px-4 py-3">
            <div className="text-[8px] uppercase tracking-widest text-slate-500 font-semibold mb-1">Pending</div>
            <div className="text-[18px] font-bold text-amber-500">{pendingCount}</div>
          </div>
          <div className="bg-card border border-primary/20 rounded-lg px-4 py-3">
            <div className="text-[8px] uppercase tracking-widest text-slate-500 font-semibold mb-1">Approved</div>
            <div className="text-[18px] font-bold text-primary">{approvedCount}</div>
          </div>
          <div className={`bg-card border ${deniedCount > 0 ? 'border-destructive/20' : 'border-border'} rounded-lg px-4 py-3`}>
            <div className="text-[8px] uppercase tracking-widest text-slate-500 font-semibold mb-1">Denied</div>
            <div className={`text-[18px] font-bold ${deniedCount > 0 ? 'text-destructive' : 'text-slate-500'}`}>{deniedCount}</div>
          </div>
        </div>
      )}

      {/* Info box */}
      <div className="bg-amber-500/5 border border-amber-500/20 rounded-lg p-3">
        <div className="text-[9px] text-amber-500/90">
          <span className="font-bold">About Approval:</span> Approving an item means "operator reviewed it and found it acceptable for future consideration". Approval is <span className="font-semibold">local-only and does not execute anything</span>. executionAllowed remains false, dryRunOnly remains true.
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
          onClick={handleBuildQueue}
          className="flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary text-primary text-[10px] font-bold hover:bg-primary/20 transition-colors rounded"
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          Build Approval Queue From Validations
        </button>
        <button
          type="button"
          onClick={handleCopy}
          disabled={!queue.approvalItems || queue.approvalItems.length === 0}
          className="flex items-center gap-1.5 px-3 py-2 text-[10px] border border-border text-slate-400 hover:text-foreground hover:bg-secondary/50 rounded font-bold transition-colors disabled:opacity-40"
        >
          {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-primary" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? 'Copied!' : 'Copy Queue JSON'}
        </button>
        <button
          type="button"
          onClick={handleClear}
          disabled={!queue.approvalItems || queue.approvalItems.length === 0}
          className="flex items-center gap-1.5 px-3 py-2 text-[10px] border border-destructive/30 text-destructive/70 hover:bg-destructive/5 rounded font-bold transition-colors disabled:opacity-40"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Clear Queue
        </button>
      </div>

      {/* Approval queue table */}
      {queue.approvalItems && queue.approvalItems.length > 0 && (
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="px-4 py-2 bg-secondary/20 border-b border-border">
            <span className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold">Approval Queue Items ({queue.approvalItems.length})</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-[8px]">
              <thead className="bg-secondary/10 border-b border-border/30">
                <tr>
                  <th className="px-3 py-2 text-left font-semibold text-slate-400 uppercase tracking-wider">Request ID</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-400 uppercase tracking-wider">Status</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-400 uppercase tracking-wider">Reviewed By</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-400 uppercase tracking-wider">Created</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/20">
                {queue.approvalItems.map((item, i) => (
                  <tr key={i} className="hover:bg-secondary/10 transition-colors">
                    <td className="px-3 py-2.5 text-slate-300 font-mono text-[7px] truncate">{item.sourceRequestId}</td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-1.5">
                        {item.approvalStatus === 'PENDING' && (
                          <>
                            <div className="w-2 h-2 bg-amber-500 rounded-full" />
                            <span className="text-amber-500 font-semibold">PENDING</span>
                          </>
                        )}
                        {item.approvalStatus === 'APPROVED' && (
                          <>
                            <CheckCircle2 className="w-3 h-3 text-primary shrink-0" />
                            <span className="text-primary font-semibold">APPROVED</span>
                          </>
                        )}
                        {item.approvalStatus === 'DENIED' && (
                          <>
                            <XCircle className="w-3 h-3 text-destructive shrink-0" />
                            <span className="text-destructive font-semibold">DENIED</span>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-2.5 text-slate-400 text-[7px] font-mono">{item.reviewedBy || '—'}</td>
                    <td className="px-3 py-2.5 text-slate-500 text-[7px]">{new Date(item.createdAt).toLocaleString()}</td>
                    <td className="px-3 py-2.5">
                      {item.approvalStatus === 'PENDING' ? (
                        <button
                          type="button"
                          onClick={() => setExpandedItem(expandedItem === i ? null : i)}
                          className="flex items-center gap-1 text-primary hover:text-primary/80 transition-colors"
                        >
                          <span className="font-bold text-[7px]">REVIEW</span>
                          <ChevronDown className={`w-3 h-3 transition-transform ${expandedItem === i ? 'rotate-180' : ''}`} />
                        </button>
                      ) : (
                        <span className="text-slate-500 text-[7px] font-mono">{item.approvalStatus}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Expanded review form */}
      {queue.approvalItems && expandedItem !== null && queue.approvalItems[expandedItem]?.approvalStatus === 'PENDING' && (
        <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 space-y-3">
          <div className="text-[9px] font-semibold text-primary">
            Review — {queue.approvalItems[expandedItem].sourceRequestId}
          </div>
          <div>
            <label className="text-[8px] uppercase tracking-widest text-slate-500 font-semibold block mb-2">
              Review Note (optional)
            </label>
            <textarea
              value={reviewInput}
              onChange={(e) => setReviewInput(e.target.value)}
              placeholder="e.g., 'Reviewed and acceptable for next phase'"
              className="w-full px-3 py-2 text-[8px] bg-secondary border border-border rounded text-foreground placeholder-slate-500"
              rows="2"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => handleApproveItem(expandedItem)}
              className="flex items-center gap-1.5 px-3 py-2 text-[10px] bg-primary/10 border border-primary text-primary hover:bg-primary/20 rounded font-bold transition-colors"
            >
              <ThumbsUp className="w-3.5 h-3.5" />
              Approve (Local-Only)
            </button>
            <button
              type="button"
              onClick={() => handleDenyItem(expandedItem)}
              className="flex items-center gap-1.5 px-3 py-2 text-[10px] bg-destructive/10 border border-destructive/30 text-destructive hover:bg-destructive/20 rounded font-bold transition-colors"
            >
              <ThumbsDown className="w-3.5 h-3.5" />
              Deny (Local-Only)
            </button>
          </div>
          <div className="text-[8px] text-slate-400 italic">
            Approving or denying only updates local-only status. No execution, no backend calls, no dispatch.
          </div>
        </div>
      )}

      {/* Safety summary box */}
      <div className="bg-primary/5 border-2 border-primary/20 rounded-lg p-4 space-y-2">
        <div className="flex items-center gap-2 mb-1">
          <ShieldCheck className="w-4 h-4 text-primary shrink-0" />
          <div className="text-[10px] font-bold text-primary uppercase tracking-wider">Approval Safety Guarantee</div>
        </div>
        <p className="text-[9px] text-slate-300 leading-relaxed">
          Approval is local-only and does not execute anything. Approving an item means "operator reviewed it". It does not grant execution permission.
        </p>
        <div className="pt-2 border-t border-primary/10 text-[8px] text-slate-400 space-y-0.5">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3 h-3 text-primary shrink-0" />
            <span>executionAllowed: false (cannot be changed)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3 h-3 text-primary shrink-0" />
            <span>dryRunOnly: true (cannot be changed)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3 h-3 text-primary shrink-0" />
            <span>No backend calls, no OpenClaw dispatch, no automation triggered</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3 h-3 text-primary shrink-0" />
            <span>No trading, credentials, wallet actions, or money movement</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3 h-3 text-primary shrink-0" />
            <span>No scheduler, polling, or browser automation triggered</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3 h-3 text-primary shrink-0" />
            <span>Separate approval & authorization required for execution</span>
          </div>
        </div>
      </div>

      {/* Queue JSON preview */}
      {queue.approvalItems && (
        <div className="bg-secondary/10 border border-border/60 rounded-lg overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2 bg-secondary/20 border-b border-border">
            <span className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold">Approval Queue — JSON Preview</span>
            <span className="text-[8px] font-mono text-slate-500">{queue.builtAt ? new Date(queue.builtAt).toLocaleString() : '—'}</span>
          </div>
          <pre className="px-4 py-3 text-[8px] font-mono text-slate-300 overflow-auto max-h-72 whitespace-pre-wrap break-words">
            {JSON.stringify(queue, null, 2)}
          </pre>
          <div className="px-4 py-2 border-t border-border/40 flex items-center gap-1.5">
            <CheckCircle2 className="w-3 h-3 text-primary" />
            <span className="text-[8px] text-primary/80">Stored in localStorage key: <span className="font-mono">{APPROVAL_QUEUE_KEY}</span></span>
          </div>
        </div>
      )}

      {/* Safety footer */}
      <div className="flex items-center gap-2 px-3 py-2 bg-primary/5 border border-primary/20 rounded text-[8px] text-primary/80">
        <ShieldCheck className="w-3 h-3 shrink-0" />
        Local-only preview. No fetch, no OpenClaw calls, no backend calls, no execution, no dispatch, no credentials, no trading.
      </div>
    </div>
  );
}