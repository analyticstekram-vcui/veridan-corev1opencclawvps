/**
 * ObsidianVpsBridgeBaselineLock
 * Local baseline lock summary for VPS_OBSIDIAN_BRIDGE_BASELINE_V1.
 * UI-only · localStorage only · No backend mutation · No filesystem writes ·
 * No VPS execution · No Obsidian sync · No OpenClaw dispatch · No live mode.
 */

import React, { useState, useEffect } from 'react';
import { loadFromStorage, saveToStorage } from '../../utils/localStorageManager';
import { Lock, CheckCircle2, XCircle, Download, FileText, ShieldCheck } from 'lucide-react';

const STORAGE_KEY       = 'veridanVpsBridgeBaselineLock_V1';
const BASELINE_VERSION  = 'VPS_OBSIDIAN_BRIDGE_BASELINE_V1';
const LOCK_STATUS       = 'READY_FOR_OPERATOR_REVIEW';

// ─── Baseline items ────────────────────────────────────────────────────────────

const MODULE_ITEMS = [
  { id: 'packet_builder',    label: 'Packet builder present',         present: true },
  { id: 'path_validator',    label: 'Path validator present',         present: true },
  { id: 'dryrun_panel',      label: 'Dry-run result panel present',   present: true },
  { id: 'readiness_check',   label: 'Readiness checklist present',    present: true },
  { id: 'evidence_log',      label: 'Evidence log present',           present: true },
  { id: 'selftest_panel',    label: 'Self-test panel present',        present: true },
];

const SAFETY_ITEMS = [
  { id: 'fs_write',       label: 'Real filesystem writes',    value: 'DISABLED' },
  { id: 'vps_exec',       label: 'VPS command execution',     value: 'DISABLED' },
  { id: 'openclaw_disp',  label: 'OpenClaw dispatch',         value: 'DISABLED' },
  { id: 'obsidian_sync',  label: 'Obsidian sync',             value: 'DISABLED' },
  { id: 'cred_handling',  label: 'Credential handling',       value: 'DISABLED' },
  { id: 'browser_auto',   label: 'Browser automation',        value: 'DISABLED' },
  { id: 'live_mode',      label: 'Live mode',                 value: 'DISABLED' },
];

// ─── Helpers ───────────────────────────────────────────────────────────────────

function simpleHash(str) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16).padStart(8, '0').toUpperCase();
}

function buildBaselineRecord(ts, operatorAck) {
  const payload = {
    baselineVersion: BASELINE_VERSION,
    lockStatus: LOCK_STATUS,
    lockedAt: ts,
    operatorAcknowledged: operatorAck,
    modules: MODULE_ITEMS.map(m => ({ id: m.id, label: m.label, present: m.present })),
    safetyControls: SAFETY_ITEMS.map(s => ({ id: s.id, label: s.label, value: s.value })),
    safetyClaims: [
      'UI-only baseline lock',
      'No backend mutation',
      'No filesystem writes',
      'No VPS command execution',
      'No Obsidian sync',
      'No OpenClaw dispatch',
      'No credential handling',
      'No browser automation',
      'No live mode',
      'localStorage only',
    ],
  };
  const hash = simpleHash(JSON.stringify(payload) + ts);
  return { ...payload, previewHash: `sha-preview-${hash}` };
}

function buildMarkdown(record) {
  const moduleLines  = record.modules.map(m => `- [x] ${m.label}`).join('\n');
  const safetyLines  = record.safetyControls.map(s => `- ${s.label}: **${s.value}**`).join('\n');
  const claimLines   = record.safetyClaims.map(c => `- ${c}`).join('\n');
  return `---
baselineVersion: ${record.baselineVersion}
lockStatus: ${record.lockStatus}
lockedAt: ${record.lockedAt}
operatorAcknowledged: ${record.operatorAcknowledged}
previewHash: ${record.previewHash}
---

# ${record.baselineVersion}

**Lock Status:** ${record.lockStatus}  
**Locked At:** ${new Date(record.lockedAt).toLocaleString()}  
**Preview Hash:** \`${record.previewHash}\`  
**Operator Acknowledged:** ${record.operatorAcknowledged ? 'YES' : 'NO'}

## Module Components

${moduleLines}

## Safety Controls

${safetyLines}

## Safety Claims

${claimLines}
`;
}

// ─── Component ─────────────────────────────────────────────────────────────────

export default function ObsidianVpsBridgeBaselineLock() {
  const [ack, setAck]           = useState(false);
  const [saved, setSaved]       = useState(null);

  useEffect(() => {
    const existing = loadFromStorage(STORAGE_KEY);
    if (existing && existing.lockedAt) setSaved(existing);
  }, []);

  const handleLock = () => {
    if (!ack) return;
    const ts     = new Date().toISOString();
    const record = buildBaselineRecord(ts, true);
    saveToStorage(STORAGE_KEY, record);
    setSaved(record);
  };

  const handleExportJson = () => {
    const record = saved || buildBaselineRecord(new Date().toISOString(), ack);
    const blob   = new Blob([JSON.stringify(record, null, 2)], { type: 'application/json' });
    const url    = URL.createObjectURL(blob);
    const a      = document.createElement('a');
    a.href       = url;
    a.download   = `vps-bridge-baseline-v1-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportMd = () => {
    const record = saved || buildBaselineRecord(new Date().toISOString(), ack);
    const md     = buildMarkdown(record);
    const blob   = new Blob([md], { type: 'text/markdown' });
    const url    = URL.createObjectURL(blob);
    const a      = document.createElement('a');
    a.href       = url;
    a.download   = `VPS_OBSIDIAN_BRIDGE_BASELINE_V1-${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4 font-mono">

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="text-[9px] font-bold uppercase text-slate-300 tracking-widest flex items-center gap-1.5">
            <Lock className="w-3 h-3 text-primary" />
            VPS Bridge Baseline Lock
          </div>
          <div className="text-[8px] text-slate-600 mt-0.5">
            {BASELINE_VERSION} · {LOCK_STATUS}
          </div>
        </div>
        <span className="px-2 py-1 bg-primary/10 border border-primary/30 text-primary text-[7px] font-bold uppercase rounded-sm shrink-0">
          BASELINE_V1
        </span>
      </div>

      {/* Status strip */}
      <div className="bg-secondary/20 border border-border/40 rounded-sm px-3 py-2 flex flex-wrap gap-x-4 gap-y-1 text-[8px]">
        <span className="text-slate-500">baselineVersion: <span className="text-primary font-bold">{BASELINE_VERSION}</span></span>
        <span className="text-slate-500">lockStatus: <span className="text-amber-400 font-bold">{LOCK_STATUS}</span></span>
        {saved?.lockedAt && (
          <span className="text-slate-500">lockedAt: <span className="text-slate-300">{new Date(saved.lockedAt).toLocaleString()}</span></span>
        )}
        {saved?.previewHash && (
          <span className="text-slate-500">hash: <span className="text-slate-400 font-mono">{saved.previewHash}</span></span>
        )}
      </div>

      {/* Module components */}
      <div className="bg-card border border-border/40 rounded-sm p-3 space-y-2">
        <div className="text-[8px] font-bold uppercase text-slate-400">Module Components</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
          {MODULE_ITEMS.map(m => (
            <div key={m.id} className="flex items-center gap-2 bg-primary/5 border border-primary/20 rounded-sm px-3 py-1.5">
              <CheckCircle2 className="w-3 h-3 text-primary shrink-0" />
              <span className="text-[8px] text-slate-200">{m.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Safety controls */}
      <div className="bg-card border border-border/40 rounded-sm p-3 space-y-2">
        <div className="text-[8px] font-bold uppercase text-slate-400">Safety Controls</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
          {SAFETY_ITEMS.map(s => (
            <div key={s.id} className="flex items-center justify-between bg-destructive/5 border border-destructive/20 rounded-sm px-3 py-1.5">
              <div className="flex items-center gap-2">
                <XCircle className="w-3 h-3 text-destructive shrink-0" />
                <span className="text-[8px] text-slate-300">{s.label}</span>
              </div>
              <span className="text-[7px] font-bold text-destructive">{s.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Preview hash */}
      {saved?.previewHash && (
        <div className="bg-card border border-border/40 rounded-sm p-3 space-y-1">
          <div className="text-[8px] font-bold uppercase text-slate-400 flex items-center gap-1.5">
            <ShieldCheck className="w-3 h-3 text-primary" /> Preview Hash
          </div>
          <div className="text-[9px] font-mono text-primary/80 bg-secondary/30 border border-border/30 rounded-sm px-3 py-2 break-all">
            {saved.previewHash}
          </div>
          <div className="text-[7px] text-slate-600">Deterministic hash of baseline payload · Not a cryptographic signature · UI-only</div>
        </div>
      )}

      {/* Operator acknowledgment */}
      <div className={`border rounded-sm p-3 flex items-start gap-3 ${ack ? 'bg-primary/5 border-primary/20' : 'bg-secondary/10 border-border/40'}`}>
        <input
          type="checkbox"
          id="vps-baseline-ack"
          checked={ack}
          onChange={e => setAck(e.target.checked)}
          className="mt-0.5 accent-green-500 w-4 h-4 shrink-0"
        />
        <label htmlFor="vps-baseline-ack" className="text-[9px] text-slate-300 cursor-pointer leading-relaxed">
          <span className="font-bold text-slate-100">Operator Acknowledgment — </span>
          I confirm this baseline lock is a governance record only. All listed safety controls are in effect.
          No real execution, filesystem write, VPS command, credential handling, or live dispatch has occurred or will occur from this module.
          This baseline is for operator review and planning purposes only.
        </label>
      </div>

      {/* Lock button */}
      <button
        type="button"
        onClick={handleLock}
        disabled={!ack}
        className="w-full py-2.5 bg-primary/10 border border-primary/30 text-primary text-[10px] font-bold uppercase tracking-widest rounded-sm hover:bg-primary/20 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
      >
        <Lock className="w-3.5 h-3.5" />
        {saved ? 'Re-Lock Baseline Record' : 'Lock Baseline Record (localStorage only)'}
      </button>

      {!ack && (
        <div className="text-[8px] text-amber-400 font-mono text-center">Operator acknowledgment required before locking baseline.</div>
      )}

      {/* Saved confirmation */}
      {saved && (
        <div className="bg-primary/5 border border-primary/20 rounded-sm px-4 py-3 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
          <div className="text-[9px] text-primary">
            Baseline locked · {new Date(saved.lockedAt).toLocaleString()} · {saved.previewHash}
          </div>
        </div>
      )}

      {/* Export buttons */}
      <div className="flex gap-2 flex-wrap">
        <button
          type="button"
          onClick={handleExportJson}
          className="flex items-center gap-2 px-4 py-2 bg-secondary/30 border border-border/40 text-slate-300 text-[9px] font-bold rounded-sm hover:text-slate-100 hover:border-border/80 transition-colors"
        >
          <Download className="w-3.5 h-3.5" />
          Export Baseline JSON
        </button>
        <button
          type="button"
          onClick={handleExportMd}
          className="flex items-center gap-2 px-4 py-2 bg-secondary/30 border border-border/40 text-slate-300 text-[9px] font-bold rounded-sm hover:text-slate-100 hover:border-border/80 transition-colors"
        >
          <FileText className="w-3.5 h-3.5" />
          Export Baseline Markdown
        </button>
      </div>

      {/* Footer */}
      <div className="bg-card border border-border/30 rounded-sm px-4 py-3 text-[8px] font-mono text-slate-500 leading-relaxed">
        <span className="text-destructive font-bold">Hard Constraints: </span>
        UI-only · No backend mutation · No filesystem writes · No VPS execution · No Obsidian sync ·
        No OpenClaw dispatch · No credential handling · No browser automation · No live mode · localStorage only.
      </div>
    </div>
  );
}