import React, { useState, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { Zap, CheckCircle2, AlertTriangle, Loader2, X } from 'lucide-react';

function generateHash(data) {
  const str = JSON.stringify(data);
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) - h) + str.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h).toString(16).padStart(8, '0');
}

export default function OpenClawTaskPreviewSender({ task }) {
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const canSend = task && 
    ['APPROVED_PREVIEW', 'REVIEW_READY'].includes(task.approvalState) &&
    task.riskLevel === 'LOW' &&
    task.executionStatus === 'NOT_EXECUTED' &&
    task.dispatchStatus === 'NOT_DISPATCHED' &&
    task.filesystemWrite === 'DISABLED';

  const handleSendToPreview = useCallback(async () => {
    if (!canSend || !task) return;

    setSending(true);
    setError(null);
    setResult(null);

    try {
      const response = await base44.functions.invoke('openclawTaskPreviewBridge', {
        taskId: task.taskId,
        taskData: task,
      });

      const data = response.data || {};
      const ts = new Date().toISOString();

      // Save audit record
      const auditRecord = {
        bridgeAuditId: `AUDIT-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
        taskId: task.taskId,
        taskType: task.taskType,
        createdAt: ts,
        requestHash: generateHash({ taskId: task.taskId, taskType: task.taskType, ts }),
        responseHash: data.responseHash || '',
        approvalState: task.approvalState,
        bridgeStatus: data.bridgeStatus,
        resultStatus: data.resultStatus,
        executionStatus: data.executionStatus,
        dispatchStatus: data.dispatchStatus,
        filesystemWrite: data.filesystemWrite,
        tokenExposed: data.tokenExposed,
      };

      try {
        const stored = JSON.parse(localStorage.getItem('veridan_openclaw_task_bridge_history') || '[]');
        stored.unshift(auditRecord);
        if (stored.length > 20) stored.length = 20;
        localStorage.setItem('veridan_openclaw_task_bridge_history', JSON.stringify(stored));
      } catch { /* quota */ }

      setResult(data);
    } catch (err) {
      setError(err.message || 'Bridge request failed');
    } finally {
      setSending(false);
    }
  }, [task, canSend]);

  if (!task) return null;

  return (
    <div className="space-y-3">
      {/* Send button */}
      <button
        type="button"
        onClick={handleSendToPreview}
        disabled={!canSend || sending}
        className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-sm font-bold uppercase tracking-widest text-[9px] transition-colors border ${
          canSend && !sending
            ? 'bg-primary/15 border-primary/40 text-primary hover:bg-primary/25'
            : 'bg-secondary/20 border-border/30 text-slate-500'
        }`}
      >
        {sending ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" /> Sending to OpenClaw...
          </>
        ) : (
          <>
            <Zap className="w-4 h-4" /> Send to OpenClaw Preview
          </>
        )}
      </button>

      {/* Error message */}
      {error && (
        <div className="bg-destructive/10 border border-destructive/30 rounded-sm p-3 text-[8px] text-destructive font-mono space-y-1">
          <div className="font-bold flex items-center gap-2">
            <X className="w-3 h-3" /> Error
          </div>
          <div>{error}</div>
        </div>
      )}

      {/* Result */}
      {result && (
        <div className={`rounded-sm p-4 space-y-3 border ${
          result.bridgeStatus === 'ACCEPTED_PREVIEW_BRIDGE'
            ? 'border-primary/30 bg-primary/5'
            : 'border-destructive/30 bg-destructive/5'
        }`}>
          <div className="flex items-center gap-2">
            {result.bridgeStatus === 'ACCEPTED_PREVIEW_BRIDGE' ? (
              <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            )}
            <div className="text-[9px] font-bold uppercase tracking-widest">
              {result.bridgeStatus === 'ACCEPTED_PREVIEW_BRIDGE' ? 'Preview Bridge Accepted' : 'Preview Bridge Response'}
            </div>
          </div>

          {/* Status details */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[8px] font-mono">
            {[
              ['bridgeStatus', result.bridgeStatus],
              ['resultStatus', result.resultStatus],
              ['executionStatus', result.executionStatus, 'text-destructive'],
              ['dispatchStatus', result.dispatchStatus, 'text-destructive'],
              ['filesystemWrite', result.filesystemWrite, 'text-destructive'],
              ['browserAutomation', result.browserAutomation, 'text-destructive'],
              ['brokerAction', result.brokerAction, 'text-destructive'],
              ['tokenExposed', result.tokenExposed ? 'true' : 'false', 'text-destructive'],
            ].map(([label, value, color]) => (
              <div key={label} className="bg-secondary/20 border border-border/30 rounded-sm px-2 py-1.5">
                <div className="text-[7px] text-slate-500 uppercase mb-0.5">{label}</div>
                <div className={`text-[7px] font-bold font-mono ${color || 'text-primary'}`}>{value}</div>
              </div>
            ))}
          </div>

          {/* OpenClaw response preview */}
          {result.openclawResponsePreview && (
            <div className="border border-border/30 bg-secondary/20 rounded-sm p-3 text-[7px] font-mono text-slate-400 space-y-1">
              <div className="font-bold text-slate-300">OpenClaw Response Preview:</div>
              <pre className="whitespace-pre-wrap break-words">
                {JSON.stringify(result.openclawResponsePreview, null, 2)}
              </pre>
            </div>
          )}

          {/* Audit info */}
          <div className="text-[7px] text-slate-500 font-mono space-y-0.5 pt-2 border-t border-border/20">
            <div>taskId: <span className="text-slate-300">{result.taskId}</span></div>
            <div>requestHash: <span className="text-slate-300">{result.requestHash}</span></div>
            <div>responseHash: <span className="text-slate-300">{result.responseHash}</span></div>
            <div>createdAt: <span className="text-slate-300">{new Date(result.createdAt).toLocaleString()}</span></div>
          </div>

          <div className="text-[7px] text-slate-500 italic pt-2">
            ✓ This is a preview-only bridge. No execution, no file writes, no real OpenClaw activation.
          </div>
        </div>
      )}

      {/* Disabled reason */}
      {!canSend && !result && (
        <div className="text-[7px] text-slate-500 font-mono p-2 border border-border/20 rounded-sm bg-secondary/10">
          Send disabled: task must have approvalState=APPROVED_PREVIEW|REVIEW_READY, riskLevel=LOW, executionStatus=NOT_EXECUTED, dispatchStatus=NOT_DISPATCHED, filesystemWrite=DISABLED
        </div>
      )}
    </div>
  );
}