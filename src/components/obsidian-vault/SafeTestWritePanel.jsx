/**
 * SafeTestWritePanel
 * Controlled safe test write — uses obsidianWriteApprovedDraft only.
 * Requires explicit operator approval before calling backend.
 * No OpenClaw · No browser automation · No trading · No unrestricted vault writes.
 */

import React, { useState } from 'react';
import { FlaskConical, CheckCircle2, XCircle, Loader2, Shield, AlertTriangle } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const TEST_FOLDER = 'Veridan Core/System Tests';
const TEST_FILENAME = 'bridge-health-test.md';
const TEST_FILE_PATH = `${TEST_FOLDER}/${TEST_FILENAME}`;

function buildTestDraft(timestamp) {
  const content = `# Obsidian Bridge Health Test

## Test Metadata
- **Timestamp:** ${timestamp}
- **Bridge Status:** BRIDGE_LIVE
- **Operator Approval:** GRANTED
- **Safety Label:** NOT_EXECUTED (vault write only — no OpenClaw, no browser, no trading)

## Purpose
This file was written by the Veridan Core safe test write flow to verify that the Obsidian bridge is live and the \`obsidianWriteApprovedDraft\` backend function is operational.

## Safety Constraints
- executionStatus: NOT_EXECUTED
- dispatchStatus: NOT_DISPATCHED
- openclawCall: NOT_SENT
- filesystemWrite: COMPLETED_APPROVED_DRAFT_ONLY
- riskLevel: LOW
- source: SAFE_TEST_WRITE

## Result
Bridge health test write completed successfully.
`;

  return {
    draftId: `TEST-${Date.now().toString(36).toUpperCase()}`,
    source: 'SAFE_TEST_WRITE',
    title: 'Obsidian Bridge Health Test',
    filename: TEST_FILENAME,
    category: 'system',
    targetFolder: TEST_FOLDER,
    content,
    draftType: 'CVP_SYSTEM_OVERVIEW',
    riskLevel: 'LOW',
    approvalStatus: 'APPROVED',
    approvalState: 'APPROVED_DRAFT',
    executionStatus: 'NOT_EXECUTED',
    dispatchStatus: 'NOT_DISPATCHED',
    openclawCall: 'NOT_SENT',
    filesystemWrite: 'DISABLED',
  };
}

export default function SafeTestWritePanel() {
  const [approvalChecked, setApprovalChecked] = useState(false);
  const [phase, setPhase] = useState('idle'); // idle | running | done | error
  const [result, setResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  const handleRunTestWrite = async () => {
    if (!approvalChecked) return;
    setPhase('running');
    setResult(null);
    setErrorMsg('');

    const timestamp = new Date().toISOString();
    const draft = buildTestDraft(timestamp);

    let response;
    try {
      response = await base44.functions.invoke('obsidianWriteApprovedDraft', { draft });
    } catch (err) {
      const reason = err?.response?.data?.error || err?.message || 'Backend error';
      setErrorMsg(reason);
      setPhase('error');

      // Save failure evidence locally
      try {
        const log = JSON.parse(localStorage.getItem('veridan_safe_test_writes') || '[]');
        log.unshift({ timestamp, status: 'WRITE_FAILED', filePath: TEST_FILE_PATH, reason });
        if (log.length > 20) log.length = 20;
        localStorage.setItem('veridan_safe_test_writes', JSON.stringify(log));
      } catch { /* quota */ }
      return;
    }

    if (response?.data?.success) {
      const filePath = response.data.filePath || TEST_FILE_PATH;
      setResult({ filePath, timestamp });
      setPhase('done');

      // Save success evidence locally
      try {
        const log = JSON.parse(localStorage.getItem('veridan_safe_test_writes') || '[]');
        log.unshift({ timestamp, status: 'WRITE_COMPLETED', filePath, auditId: response.data.auditRecord?.auditId });
        if (log.length > 20) log.length = 20;
        localStorage.setItem('veridan_safe_test_writes', JSON.stringify(log));
      } catch { /* quota */ }
    } else {
      const reason = response?.data?.error || 'Write returned failure';
      setErrorMsg(reason);
      setPhase('error');

      try {
        const log = JSON.parse(localStorage.getItem('veridan_safe_test_writes') || '[]');
        log.unshift({ timestamp, status: 'WRITE_FAILED', filePath: TEST_FILE_PATH, reason });
        if (log.length > 20) log.length = 20;
        localStorage.setItem('veridan_safe_test_writes', JSON.stringify(log));
      } catch { /* quota */ }
    }
  };

  const reset = () => {
    setPhase('idle');
    setResult(null);
    setErrorMsg('');
    setApprovalChecked(false);
  };

  return (
    <div className="border-2 border-primary/40 bg-primary/5 rounded-sm overflow-hidden font-mono">

      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-primary/20 bg-primary/10 flex-wrap gap-y-1">
        <FlaskConical className="w-4 h-4 text-primary" />
        <span className="text-[11px] font-bold uppercase tracking-widest text-primary">Safe Test Write</span>
        <div className="ml-auto flex flex-wrap gap-1.5">
          <span className="px-2 py-0.5 text-[6px] font-bold uppercase border border-primary/30 text-primary/70 rounded-sm">BRIDGE_LIVE REQUIRED</span>
          <span className="px-2 py-0.5 text-[6px] font-bold uppercase border border-amber-500/30 text-amber-500 rounded-sm">OPERATOR APPROVAL REQUIRED</span>
        </div>
      </div>

      <div className="p-4 space-y-4">

        {/* What this does */}
        <div className="text-[7px] font-mono text-slate-500 bg-card border border-border/30 rounded-sm px-3 py-2 space-y-0.5">
          <div className="font-bold text-slate-400 uppercase text-[6px] tracking-widest mb-1">Test Write Spec</div>
          <div>📄 File: <span className="text-slate-300">{TEST_FILE_PATH}</span></div>
          <div>📁 Folder: <span className="text-slate-300">{TEST_FOLDER}</span></div>
          <div>🔒 riskLevel: LOW · source: SAFE_TEST_WRITE · executionStatus: NOT_EXECUTED</div>
          <div>❌ No OpenClaw · No browser · No trading · No unrestricted vault writes</div>
        </div>

        {/* Approval gate */}
        {phase === 'idle' && (
          <label className="flex items-start gap-3 cursor-pointer group">
            <input
              type="checkbox"
              checked={approvalChecked}
              onChange={e => setApprovalChecked(e.target.checked)}
              className="mt-0.5 accent-primary w-3.5 h-3.5 shrink-0"
            />
            <span className="text-[8px] font-mono text-slate-300 group-hover:text-slate-100 transition-colors">
              I confirm operator approval — write one test file to{' '}
              <code className="text-primary">{TEST_FILE_PATH}</code> using{' '}
              <code className="text-primary">obsidianWriteApprovedDraft</code> only.
              No execution, no dispatch, no OpenClaw.
            </span>
          </label>
        )}

        {/* Button */}
        {phase === 'idle' && (
          <button
            type="button"
            onClick={handleRunTestWrite}
            disabled={!approvalChecked}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary/20 border-2 border-primary/50 text-primary hover:bg-primary/30 disabled:opacity-30 disabled:cursor-not-allowed rounded-sm font-bold text-[11px] uppercase tracking-widest transition-colors"
          >
            <FlaskConical className="w-4 h-4" /> Run Safe Test Write
          </button>
        )}

        {/* Running */}
        {phase === 'running' && (
          <div className="flex items-center gap-2 text-[8px] font-mono text-primary py-2">
            <Loader2 className="w-3.5 h-3.5 animate-spin" /> Writing test file via obsidianWriteApprovedDraft…
          </div>
        )}

        {/* Success */}
        {phase === 'done' && result && (
          <div className="border border-primary/30 bg-primary/5 rounded-sm p-4 space-y-2">
            <div className="flex items-center gap-2 text-[9px] font-bold text-primary">
              <CheckCircle2 className="w-3.5 h-3.5" /> WRITE_COMPLETED
            </div>
            <div className="text-[7px] font-mono text-slate-400 space-y-0.5">
              <div>📄 filePath: <span className="text-slate-200">{result.filePath}</span></div>
              <div>🕐 timestamp: <span className="text-slate-300">{result.timestamp}</span></div>
              <div>✅ Evidence saved to localStorage key: <code className="text-primary/70">veridan_safe_test_writes</code></div>
            </div>
            <button type="button" onClick={reset} className="text-[7px] font-mono text-slate-500 hover:text-slate-300 underline mt-1">
              Reset
            </button>
          </div>
        )}

        {/* Error */}
        {phase === 'error' && (
          <div className="border border-destructive/30 bg-destructive/5 rounded-sm p-4 space-y-2">
            <div className="flex items-center gap-2 text-[9px] font-bold text-destructive">
              <XCircle className="w-3.5 h-3.5" /> WRITE_FAILED
            </div>
            <div className="text-[7px] font-mono text-destructive/70">{errorMsg}</div>
            <button type="button" onClick={reset} className="text-[7px] font-mono text-slate-500 hover:text-slate-300 underline mt-1">
              Reset
            </button>
          </div>
        )}

        {/* Footer */}
        <div className="text-[6px] font-mono text-slate-600 border-t border-border/20 pt-2 space-y-0.5">
          <div>backend: obsidianWriteApprovedDraft only · openclawDispatch: DISABLED · browserAutomation: DISABLED · trading: DISABLED</div>
          <div>evidence: localStorage[veridan_safe_test_writes] · auditRecord: saved by backend · riskLevel: LOW</div>
        </div>

      </div>
    </div>
  );
}