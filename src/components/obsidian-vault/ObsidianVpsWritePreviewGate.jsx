/**
 * ObsidianVpsWritePreviewGate
 * Controlled Write Preview Gate — preview/approval only.
 * Hard constraints:
 * - No real file writes
 * - No backend write call
 * - No VPS command execution
 * - No OpenClaw dispatch
 * - No Obsidian sync
 * - No credential display
 * - No browser automation
 * - No live mode
 * writeMode: PREVIEW_GATE_ONLY
 * writeStatus: NOT_ENABLED
 */

import React, { useState } from 'react';
import { CheckCircle2, Copy, Download, FileText, ShieldAlert } from 'lucide-react';

const CHECKLIST_ITEMS = [
  { key: 'ok',          label: 'VPS dry-run response is ok: true' },
  { key: 'vaultRoot',   label: 'wouldWritePath is under /root/veridans-mind-vault' },
  { key: 'allowlisted', label: 'Target folder is allowlisted' },
  { key: 'noSecrets',   label: 'Markdown contains no secrets' },
  { key: 'hashRecorded',label: 'previewHash recorded' },
  { key: 'evidenceRec', label: 'evidenceId recorded' },
  { key: 'rollback',    label: 'Rollback plan required before any future write' },
  { key: 'auditLog',    label: 'Audit log required before any future write' },
  { key: 'writeDisabled', label: 'Write endpoint still disabled' },
];

const STATUS_FIELDS = [
  { key: 'writeMode',       value: 'PREVIEW_GATE_ONLY',  color: 'text-amber-400' },
  { key: 'writeStatus',     value: 'NOT_ENABLED',         color: 'text-destructive' },
  { key: 'filesystemWrite', value: 'DISABLED',            color: 'text-destructive' },
  { key: 'executionStatus', value: 'NOT_EXECUTED',        color: 'text-destructive' },
  { key: 'dispatchStatus',  value: 'NOT_DISPATCHED',      color: 'text-destructive' },
  { key: 'obsidianSync',    value: 'DISABLED',            color: 'text-destructive' },
  { key: 'openClawDispatch',value: 'DISABLED',            color: 'text-destructive' },
];

function buildPacket(vpsResponse) {
  return {
    packetType: 'CONTROLLED_WRITE_PREVIEW_GATE',
    proposedAction: 'CREATE_OR_UPDATE_MARKDOWN',
    vaultRoot: vpsResponse.vaultRoot,
    targetFolder: vpsResponse.targetFolder,
    fileName: vpsResponse.fileName,
    wouldWritePath: vpsResponse.wouldWritePath,
    markdownBytes: vpsResponse.markdownBytes,
    previewHash: vpsResponse.previewHash || null,
    evidenceId: vpsResponse.evidenceId,
    writeMode: 'PREVIEW_GATE_ONLY',
    writeStatus: 'NOT_ENABLED',
    filesystemWrite: 'DISABLED',
    executionStatus: 'NOT_EXECUTED',
    dispatchStatus: 'NOT_DISPATCHED',
    obsidianSync: 'DISABLED',
    openClawDispatch: 'DISABLED',
    riskSummary: {
      riskTier: 'MEDIUM',
      rationale: 'Markdown write to governed vault path. Dry-run only. No execution attempted.',
    },
    rollbackRequirement: 'REQUIRED_BEFORE_FUTURE_WRITE — rollback plan not yet defined',
    auditBeforeWrite: 'REQUIRED_BEFORE_FUTURE_WRITE — audit log gate not yet implemented',
    safetyClaims: [
      'No real filesystem writes performed',
      'No VPS command execution',
      'No OpenClaw dispatch',
      'No Obsidian sync',
      'No credential display',
      'No browser automation',
      'No live mode',
      'Preview gate only — write endpoint disabled',
    ],
    generatedAt: new Date().toISOString(),
  };
}

function buildMarkdown(packet) {
  return `# Controlled Write Preview Gate
**Generated:** ${packet.generatedAt}
**packetType:** ${packet.packetType}

## Proposed Action
| Field | Value |
|---|---|
| proposedAction | ${packet.proposedAction} |
| vaultRoot | ${packet.vaultRoot} |
| targetFolder | ${packet.targetFolder} |
| fileName | ${packet.fileName} |
| wouldWritePath | ${packet.wouldWritePath} |
| markdownBytes | ${packet.markdownBytes} |
| previewHash | ${packet.previewHash || '(none)'} |
| evidenceId | ${packet.evidenceId} |

## Execution Status Lock
| Flag | Value |
|---|---|
| writeMode | ${packet.writeMode} |
| writeStatus | ${packet.writeStatus} |
| filesystemWrite | ${packet.filesystemWrite} |
| executionStatus | ${packet.executionStatus} |
| dispatchStatus | ${packet.dispatchStatus} |
| obsidianSync | ${packet.obsidianSync} |
| openClawDispatch | ${packet.openClawDispatch} |

## Risk Summary
- **Tier:** ${packet.riskSummary.riskTier}
- **Rationale:** ${packet.riskSummary.rationale}

## Requirements Before Any Future Write
- **Rollback:** ${packet.rollbackRequirement}
- **Audit:** ${packet.auditBeforeWrite}

## Safety Claims
${packet.safetyClaims.map(c => `- ✓ ${c}`).join('\n')}
`;
}

export default function ObsidianVpsWritePreviewGate({ vpsResponse }) {
  const [checked, setChecked] = useState({});
  const [copied, setCopied] = useState(false);

  if (!vpsResponse || !vpsResponse.ok) {
    return (
      <div className="bg-secondary/10 border border-border/40 rounded-sm px-4 py-3 text-[8px] font-mono text-slate-500">
        <ShieldAlert className="w-3.5 h-3.5 inline mr-1.5 text-slate-600" />
        Controlled Write Preview Gate — waiting for a successful VPS dry-run response (ok: true).
      </div>
    );
  }

  const packet = buildPacket(vpsResponse);
  const allChecked = CHECKLIST_ITEMS.every(i => checked[i.key]);

  const handleCopy = () => {
    navigator.clipboard.writeText(JSON.stringify(packet, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExportJson = () => {
    const blob = new Blob([JSON.stringify(packet, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `write-preview-gate-${packet.evidenceId}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportMd = () => {
    const blob = new Blob([buildMarkdown(packet)], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `write-preview-gate-${packet.evidenceId}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-card border border-amber-500/30 rounded-sm overflow-hidden font-mono">
      {/* Header */}
      <div className="bg-amber-500/10 px-4 py-2.5 flex items-center gap-2 border-b border-amber-500/20">
        <FileText className="w-4 h-4 text-amber-400 shrink-0" />
        <span className="text-[10px] font-bold uppercase tracking-widest text-amber-400">
          Controlled Write Preview Gate
        </span>
        <span className="ml-auto text-[7px] font-mono text-amber-400/60">PREVIEW_GATE_ONLY · NOT_ENABLED</span>
      </div>

      <div className="p-4 space-y-4">
        {/* Status strip */}
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-[8px]">
          {STATUS_FIELDS.map(s => (
            <span key={s.key} className="text-slate-500">
              {s.key}: <span className={`font-bold ${s.color}`}>{s.value}</span>
            </span>
          ))}
        </div>

        {/* Proposed action fields */}
        <div className="bg-secondary/20 border border-border/30 rounded-sm p-3 space-y-1.5">
          <div className="text-[7px] font-bold uppercase text-slate-500 mb-2">Proposed Action Preview</div>
          {[
            { label: 'proposedAction', val: 'CREATE_OR_UPDATE_MARKDOWN', highlight: 'text-amber-300' },
            { label: 'vaultRoot',      val: packet.vaultRoot },
            { label: 'targetFolder',   val: packet.targetFolder },
            { label: 'fileName',       val: packet.fileName },
            { label: 'wouldWritePath', val: packet.wouldWritePath, highlight: 'text-amber-300' },
            { label: 'markdownBytes',  val: String(packet.markdownBytes) },
            { label: 'previewHash',    val: packet.previewHash || '(none)' },
            { label: 'evidenceId',     val: packet.evidenceId },
          ].map(({ label, val, highlight }) => (
            <div key={label} className="flex items-start gap-2 text-[8px]">
              <span className="text-slate-500 shrink-0 w-28">{label}</span>
              <span className={`font-mono break-all ${highlight || 'text-slate-300'}`}>{val}</span>
            </div>
          ))}
        </div>

        {/* Risk summary */}
        <div className="bg-secondary/20 border border-border/30 rounded-sm px-3 py-2 space-y-1">
          <div className="text-[7px] font-bold uppercase text-slate-500">Risk Summary</div>
          <div className="text-[8px] text-slate-300">
            Tier: <span className="text-amber-400 font-bold">MEDIUM</span>
            <span className="text-slate-500 ml-2">— Markdown write to governed vault path. Dry-run only. No execution attempted.</span>
          </div>
        </div>

        {/* Requirements placeholders */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <div className="bg-destructive/5 border border-destructive/20 rounded-sm px-3 py-2">
            <div className="text-[7px] font-bold uppercase text-slate-500 mb-0.5">Rollback Requirement</div>
            <div className="text-[8px] text-destructive font-mono">REQUIRED_BEFORE_FUTURE_WRITE</div>
            <div className="text-[7px] text-slate-600 mt-0.5">Rollback plan not yet defined — placeholder only</div>
          </div>
          <div className="bg-destructive/5 border border-destructive/20 rounded-sm px-3 py-2">
            <div className="text-[7px] font-bold uppercase text-slate-500 mb-0.5">Audit-Before-Write Requirement</div>
            <div className="text-[8px] text-destructive font-mono">REQUIRED_BEFORE_FUTURE_WRITE</div>
            <div className="text-[7px] text-slate-600 mt-0.5">Audit log gate not yet implemented — placeholder only</div>
          </div>
        </div>

        {/* Operator checklist */}
        <div className="bg-secondary/20 border border-border/30 rounded-sm p-3 space-y-2">
          <div className="text-[7px] font-bold uppercase text-slate-500 mb-1">Operator Approval Checklist</div>
          {CHECKLIST_ITEMS.map(item => (
            <label key={item.key} className="flex items-start gap-2 cursor-pointer group">
              <input
                type="checkbox"
                checked={!!checked[item.key]}
                onChange={e => setChecked(prev => ({ ...prev, [item.key]: e.target.checked }))}
                className="mt-0.5 accent-green-500 w-3.5 h-3.5 shrink-0"
              />
              <span className={`text-[8px] leading-relaxed transition-colors ${checked[item.key] ? 'text-primary' : 'text-slate-400 group-hover:text-slate-200'}`}>
                {item.label}
              </span>
            </label>
          ))}
          <div className={`mt-2 text-[8px] font-bold font-mono text-center py-1.5 rounded-sm border ${
            allChecked
              ? 'text-primary border-primary/30 bg-primary/5'
              : 'text-slate-600 border-border/30 bg-secondary/10'
          }`}>
            {allChecked ? '✓ All checklist items confirmed — preview gate acknowledged' : 'Complete all checklist items to acknowledge preview gate'}
          </div>
        </div>

        {/* No write button disclaimer */}
        <div className="bg-destructive/5 border border-destructive/30 rounded-sm px-3 py-2 text-[8px] font-mono text-destructive text-center font-bold">
          NO WRITE BUTTON — Write endpoint disabled · No backend write call · No filesystem access
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-secondary/30 border border-border/40 text-slate-300 text-[8px] font-bold rounded-sm hover:border-border/80 transition-colors"
          >
            <Copy className="w-3 h-3" />
            {copied ? 'Copied!' : 'Copy Write Preview Packet'}
          </button>
          <button
            type="button"
            onClick={handleExportJson}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 border border-primary/30 text-primary text-[8px] font-bold rounded-sm hover:bg-primary/20 transition-colors"
          >
            <Download className="w-3 h-3" />
            Export JSON
          </button>
          <button
            type="button"
            onClick={handleExportMd}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 border border-primary/30 text-primary text-[8px] font-bold rounded-sm hover:bg-primary/20 transition-colors"
          >
            <FileText className="w-3 h-3" />
            Export Markdown
          </button>
        </div>
      </div>
    </div>
  );
}